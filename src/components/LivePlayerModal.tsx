/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Wifi, Clock, Play, Pause, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import WidgetRenderer from './WidgetRenderer';

interface LivePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  playerName?: string;
  initialIndex?: number;
}

export default function LivePlayerModal({
  isOpen,
  onClose,
  mediaItems,
  playerName = 'NYC-TIME-SQUARE-01',
  initialIndex = 0
}: LivePlayerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeStr, setTimeStr] = useState('10:16:34');

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ESC key & back button listener to exit fullscreen
  useEffect(() => {
    if (!isOpen) return;

    // Push history state so mobile back button can close player
    window.history.pushState({ playerOpen: true }, '');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Playlist slideshow timing engine
  useEffect(() => {
    if (!isOpen || !isPlaying || mediaItems.length === 0) return;

    const currentItem = mediaItems[currentIndex];
    if (currentItem?.type === 'video') {
      // For videos, let the video's onEnded event drive the transition
      return;
    }

    const displayDuration = (currentItem?.duration && currentItem.duration > 0) 
      ? currentItem.duration * 1000 
      : 10000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [isOpen, isPlaying, currentIndex, mediaItems]);

  if (!isOpen) return null;

  const currentItem = mediaItems[currentIndex] || null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden text-gray-900 font-inter select-none cursor-pointer"
      onClick={() => {
        // Optional: click to exit or just view clean
      }}
    >
      
      {/* Background Media Render Layer */}
      <div className="absolute inset-0 w-full h-full bg-[#030617] flex items-center justify-center">
        {currentItem ? (
          currentItem.type === 'video' ? (
            <video 
              key={currentItem.id}
              src={currentItem.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              onCanPlay={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(err => console.log("Autoplay simulator:", err));
              }}
              onLoadedMetadata={(e) => {
                // Optionally update item duration if needed
                if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
                  currentItem.duration = Math.round(e.currentTarget.duration);
                }
              }}
              onEnded={() => {
                if (isPlaying) {
                  setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
                }
              }}
            />
          ) : currentItem.type === 'widget' ? (
            <WidgetRenderer 
              key={currentItem.id}
              url={currentItem.url} 
              name={currentItem.name} 
              items={currentItem.items}
              className="w-full h-full"
            />
          ) : (
            <img 
              key={currentItem.id}
              src={currentItem.url}
              alt={currentItem.name}
              className="w-full h-full object-cover animate-fade-in"
              referrerPolicy="no-referrer"
            />
          )
        ) : (
          <div className="text-center space-y-4">
            <Minimize2 className="w-16 h-16 text-blue-600 animate-pulse mx-auto" />
            <p className="text-brand-outline font-geist text-sm">CARREGANDO PRÉ-VISUALIZAÇÃO...</p>
          </div>
        )}
      </div>

      {/* Top Floating Overlay - Only Clock */}
      <div className="relative z-10 w-full p-6 flex justify-end items-center pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-black/60 border border-gray-200 rounded-xl text-sm font-mono-data backdrop-blur-md shadow-2xl pointer-events-auto">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-gray-900 tracking-wider">{timeStr}</span>
        </div>
      </div>

      {/* Invisible bottom spacer to keep flex layout balanced */}
      <div className="relative z-10 w-full p-4 flex justify-between items-end pointer-events-none">
        {/* Subtle exit hint on hover */}
        <button 
          onClick={onClose}
          className="pointer-events-auto opacity-0 hover:opacity-100 transition-opacity px-3 py-1.5 bg-black/60 hover:bg-red-600/80 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 backdrop-blur-md border border-gray-200"
          title="Pressione ESC para Sair"
        >
          ✕ Sair da Tela Cheia (ESC)
        </button>
      </div>

    </div>
  );
}
