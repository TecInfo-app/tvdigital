/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, AlertCircle, RefreshCw, Radio, Sparkles } from 'lucide-react';

interface WidgetRendererProps {
  url: string;
  name: string;
  className?: string;
  key?: string | number;
  items?: Array<{ title: string; description: string; thumbnail?: string; pubDate?: string }>;
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

export default function WidgetRenderer({ url, name, className = "", items: itemsProp }: WidgetRendererProps) {
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
    if (itemsProp && itemsProp.length > 0) {
      setItems(itemsProp);
      setFeedTitle(name);
      setIsLoading(false);
      return;
    }

    if (!isRss) return;

    setIsLoading(true);
    setError(null);

    const targetUrl = url.trim();
    
    // All website URLs (Abrasel, R7, G1, etc.) use backend HTML scraping / RSS conversion
    const isRegularWebpage = 
      !targetUrl.toLowerCase().includes('.xml') && 
      !targetUrl.toLowerCase().includes('feed=') &&
      (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'));

    let apiUrl = '';
    if (isRegularWebpage) {
      // Use our high-tech server-side scraper endpoint
      apiUrl = `/api/scrape-rss?url=${encodeURIComponent(targetUrl)}`;
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
          const parsedItems = data.items.map((item: any) => ({
            title: item.title || "",
            description: item.description?.replace(/<[^>]*>/g, '') || "", // Strip HTML tags
            pubDate: item.pubDate || "Recente",
            link: item.link || "#",
            thumbnail: item.thumbnail || item.enclosure?.link || ""
          }));
          setItems(parsedItems);
          if (data.feed && data.feed.title) {
            setFeedTitle(data.feed.title);
          }
        } else {
          // Fallback to local simulation
          setItems(SIMULATED_FEEDS);
          setFeedTitle(`${name} (Demonstração)`);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('RSS Feed Fetch CORS or Error. Falling back to local simulation:', err);
        setItems(SIMULATED_FEEDS);
        setFeedTitle(`${name} (Modo Offline)`);
        setIsLoading(false);
      });
  }, [url, name, isRss]);

  // Slideshow interval for RSS news articles
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000); // 7 seconds per news slide
    return () => clearInterval(interval);
  }, [items]);

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
        <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-white/80 pointer-events-none flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-ping"></span>
          <span>WIDGET ATIVO: {name.toUpperCase()}</span>
        </div>
      </div>
    );
  }

  // Case 2: RSS News Ticker & Sliding Display (RSS Links)
  const currentItem = items[currentIndex];

  if (isLoading) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0f111a] via-[#151829] to-[#0a0b12] flex flex-col items-center justify-center text-white p-12 select-none ${className}`}>
        <div className="flex flex-col items-center gap-4 text-center animate-pulse">
          <RefreshCw className="w-10 h-10 text-brand-primary animate-spin" />
          <h3 className="font-montserrat font-bold text-lg text-white">Sincronizando Feed</h3>
          <p className="font-inter text-xs text-white/50 max-w-xs leading-relaxed">
            Coletando notícias de destaque e convertendo imagens em tempo real para a sua tela.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative overflow-hidden bg-slate-950 flex flex-col justify-between text-white p-8 md:p-14 select-none ${className}`}>
      
      {/* Background Image filling the entire container */}
      {currentItem?.thumbnail ? (
        <div className="absolute inset-0 z-0">
          <img 
            src={currentItem.thumbnail} 
            alt="Fundo" 
            className="w-full h-full object-cover scale-105 transition-transform duration-[15000ms] ease-out"
            referrerPolicy="no-referrer"
          />
          {/* Smooth dark gradient overlay for optimal text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
      )}

      {/* Central News Content overlaid on background image */}
      <div className="relative z-10 my-auto py-12 px-6 md:px-16 space-y-4 max-w-5xl animate-in fade-in duration-500">
        {currentItem?.pubDate && (
          <span className="inline-block bg-black/40 backdrop-blur-md border border-white/20 text-white/80 font-mono-data text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
            {currentItem.pubDate}
          </span>
        )}

        {(currentItem?.showTitle !== false) && (
          <h1 className="font-montserrat font-black text-2xl md:text-4xl lg:text-6xl leading-tight tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            {currentItem?.title || 'Buscando matérias do feed...'}
          </h1>
        )}

        {(currentItem?.showDescription !== false) && (
          <p className="font-inter text-sm md:text-base lg:text-lg text-white/95 leading-relaxed font-normal tracking-wide max-w-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] pt-2">
            {currentItem?.description || 'Acesse o feed de transmissão para exibir a notícia em destaque na íntegra.'}
          </p>
        )}
      </div>

    </div>
  );
}
