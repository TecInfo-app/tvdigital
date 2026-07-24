import { MediaItem } from '../types';

/**
 * Normalizes an image URL to be absolute
 */
function getAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  try {
    const urlObj = new URL(baseUrl);
    return `${urlObj.protocol}//${urlObj.host}${url.startsWith('/') ? '' : '/'}${url}`;
  } catch (_) {
    return url;
  }
}

/**
 * Gets a beautiful fallback image based on index
 */
function getFallbackThumbnail(index: number): string {
  const fallbackPhotos = [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80', // News / Journalism
    'https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=800&q=80', // Newspaper / Coffee
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', // Tech / Globe
    'https://images.unsplash.com/photo-1476242906366-d8eb64c2f661?auto=format&fit=crop&w=800&q=80', // Digital Media
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80', // Global News
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
  ];
  return fallbackPhotos[index % fallbackPhotos.length];
}

/**
 * Client-side Scraper and RSS-XML Parser using DOMParser and free CORS proxies.
 * Falls back gracefully to multiple proxies (allorigins.win, corsproxy.io) to guarantee uptime.
 */
export async function clientSideScrape(targetUrl: string): Promise<any> {
  let formattedUrl = targetUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // We will try multiple proxies to ensure maximum reliability and redundancy
  const proxies = [
    // 1. AllOrigins (Very reliable CORS proxy)
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    // 2. Corsproxy.io (Super fast, clean proxy)
    (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    // 3. direct (just in case)
    (url: string) => url
  ];

  let htmlText = '';
  let fetchError = null;

  for (const getProxyUrl of proxies) {
    try {
      const proxyUrl = getProxyUrl(formattedUrl);
      console.log(`[Client Scraper] Fetching via proxy: ${proxyUrl}`);
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      htmlText = await res.text();
      if (htmlText && htmlText.trim().length > 100) {
        // Success!
        break;
      }
    } catch (e: any) {
      console.warn(`[Client Scraper] Proxy failed: ${e.message}`);
      fetchError = e;
    }
  }

  if (!htmlText) {
    throw fetchError || new Error("Não foi possível acessar a URL informada usando proxies CORS.");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // Check if it's actually an XML RSS Feed inside HTML tags (sometimes raw XML is returned inside text)
  const isXml = htmlText.trim().startsWith('<?xml') || htmlText.includes('<rss') || htmlText.includes('<feed');
  if (isXml) {
    // Parse XML Feed
    const xmlDoc = parser.parseFromString(htmlText, 'text/xml');
    const items: any[] = [];
    const channelTitle = xmlDoc.querySelector('channel > title')?.textContent || xmlDoc.querySelector('feed > title')?.textContent || new URL(formattedUrl).hostname;
    
    // Support RSS 2.0 and Atom feeds
    const entries = xmlDoc.querySelectorAll('item, entry');
    entries.forEach((el, index) => {
      if (items.length >= 10) return;
      
      const title = el.querySelector('title')?.textContent || '';
      let link = el.querySelector('link')?.textContent || el.querySelector('link')?.getAttribute('href') || '';
      const description = el.querySelector('description, summary')?.textContent || '';
      
      // Get image from enclosure or media:content or standard tags
      let imgUrl = el.querySelector('enclosure')?.getAttribute('url') || '';
      if (!imgUrl) {
        const mediaContent = el.querySelector('content, thumbnail'); // media:content / media:thumbnail
        if (mediaContent) {
          imgUrl = mediaContent.getAttribute('url') || mediaContent.textContent || '';
        }
      }
      
      // Find embedded images inside description
      if (!imgUrl && description) {
        const descDoc = parser.parseFromString(description, 'text/html');
        const embeddedImg = descDoc.querySelector('img');
        if (embeddedImg) {
          imgUrl = embeddedImg.getAttribute('src') || '';
        }
      }

      items.push({
        title,
        description: description.replace(/<[^>]*>/g, '').trim().substring(0, 180) + '...',
        pubDate: el.querySelector('pubDate, updated, published')?.textContent || 'Recente',
        link,
        thumbnail: imgUrl ? getAbsoluteUrl(imgUrl, formattedUrl) : getFallbackThumbnail(index)
      });
    });

    return {
      status: 'ok',
      feed: {
        title: channelTitle,
        link: formattedUrl,
        description: 'Feed RSS processado inteiramente no navegador'
      },
      items
    };
  }

  // It's a regular webpage! Perform custom HTML scraping (client-side DOM querying)
  const items: any[] = [];

  // Try standard selectors for major portals like G1, R7, CNN, etc.
  const g1FeedPosts = doc.querySelectorAll('.feed-post, .bstn-fd-item, article, .post, .card, .story-card');
  g1FeedPosts.forEach((container, index) => {
    if (items.length >= 10) return;

    const titleEl = container.querySelector('.feed-post-link, .feed-post-body-title a, a.feed-post-link, h1, h2, h3, h4, .title, a[class*="title"]');
    if (!titleEl) return;

    const titleText = titleEl.textContent?.trim() || '';
    if (!titleText || titleText.length < 8 || titleText.length > 250) return;

    // Avoid duplicates
    if (items.some(item => item.title === titleText)) return;

    let articleUrl = titleEl.getAttribute('href') || '';
    if (!articleUrl) {
      const linkEl = container.querySelector('a');
      if (linkEl) articleUrl = linkEl.getAttribute('href') || '';
    }
    articleUrl = getAbsoluteUrl(articleUrl, formattedUrl);

    let summaryText = container.querySelector('.feed-post-body-resumo, .feed-post-metadata-resumo, p, .excerpt, .summary, .resumo, .description')?.textContent?.trim() || '';
    
    let imgUrl = '';
    const imgTag = container.querySelector('img');
    if (imgTag) {
      imgUrl = imgTag.getAttribute('data-src') || imgTag.getAttribute('src') || imgTag.getAttribute('data-original') || '';
    }
    if (!imgUrl) {
      const sourceTag = container.querySelector('source');
      if (sourceTag) {
        const srcset = sourceTag.getAttribute('srcset') || sourceTag.getAttribute('data-srcset') || '';
        if (srcset) imgUrl = srcset.split(',')[0].trim().split(' ')[0];
      }
    }

    imgUrl = getAbsoluteUrl(imgUrl, formattedUrl);

    items.push({
      title: titleText,
      description: summaryText || 'Confira os detalhes desta matéria no portal oficial.',
      pubDate: 'Hoje',
      link: articleUrl || formattedUrl,
      thumbnail: imgUrl ? imgUrl : getFallbackThumbnail(items.length)
    });
  });

  // If we couldn't parse anything, generate a nice cover slide
  if (items.length === 0) {
    let ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.querySelector('title')?.textContent || '';
    let ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || doc.querySelector('meta[name="description"]')?.getAttribute('content') || 'Conteúdo extraído em tempo real.';
    let ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

    items.push({
      title: ogTitle || `Destaques do portal: ${new URL(formattedUrl).hostname}`,
      description: ogDesc,
      pubDate: 'Agora',
      link: formattedUrl,
      thumbnail: ogImage ? getAbsoluteUrl(ogImage, formattedUrl) : getFallbackThumbnail(0)
    });
  }

  return {
    status: 'ok',
    feed: {
      title: doc.querySelector('title')?.textContent || `Feed de ${new URL(formattedUrl).hostname}`,
      link: formattedUrl,
      description: "Feed gerado dinamicamente em tempo real (100% Client-Side)"
    },
    items
  };
}
