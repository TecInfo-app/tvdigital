/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, AlertCircle, RefreshCw, Radio, Sparkles } from 'lucide-react';
import { getApiUrl } from '../firebase';
import { clientSideScrape } from '../utils/scraper';

interface WidgetRendererProps {
  url: string;
  name: string;
  className?: string;
  key?: string | number;
  items?: Array<{ title: string; description: string; thumbnail?: string; pubDate?: string }>;
  rssOptions?: {
    showTitle: boolean;
    showDescription: boolean;
    showImage: boolean;
    showDate: boolean;
    itemDuration: number;
  };
}

interface RSSItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  thumbnail?: string;
  enclosure?: {
    link?: string;
  };
}

// Fallback high-quality local feeds in Portuguese to guarantee a beautiful display
const SIMULATED_FEEDS: RSSItem[] = [
  {
    title: "Mercado Financeiro: Bolsa opera em alta histórica impulsionada por tecnologia",
    description: "O índice de referência subiu 1.8% com forte fluxo de investimento estrangeiro e otimismo sobre taxas de juros no setor de infraestrutura e serviços.",
    pubDate: "Hoje, 10:45",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Inovação Digital: Nova tecnologia de transmissão CDN reduz latência em 40%",
    description: "Especialistas em sinalização corporativa anunciam que novos roteadores inteligentes reduzem pela metade o consumo de banda de vídeo 4K.",
    pubDate: "Hoje, 09:15",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Previsão do Tempo: Frente fria avança trazendo estabilidade nas capitais",
    description: "Temperaturas permanecem amenas com umidade controlada, ideal para anúncios em painéis externos e ativações comerciais urbanas.",
    pubDate: "Hoje, 08:30",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&q=80&w=600"
  }
];

