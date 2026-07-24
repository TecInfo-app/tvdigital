/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";

async function scrapeWebsite(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro de resposta do site: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const isXml = text.trim().startsWith('<?xml') || text.includes('<rss') || text.includes('<feed') || text.includes('<rdf:RDF');
    const items: any[] = [];
    const $ = cheerio.load(text, isXml ? { xmlMode: true } : {});

    const fallbackPhotos = [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1495020689067-958ab52e3267?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200'
    ];

    const siteOgImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
    let absoluteOgImage = siteOgImage;
    if (absoluteOgImage && absoluteOgImage.startsWith('//')) {
      absoluteOgImage = `https:${absoluteOgImage}`;
    } else if (absoluteOgImage && !absoluteOgImage.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        absoluteOgImage = `${urlObj.protocol}//${urlObj.host}${absoluteOgImage.startsWith('/') ? '' : '/'}${absoluteOgImage}`;
      } catch (_) {}
    }

    const getValidThumbnail = (candidate: string, index: number) => {
      if (candidate && candidate.startsWith('http') && !candidate.endsWith('.br') && !candidate.endsWith('.com') && !candidate.endsWith('.org') && !candidate.includes('logo') && !candidate.includes('icon') && !candidate.includes('avatar') && !candidate.includes('banner') && candidate !== url && candidate !== `${url}/`) {
        return candidate;
      }
      return fallbackPhotos[index % fallbackPhotos.length];
    };

    const lowerUrl = url.toLowerCase();
    const isGlobo = lowerUrl.includes('globo.com') || lowerUrl.includes('g1.') || lowerUrl.includes('ge.');

    if (isXml) {
      const xmlItems = $('item, entry');
      xmlItems.each((i, el) => {
        if (items.length >= 10) return;
        const $el = $(el);
        const title = $el.find('title').text().trim();
        const link = $el.find('link').attr('href') || $el.find('link').text().trim() || $el.find('guid').text().trim();
        const description = $el.find('description').text().trim() || $el.find('summary').text().trim() || $el.find('content').text().trim();
        const pubDate = $el.find('pubDate').text().trim() || $el.find('updated').text().trim() || 'Hoje';

        let imgUrl = '';
        const mediaContent = $el.find('media\\:content, content').attr('url');
        const mediaThumb = $el.find('media\\:thumbnail, thumbnail').attr('url');
        const enclosure = $el.find('enclosure').attr('url');
        
        if (mediaContent) imgUrl = mediaContent;
        else if (mediaThumb) imgUrl = mediaThumb;
        else if (enclosure) imgUrl = enclosure;

        if (!imgUrl && description) {
          const $desc = cheerio.load(description);
          const $img = $desc('img').first();
          if ($img.length > 0) {
            imgUrl = $img.attr('src') || $img.attr('data-src') || '';
          }
        }

        if (title) {
          items.push({
            title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
            description: (description || 'Confira os detalhes desta matéria no portal oficial.').replace(/<[^>]*>?/gm, '').substring(0, 200),
            pubDate: pubDate || 'Hoje',
            link: link.startsWith('http') ? link : url,
            thumbnail: getValidThumbnail(imgUrl, items.length)
          });
        }
      });
    }

    if (items.length === 0 && isGlobo) {
      $('.feed-post, .bstn-fd-item').each((i, el) => {
        if (items.length >= 10) return;
        const container = $(el);
        const titleLink = container.find('.feed-post-link, .feed-post-body-title a, a.feed-post-link').first();
        const titleText = titleLink.text().trim();
        let articleUrl = titleLink.attr('href') || '';
        const summaryText = container.find('.feed-post-body-resumo, .feed-post-metadata-resumo').text().trim();
        
        let imgUrl = '';
        const imgTag = container.find('img').first();
        if (imgTag.length > 0) {
          imgUrl = imgTag.attr('data-src') || imgTag.attr('src') || '';
        }
        if (!imgUrl) {
          const sourceTag = container.find('source').first();
          if (sourceTag.length > 0) {
            const srcset = sourceTag.attr('srcset') || sourceTag.attr('data-srcset') || '';
            if (srcset) imgUrl = srcset.split(',')[0].trim().split(' ')[0];
          }
        }

        if (titleText) {
          items.push({
            title: titleText,
            description: summaryText || 'Confira os detalhes desta matéria no portal oficial.',
            pubDate: 'Hoje',
            link: articleUrl.startsWith('http') ? articleUrl : `https:${articleUrl}`,
            thumbnail: getValidThumbnail(imgUrl, items.length)
          });
        }
      });
    }

    if (items.length === 0) {
      $('article, .post, .card, .story-card, .news-item, .entry, div[class*="item"], div[class*="card"], li, section').each((i, el) => {
        if (items.length >= 10) return;

        const container = $(el);
        const heading = container.find('h1, h2, h3, h4, a[class*="title"], .title').first();
        const titleText = heading.text().trim();
        if (!titleText || titleText.length < 8 || titleText.length > 250) return;

        if (items.some(item => item.title === titleText)) return;

        const linkEl = container.find('a').first();
        let articleUrl = linkEl.attr('href') || '';
        if (articleUrl && !articleUrl.startsWith('http')) {
          try {
            const urlObj = new URL(url);
            articleUrl = `${urlObj.protocol}//${urlObj.host}${articleUrl.startsWith('/') ? '' : '/'}${articleUrl}`;
          } catch (_) {
            articleUrl = url;
          }
        }

        const summaryText = container.find('p, .excerpt, .summary, .resumo, .description').first().text().trim();

        let imgUrl = '';
        const parseImgSrc = (el: any) => {
          const $img = $(el);
          let src = $img.attr('data-src') || $img.attr('src') || $img.attr('data-original') || $img.attr('data-lazy-src') || '';
          if (!src) {
            const srcset = $img.attr('srcset') || $img.attr('data-srcset') || '';
            if (srcset) {
              const parts = srcset.split(',');
              src = parts[parts.length - 1].trim().split(' ')[0];
            }
          }
          return src;
        };

        const imgTag = container.find('img').first();
        if (imgTag.length > 0) {
          imgUrl = parseImgSrc(imgTag);
        }

        if (!imgUrl) {
          const sourceTag = container.find('source').first();
          if (sourceTag.length > 0) {
            const srcset = sourceTag.attr('srcset') || sourceTag.attr('data-srcset') || '';
            if (srcset) imgUrl = srcset.split(',')[0].trim().split(' ')[0];
          }
        }

        if (!imgUrl) {
          const parentImg = container.parent().find('img').first();
          if (parentImg.length > 0) imgUrl = parseImgSrc(parentImg);
        }

        if (imgUrl && imgUrl.startsWith('//')) {
          imgUrl = `https:${imgUrl}`;
        }
        if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
          try {
            const urlObj = new URL(url);
            imgUrl = `${urlObj.protocol}//${urlObj.host}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
          } catch (_) {}
        }

        items.push({
          title: titleText,
          description: summaryText || 'Confira os detalhes desta matéria no portal oficial.',
          pubDate: 'Hoje',
          link: articleUrl || url,
          thumbnail: getValidThumbnail(imgUrl, items.length)
        });
      });
    }

    if (items.length === 0) {
      items.push({
        title: `Destaques do portal: ${url}`,
        description: 'Conteúdo coletado e convertido em tempo real para o formato de exibição em slides.',
        pubDate: 'Agora',
        link: url,
        thumbnail: absoluteOgImage || fallbackPhotos[0]
      });
    }

    return items;
  } catch (error) {
    console.error('Error in scraper function:', error);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Scraper and Converter of regular websites to RSS-like JSON
  app.get("/api/scrape-rss", async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: "Falta o parâmetro 'url'." });
    }

    try {
      // Auto-prefix protocol if missing
      let formattedUrl = targetUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      console.log(`[Scraper] Iniciando scraping do site: ${formattedUrl}`);
      const newsItems = await scrapeWebsite(formattedUrl);
      
      return res.json({
        status: "ok",
        feed: {
          title: `Feed Convertido de: ${new URL(formattedUrl).hostname}`,
          link: formattedUrl,
          description: "Feed gerado dinamicamente via Conversor Smart RSS integrado"
        },
        items: newsItems
      });
    } catch (err: any) {
      console.error(`[Scraper Error] Falha ao processar ${targetUrl}:`, err.message);
      return res.status(500).json({ 
        error: "Falha ao converter o site em RSS.", 
        details: err.message 
      });
    }
  });

  // API Route: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dev server and production file assets delivery
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Dev Server] Vite middleware montado.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("[Prod Server] Servindo arquivos estáticos de 'dist'.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Rodando com sucesso na porta ${PORT}`);
  });
}

startServer();