// Helper to completely strip HTML tags, links, images and entities for TV Box WebViews
function cleanText(rawHtml: string): string {
  if (!rawHtml) return "";
  return rawHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // strip all HTML tags including <a> and <img>
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default function WidgetRenderer({ url, name, className = "", items: itemsProp, rssOptions }: WidgetRendererProps) {
  const [items, setItems] = useState<RSSItem[]>([]);
  const [feedTitle, setFeedTitle] = useState(name);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirectMedia = /\.(jpg|jpeg|png|webp|gif|mp4|webm|mov)(\?.*)?$/i.test(url);
  const isRss = !isDirectMedia && (
    url.toLowerCase().includes('rss') || 
    url.toLowerCase().includes('xml') || 
    url.toLowerCase().includes('feed') || 
    url.toLowerCase().includes('news') ||
    url.toLowerCase().includes('convert=rss') ||
    url.toLowerCase().includes('#convert-rss') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  );

  useEffect(() => {
    if (!isRss) return;

    setIsLoading(true);
    setError(null);

    if (itemsProp && itemsProp.length > 0) {
      setItems(itemsProp as RSSItem[]);
      setIsLoading(false);
      return;
    }

    const targetUrl = url.trim();
    
    // All website URLs (Abrasel, R7, G1, etc.) use backend HTML scraping / RSS conversion
    const isRegularWebpage = 
      !targetUrl.toLowerCase().includes('.xml') && 
      !targetUrl.toLowerCase().includes('feed=') &&
      (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'));

    let apiUrl = '';
    if (isRegularWebpage) {
      // Use our high-tech server-side scraper endpoint
      apiUrl = getApiUrl(`/api/scrape-rss?url=${encodeURIComponent(targetUrl)}`);
    } else {
      // Standard direct XML to JSON proxy
      apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
    }

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar a transmissão do feed.');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const parsedItems = data.items.map((item: any, idx: number) => ({
            title: cleanText(item.title || ""),
            description: cleanText(item.description || ""),
            pubDate: item.pubDate || "Recente",
            link: item.link || "#",
            thumbnail: item.thumbnail && item.thumbnail.startsWith('http') 
              ? item.thumbnail 
              : item.enclosure?.link && item.enclosure.link.startsWith('http')
              ? item.enclosure.link
              : SIMULATED_FEEDS[idx % SIMULATED_FEEDS.length].thumbnail
          }));
          setItems(parsedItems);
          if (data.feed && data.feed.title) {
            setFeedTitle(data.feed.title);
          }
          setIsLoading(false);
        } else {
          throw new Error("Dados inválidos do backend");
        }
      })
      .catch((err) => {
        console.warn('Backend API RSS failed, attempting browser client-side scraping fallback:', err);
        
        // Dynamic client-side web scraper fallback via public CORS proxies
        clientSideScrape(targetUrl)
          .then((data) => {
            if (data.status === 'ok' && data.items && data.items.length > 0) {
              const parsedItems = data.items.map((item: any, idx: number) => ({
                title: cleanText(item.title || ""),
                description: cleanText(item.description || ""),
                pubDate: item.pubDate || "Recente",
                link: item.link || "#",
                thumbnail: item.thumbnail && item.thumbnail.startsWith('http') 
                  ? item.thumbnail 
                  : SIMULATED_FEEDS[idx % SIMULATED_FEEDS.length].thumbnail
              }));
              setItems(parsedItems);
              if (data.feed && data.feed.title) {
                setFeedTitle(data.feed.title);
              }
            } else {
              throw new Error("Scraper client-side also failed to parse items");
            }
            setIsLoading(false);
          })
          .catch((scrapeErr) => {
            console.error('All scrape attempts failed (Backend & Client-side):', scrapeErr);
            if (itemsProp && itemsProp.length > 0) {
              setItems(itemsProp.map((it, idx) => ({
                title: cleanText(it.title),
                description: cleanText(it.description),
                pubDate: it.pubDate || "Recente",
                link: "#",
                thumbnail: it.thumbnail && it.thumbnail.startsWith('http') ? it.thumbnail : SIMULATED_FEEDS[idx % SIMULATED_FEEDS.length].thumbnail
              })));
              setFeedTitle(name);
            } else {
              setItems(SIMULATED_FEEDS);
              setFeedTitle(`${name} (Modo Offline)`);
            }
            setIsLoading(false);
          });
      });
  }, [url, name, isRss, itemsProp]);

  // Slideshow interval for RSS news articles
  useEffect(() => {
    if (items.length <= 1) return;
    const durationMs = (rssOptions?.itemDuration || 15) * 1000;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, durationMs);
    return () => clearInterval(interval);
  }, [items, rssOptions?.itemDuration]);

  // Case 1: Standard iframe widget (Web Links)
  if (!isRss) {
    return (
      <div className={`w-full h-full bg-white relative ${className}`}>
        <iframe 
          src={url}
          title={name}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerPolicy="no-referrer"
        />
        {/* Subtle watermark to show it's an embedded interactive display */}
        <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-500 pointer-events-none flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
          <span>WIDGET ATIVO: {name.toUpperCase()}</span>
        </div>
      </div>
    );
  }

  // Case 2: RSS News Ticker & Sliding Display (RSS Links)
  const currentItem = items[currentIndex];

  if (isLoading) {
    return (
      <div className={`w-full h-full relative overflow-hidden flex flex-col items-center justify-center text-gray-900 p-12 select-none ${className}`}>
        <div className="flex flex-col items-center gap-4 text-center animate-pulse">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
          <h3 className="font-montserrat font-bold text-lg text-gray-900">Sincronizando Feed</h3>
          <p className="font-inter text-xs text-gray-500 max-w-xs leading-relaxed">
            Coletando notícias de destaque e convertendo imagens em tempo real para a sua tela.
          </p>
        </div>
      </div>
    );
  }

  // Clean display title for header badge
  const displayTitle = (feedTitle || name || 'NOTÍCIAS')
    .replace(/feed\s*convertido\s*de:\s*/gi, '@')
    .trim();

  return (
    <div className={`w-full h-full flex flex-row bg-slate-900 overflow-hidden text-white select-none ${className}`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
      
      {/* Left side: Image */}
      {(rssOptions?.showImage ?? true) && (
        <div className="w-1/2 h-full relative bg-slate-950" style={{ width: '50%', height: '100%', position: 'relative' }}>
          {currentItem?.thumbnail ? (
            <img 
              src={currentItem.thumbnail} 
              alt="Notícia" 
              className="w-full h-full object-cover transition-transform duration-[15000ms] ease-out scale-105"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="text-slate-500 font-bold text-2xl">SEM IMAGEM</span>
            </div>
          )}
        </div>
      )}

      {/* Right side: News Content */}
      <div className={`${(rssOptions?.showImage ?? true) ? 'w-1/2' : 'w-full'} h-full flex flex-col justify-center px-12 md:px-16 space-y-6 bg-slate-900 relative shadow-2xl`} style={{ width: (rssOptions?.showImage ?? true) ? '50%' : '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4rem', backgroundColor: '#0f172a', zIndex: 10 }}>
        {/* Decorative accent */}
        <div className="w-16 h-2 bg-blue-600 rounded-full mb-4" style={{ width: '4rem', height: '0.5rem', backgroundColor: '#2563eb', borderRadius: '9999px' }}></div>

        {(rssOptions?.showDate ?? true) && currentItem?.pubDate && (
           <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
             {currentItem.pubDate}
           </div>
        )}

        {(rssOptions?.showTitle ?? true) && (
          <h1 
            className="font-montserrat font-black text-3xl md:text-4xl lg:text-6xl leading-tight tracking-tight text-white"
            style={{ color: '#ffffff', wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {currentItem?.title || 'Buscando matérias do feed...'}
          </h1>
        )}

        {(rssOptions?.showDescription ?? true) && (
          <p 
            className="font-inter text-lg md:text-xl lg:text-2xl text-slate-300 leading-relaxed font-normal tracking-wide pt-2"
            style={{ color: '#cbd5e1', wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {currentItem?.description || 'Acesse o feed de transmissão para exibir a notícia em destaque na íntegra.'}
          </p>
        )}
      </div>
    </div>
  );
}
