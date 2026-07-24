/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Play, 
  ChevronUp, 
  ChevronDown, 
  CloudUpload, 
  RefreshCw, 
  Copy, 
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Calendar,
  AlertCircle,
  Link,
  File,
  GripVertical
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../types';
import WidgetRenderer from './WidgetRenderer';

interface ContentViewProps {
  mediaItems: MediaItem[];
  setMediaItems: (items: MediaItem[]) => void;
  onAddMedia: (item: Omit<MediaItem, 'id' | 'active'>) => void;
  currentPlayingIndex: number;
}

export default function ContentView({
  mediaItems,
  setMediaItems,
  onAddMedia,
  currentPlayingIndex
}: ContentViewProps) {
  // Upload states
  const [mediaName, setMediaName] = useState('');
  const [duration, setDuration] = useState(15);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schedule selection states
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Link configuration states
  const [uploadTab, setUploadTab] = useState<'file' | 'link'>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<'image' | 'video' | 'widget'>('widget');

  // RSS Preview & Edit Modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<Array<{ title: string; description: string; thumbnail?: string; pubDate?: string }>>([
    {
      title: 'Inauguração de Novo Cardápio com Cervejas Artesanais',
      description: 'Estabelecimento em Recife traz opções exclusivas harmonizadas com chopp gelado e petiscos tradicionais.',
      thumbnail: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1200',
      pubDate: 'Hoje, 11:30'
    },
    {
      title: 'Sustentabilidade e Eficiência no Setor Gastronômico',
      description: 'Novas diretrizes promovem sustentabilidade e inovação nas operações locais.',
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
      pubDate: 'Ontem, 16:45'
    }
  ]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  useEffect(() => {
    if (isPreviewModalOpen && linkUrl.trim()) {
      setPreviewLoading(true);
      setActivePreviewIndex(0);
      const apiUrl = `/api/scrape-rss?url=${encodeURIComponent(linkUrl.trim())}`;
      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok' && data.items && data.items.length > 0) {
            setPreviewItems(data.items);
            setActivePreviewIndex(0);
          }
          setPreviewLoading(false);
        })
        .catch(() => {
          setPreviewLoading(false);
        });
    }
  }, [isPreviewModalOpen, linkUrl]);

  const handleLinkUrlChange = (val: string) => {
    setLinkUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes('http') && !lower.endsWith('.jpg') && !lower.endsWith('.png') && !lower.endsWith('.jpeg') && !lower.endsWith('.mp4') && !lower.endsWith('.webm')) {
      setLinkType('widget');
    }
  };

  const handleFormSubmitWrapper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaName.trim()) {
      setUploadError('Por favor, informe o nome da mídia.');
      return;
    }
    if (uploadTab === 'link' && linkType === 'widget') {
      if (!linkUrl.trim()) {
        setUploadError('Por favor, insira a URL do link.');
        return;
      }
      setUploadError('');
      setPreviewItems([]);
      setIsPreviewModalOpen(true);
      setPreviewLoading(true);
      return;
    }
    handleAddMediaSubmit(e);
  };

  const confirmAddRssFeed = () => {
    onAddMedia({
      name: mediaName,
      duration: Number(duration),
      schedule: 'Sempre Ativo',
      type: 'widget',
      url: linkUrl.trim(),
      items: previewItems
    });
    setIsPreviewModalOpen(false);
    setMediaName('');
    setLinkUrl('');
    setUploadError('');
  };

  // Editing inline states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState(10);
  const [editSchedule, setEditSchedule] = useState('');

  // Dropbox states
  const [dropboxUrl, setDropboxUrl] = useState('');
  const [convertedUrl, setConvertedUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Performance metrics
  const [cpuLoad, setCpuLoad] = useState(33);
  const [bandwidth, setBandwidth] = useState(12.4);

  useEffect(() => {
    // Subtle metric fluctuation to simulate real-time sensor streams
    const interval = setInterval(() => {
      setCpuLoad(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(10, Math.min(95, prev + delta));
      });
      setBandwidth(prev => {
        const delta = Number((Math.random() * 1.2 - 0.6).toFixed(1));
        return Math.max(4.0, Math.min(25.0, Number((prev + delta).toFixed(1))));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Up & Down moving logic & drag reorder
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= mediaItems.length) return;

    const updated = [...mediaItems];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setMediaItems(updated);
  };

  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= mediaItems.length || toIndex >= mediaItems.length) return;
    const updated = [...mediaItems];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setMediaItems(updated);
  };

  // Inline editing actions
  const startEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDuration(item.duration);
    setEditSchedule(item.schedule);
  };

  const saveEdit = (id: string) => {
    const updated = mediaItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          name: editName,
          duration: Number(editDuration),
          schedule: editSchedule
        };
      }
      return item;
    });
    setMediaItems(updated);
    setEditingId(null);
  };

  const deleteItem = (id: string) => {
    setMediaItems(mediaItems.filter(item => item.id !== id));
  };

  // Drag and Drop & file upload selection
  const processVideoFile = (file: File, url: string) => {
    if (file.type.startsWith('video/')) {
      const vid = document.createElement('video');
      vid.src = url;
      vid.onloadedmetadata = () => {
        if (vid.duration && !isNaN(vid.duration)) {
          setDuration(Math.round(vid.duration));
        }
      };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setMediaName(file.name.replace(/\.[^/.]+$/, "")); // Auto fill media name with filename
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadError('');
      processVideoFile(file, url);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setMediaName(file.name.replace(/\.[^/.]+$/, ""));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadError('');
      processVideoFile(file, url);
    }
  };

  // Submit media
  const handleAddMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaName.trim()) {
      setUploadError('Por favor, informe o nome da mídia.');
      return;
    }

    let itemUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400'; // Default
    let fileType: 'video' | 'image' | 'widget' = 'image';

    if (uploadTab === 'file') {
      if (selectedFile) {
        itemUrl = previewUrl || itemUrl;
        if (selectedFile.type.startsWith('video/')) {
          fileType = 'video';
        } else {
          fileType = 'image';
        }
      } else {
        setUploadError('Por favor, selecione um arquivo local ou escolha a aba de Link.');
        return;
      }
    } else {
      if (!linkUrl.trim()) {
        setUploadError('Por favor, insira a URL do link.');
        return;
      }
      itemUrl = linkUrl.trim();
      fileType = linkType;
    }

    const formatDateStr = (dateStr: string) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    let dateRangeStr = '';
    if (enableSchedule) {
      if (startDate && endDate) {
        dateRangeStr = `${formatDateStr(startDate)} a ${formatDateStr(endDate)} - `;
      } else if (startDate) {
        dateRangeStr = `A partir de ${formatDateStr(startDate)} - `;
      } else if (endDate) {
        dateRangeStr = `Até ${formatDateStr(endDate)} - `;
      }
    }

    const scheduleStr = enableSchedule && selectedDays.length > 0
      ? `${dateRangeStr}${selectedDays.join(', ')} (${startTime} - ${endTime})`
      : 'Sempre Ativo';

    onAddMedia({
      name: mediaName,
      duration: Number(duration),
      schedule: scheduleStr,
      type: fileType,
      url: itemUrl,
      items: fileType === 'widget' ? previewItems : undefined
    });

    // Reset Form
    setMediaName('');
    setDuration(15);
    setSelectedFile(null);
    setPreviewUrl(null);
    setLinkUrl('');
    setUploadError('');
    setEnableSchedule(false);
    setSelectedDays(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
    setStartTime('08:00');
    setEndTime('18:00');
    setStartDate('');
    setEndDate('');
  };

  // Dropbox share-link converter
  const convertDropboxLink = () => {
    if (!dropboxUrl.trim()) return;
    setIsConverting(true);
    setConvertedUrl('');

    setTimeout(() => {
      // Logic: convert "https://www.dropbox.com/s/xxxxx/file.mp4?dl=0" to direct "https://dl.dropboxusercontent.com/s/xxxxx/file.mp4"
      let directLink = dropboxUrl.trim();
      
      if (directLink.includes('dropbox.com')) {
        directLink = directLink
          .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
          .replace('?dl=0', '')
          .replace('?dl=1', '');
      } else {
        // Fallback or general URL mockup
        directLink = `https://dl.dropboxusercontent.com/s/mocked_file_hash/source_asset.mp4`;
      }

      setConvertedUrl(directLink);
      setIsConverting(false);
    }, 1000);
  };

  const copyToClipboard = () => {
    if (!convertedUrl) return;
    navigator.clipboard.writeText(convertedUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Preview current playlist slide in Live Monitor
  const currentMedia = mediaItems[currentPlayingIndex] || mediaItems[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      
      {/* LEFT COLUMN: Playlist Management & Quick Upload */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Playlist Management Card */}
        <div className="glass-card rounded-2xl overflow-hidden border border-brand-outline-variant/40 shadow-xl">
          <div className="p-6 flex justify-between items-center border-b border-brand-outline-variant/30">
            <div className="flex items-center gap-3">
              <Layers className="text-brand-primary w-5 h-5" />
              <div>
                <h3 className="font-geist text-lg font-bold text-brand-on-surface">Playlist Ativa: Campanha de Verão 2024</h3>
                <p className="text-xs text-brand-outline mt-0.5">Controle pesos de reprodução, linhas do tempo e prioridades de ativos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  // Scroll to Quick Upload smoothly
                  document.getElementById('quick-upload-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-brand-primary-container text-brand-on-primary-container px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Mídia</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-brand-outline-variant/30">
            {mediaItems.length === 0 ? (
              <div className="p-12 text-center text-brand-on-surface-variant text-sm flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-brand-outline" />
                <p>Nenhuma mídia na playlist ativa. Use o formulário de upload abaixo para adicionar.</p>
              </div>
            ) : (
              mediaItems.map((item, index) => {
                const isCurrentlyPlaying = index === currentPlayingIndex;
                const isEditing = editingId === item.id;

                return (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={(e) => {
                      setDraggedIndex(index);
                      e.dataTransfer.setData('text/plain', String(index));
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData('text/plain'));
                      reorderItems(from, index);
                      setDraggedIndex(null);
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`p-4 transition-all flex items-center gap-4 md:gap-6 cursor-grab active:cursor-grabbing ${
                      draggedIndex === index ? 'opacity-40 border-dashed border-2 border-brand-primary' : ''
                    } ${
                      isCurrentlyPlaying 
                        ? 'bg-brand-primary-container/10 border-l-4 border-brand-primary' 
                        : 'hover:bg-brand-surface-container/30 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Drag Handle & Index & Reorder Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-brand-outline hover:text-brand-primary cursor-grab active:cursor-grabbing p-1" title="Arraste para mover">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <button 
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className={`text-brand-outline hover:text-brand-primary disabled:opacity-20 disabled:pointer-events-none p-0.5 cursor-pointer`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-geist text-xs font-bold text-brand-outline/80 leading-none my-0.5">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <button 
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === mediaItems.length - 1}
                          className={`text-brand-outline hover:text-brand-primary disabled:opacity-20 disabled:pointer-events-none p-0.5 cursor-pointer`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Media Thumbnail */}
                    <div className="w-20 md:w-24 h-12 md:h-14 rounded-xl bg-brand-surface-lowest overflow-hidden border border-brand-outline-variant/30 shrink-0 relative">
                      {item.type === 'video' ? (
                        <video 
                          src={item.url} 
                          className="w-full h-full object-cover" 
                          muted 
                          playsInline 
                        />
                      ) : (
                        <img 
                          src={item.url} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {isCurrentlyPlaying && (
                        <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="w-2.5 h-2.5 bg-brand-secondary rounded-full status-pulse"></span>
                        </div>
                      )}
                    </div>

                    {/* Asset Details OR inline editor form */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex flex-col md:flex-row gap-2">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-brand-surface-lowest border border-brand-outline-variant rounded-lg px-2.5 py-1 text-xs text-brand-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary min-w-0 flex-1"
                          />
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={editDuration}
                              onChange={(e) => setEditDuration(Number(e.target.value))}
                              placeholder="Secs"
                              className="bg-brand-surface-lowest border border-brand-outline-variant rounded-lg px-2.5 py-1 text-xs text-brand-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary w-16"
                            />
                            <input 
                              type="text" 
                              value={editSchedule}
                              onChange={(e) => setEditSchedule(e.target.value)}
                              placeholder="Days"
                              className="bg-brand-surface-lowest border border-brand-outline-variant rounded-lg px-2.5 py-1 text-xs text-brand-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary w-24"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-semibold text-xs md:text-sm text-brand-on-surface truncate pr-2">
                            {item.name}
                          </h4>
                          <div className="flex flex-wrap gap-2 md:gap-3 mt-1.5 items-center">
                            <span className="flex items-center gap-1 text-[11px] text-brand-outline">
                              <Clock className="w-3.5 h-3.5" /> 
                              <span>{item.duration > 0 ? `${item.duration}.0s` : 'Tempo Real'}</span>
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.schedule === 'Always On' || item.schedule === 'ALWAYS ON'
                                ? 'bg-brand-secondary-container/10 text-brand-secondary'
                                : 'bg-brand-surface-highest text-brand-on-surface-variant'
                            }`}>
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span className="uppercase tracking-wider">
                                {item.schedule === 'Always On' || item.schedule === 'ALWAYS ON' ? 'Sempre Ativo' : item.schedule}
                              </span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quick Item action buttons */}
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <button 
                            onClick={() => saveEdit(item.id)}
                            className="p-2 text-brand-secondary hover:bg-brand-secondary/10 rounded-xl cursor-pointer"
                            title="Confirmar edição"
                          >
                            <Check className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-2 text-brand-outline hover:bg-brand-surface-variant rounded-xl cursor-pointer"
                            title="Cancelar edição"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => startEdit(item)}
                            className="p-2 text-brand-outline hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl cursor-pointer"
                            title="Editar metadados"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-2 text-brand-outline hover:text-brand-error hover:bg-brand-error/10 rounded-xl cursor-pointer"
                            title="Remover arquivo"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Showings count and loader */}
          <div className="p-4 bg-brand-surface-container/60 border-t border-brand-outline-variant/30 text-center">
            <p className="text-xs text-brand-outline">
              Mostrando {mediaItems.length} de {mediaItems.length} itens. 
              <span className="text-brand-primary hover:underline font-bold ml-1.5 cursor-pointer">
                Carregar Mais
              </span>
            </p>
          </div>
        </div>

        {/* Quick Upload Form Section */}
        <div id="quick-upload-section" className="glass-card p-6 rounded-2xl border border-brand-outline-variant/40 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <CloudUpload className="text-brand-primary w-5 h-5" />
            <div>
              <h3 className="font-geist text-lg font-bold text-brand-on-surface">Adicionar Mídia</h3>
              <p className="text-xs text-brand-outline mt-0.5 font-inter">Selecione arquivos locais ou insira links da web diretamente</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-brand-outline-variant/30 mb-6 col-span-full">
            <button
              type="button"
              onClick={() => { setUploadTab('file'); setUploadError(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-geist text-xs font-bold transition-all cursor-pointer ${
                uploadTab === 'file'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-outline hover:text-brand-on-surface'
              }`}
            >
              <File className="w-3.5 h-3.5" />
              <span>Arquivo Local</span>
            </button>
            <button
              type="button"
              onClick={() => { setUploadTab('link'); setUploadError(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-geist text-xs font-bold transition-all cursor-pointer ${
                uploadTab === 'link'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-outline hover:text-brand-on-surface'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>Link da Web / URL</span>
            </button>
          </div>

          <form onSubmit={handleFormSubmitWrapper} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">Nome da Mídia</label>
              <input 
                type="text"
                value={mediaName}
                onChange={(e) => setMediaName(e.target.value)}
                placeholder="Ex: Especial de Manhã 01"
                className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-4 py-2.5 text-xs text-brand-on-surface focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:outline-none transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">Duração (Segundos)</label>
              <input 
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={300}
                className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-4 py-2.5 text-xs text-brand-on-surface focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:outline-none transition-all"
              />
            </div>

            {/* Schedule Builder: Days & Time range */}
            <div className="col-span-full space-y-3 p-4 bg-brand-surface-container/50 rounded-2xl border border-brand-outline-variant/30">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist flex items-center gap-1.5 cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Dias e Horários de Exibição</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableSchedule} 
                    onChange={(e) => setEnableSchedule(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                  <span className="ml-2 text-xs font-bold text-brand-on-surface">
                    {enableSchedule ? 'Personalizado' : 'Sempre Ativo'}
                  </span>
                </label>
              </div>

              {enableSchedule && (
                <div className="space-y-3 pt-3 animate-in fade-in duration-200 border-t border-brand-outline-variant/20 mt-3">
                  {/* Days selection */}
                  <div className="flex flex-wrap gap-1.5">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-brand-primary text-brand-on-primary shadow-sm' 
                              : 'bg-brand-surface-lowest border border-brand-outline-variant text-brand-on-surface-variant hover:border-brand-primary'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Date range selection */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-brand-outline">Data de Início (Opcional)</label>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-3 py-2 text-xs text-brand-on-surface focus:ring-1 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-brand-outline">Data de Término (Opcional)</label>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-3 py-2 text-xs text-brand-on-surface focus:ring-1 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Time range selection */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-brand-outline">Horário de Início</label>
                      <input 
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-3 py-2 text-xs text-brand-on-surface focus:ring-1 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-brand-outline">Horário de Término</label>
                      <input 
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-3 py-2 text-xs text-brand-on-surface focus:ring-1 focus:ring-brand-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {uploadTab === 'file' ? (
              /* Drag & Drop Canvas */
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className="col-span-full border-2 border-dashed border-brand-outline-variant rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-brand-surface-lowest/40 hover:bg-brand-primary/5 hover:border-brand-primary/60 transition-all cursor-pointer group text-center"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden" 
                />
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="w-40 h-20 rounded-xl overflow-hidden border border-brand-outline-variant/60 mx-auto">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-brand-secondary font-bold font-geist">✓ Arquivo carregado com sucesso!</p>
                    <p className="text-[10px] text-brand-outline font-mono-data">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <>
                    <CloudUpload className="w-12 h-12 text-brand-outline group-hover:text-brand-primary transition-colors duration-200" />
                    <p className="text-xs text-brand-on-surface-variant font-medium">
                      Arraste e solte arquivos aqui ou <span className="text-brand-primary font-bold">navegue</span>
                    </p>
                    <p className="text-[10px] text-brand-outline">
                      Suporta MP4, PNG, JPG (Máx 500MB)
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* Direct Web Link Form inputs & Explainer */
              <div className="col-span-full space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">URL do Link</label>
                  <input 
                    type="url"
                    value={linkUrl}
                    onChange={(e) => handleLinkUrlChange(e.target.value)}
                    placeholder="Ex: https://entretenimento.r7.com/famosos-e-tv/ ou https://abrasel.com.br/noticias/"
                    className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-4 py-2.5 text-xs text-brand-on-surface focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">Tipo do Link</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setLinkType('image')}
                      className={`px-3 py-2.5 border rounded-xl font-bold text-xs cursor-pointer transition-all ${
                        linkType === 'image'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-outline-variant hover:border-brand-outline text-brand-on-surface-variant'
                      }`}
                    >
                      Imagem (.png, .jpg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkType('video')}
                      className={`px-3 py-2.5 border rounded-xl font-bold text-xs cursor-pointer transition-all ${
                        linkType === 'video'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-outline-variant hover:border-brand-outline text-brand-on-surface-variant'
                      }`}
                    >
                      Vídeo (.mp4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkType('widget')}
                      className={`px-3 py-2.5 border rounded-xl font-bold text-xs cursor-pointer transition-all ${
                        linkType === 'widget'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-outline-variant hover:border-brand-outline text-brand-on-surface-variant'
                      }`}
                    >
                      Widget / RSS Feed
                    </button>
                  </div>
                </div>

                {linkType === 'widget' && linkUrl && (() => {
                  try {
                    const host = new URL(linkUrl).hostname;
                    const isDirectFeed = linkUrl.includes('.xml') || linkUrl.includes('/rss') || linkUrl.includes('feed=');
                    if (isDirectFeed) return null;
                    return (
                      <div className="p-3.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20 text-xs text-brand-primary flex items-center gap-2.5 animate-in fade-in duration-300">
                        <Sparkles className="w-4.5 h-4.5 text-brand-primary animate-pulse shrink-0" />
                        <div>
                          <span className="font-bold block text-brand-on-surface">✨ Conversor de Site em RSS Ativo!</span>
                          <p className="text-[11px] text-brand-outline mt-0.5 font-inter">
                            Detectamos o site comum <strong className="text-brand-on-surface">{host}</strong>. Nosso motor do servidor extrairá de forma limpa apenas o <strong className="text-brand-on-surface">Título</strong> e a <strong className="text-brand-on-surface">Imagem</strong> de cada notícia de destaque em tempo real!
                          </p>
                        </div>
                      </div>
                    );
                  } catch (_) {
                    return null;
                  }
                })()}

                <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 text-xs text-brand-on-surface-variant space-y-2 font-inter leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold font-geist text-brand-primary">
                    <Sparkles className="w-4 h-4" />
                    <span>Como funcionam os Links de Transmissão?</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-brand-outline">
                    <li><strong className="text-brand-on-surface">Imagem/Vídeo:</strong> Insira o link direto do arquivo hospedado na web (Dropbox, AWS, Drive público).</li>
                    <li><strong className="text-brand-on-surface">Widgets:</strong> Suporta sites públicos, dashboards em tempo real, Google Slides ou relógios interativos.</li>
                    <li><strong className="text-brand-on-surface">Feeds RSS:</strong> Insira qualquer feed de notícias em XML. Nosso reprodutor detectará automaticamente e criará uma apresentação de notícias polida, auto-atualizável e sem falhas CORS!</li>
                  </ul>
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-brand-tertiary text-xs col-span-full font-semibold">{uploadError}</p>
            )}

            <div className="col-span-full flex justify-end">
              <button 
                type="submit"
                className="bg-brand-primary text-brand-on-primary px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-brand-primary/10 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-150 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{uploadTab === 'link' && linkType === 'widget' ? 'Pré-visualizar & Editar Feed RSS' : 'Adicionar à Playlist'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Sidebar Utilities */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Dropbox Link Converter */}
        <div className="glass-card rounded-2xl overflow-hidden border border-brand-outline-variant/40 shadow-xl">
          <div className="p-5 bg-brand-primary-container/10 border-b border-brand-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0061ff] rounded-xl flex items-center justify-center shadow-md">
                <svg fill="white" height="20" viewBox="0 0 24 24" width="20">
                  <path d="M6 2l6 3.84L18 2l4 2.56L16 8.4l6 3.84-4 2.56L12 11l-6 3.84-4-2.56 6-3.84L2 4.56zM6 15.36l6 3.84 6-3.84 4 2.56-10 6.4-10-6.4z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-geist text-sm font-bold text-brand-on-surface">Conversor Dropbox</h3>
                <p className="text-[10px] text-brand-outline mt-0.5">Converta links de compartilhamento em downloads diretos</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">Link de Compartilhamento</label>
              <input 
                type="text" 
                value={dropboxUrl}
                onChange={(e) => setDropboxUrl(e.target.value)}
                placeholder="https://www.dropbox.com/s/..."
                className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-3 py-2 text-xs text-brand-on-surface focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
              />
            </div>

            <button 
              onClick={convertDropboxLink}
              disabled={isConverting || !dropboxUrl.trim()}
              className="w-full py-2.5 border border-brand-primary text-brand-primary rounded-xl font-bold text-xs hover:bg-brand-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? 'animate-spin' : ''}`} />
              <span>{isConverting ? 'Convertendo...' : 'Gerar Link Direto'}</span>
            </button>

            {convertedUrl && (
              <div className="p-3 bg-brand-surface-lowest rounded-xl border border-brand-outline-variant border-dashed animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-bold text-brand-outline uppercase tracking-wider mb-1 font-geist">URL Direta de Destino</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={convertedUrl}
                    className="bg-transparent border-none p-0 text-xs text-brand-secondary font-mono-data truncate flex-1 focus:outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="text-brand-primary p-1 hover:bg-brand-surface-variant rounded-md cursor-pointer"
                    title="Copiar para área de transferência"
                  >
                    {isCopied ? (
                      <span className="text-[10px] text-brand-secondary font-bold">Copiado!</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Monitoring Dashboard Module */}
        <div className="glass-card p-5 rounded-2xl border border-brand-outline-variant/40 shadow-xl">
          <h3 className="font-geist text-sm font-bold text-brand-on-surface mb-3.5">Monitoramento ao Vivo</h3>
          
          <div className="aspect-video bg-black rounded-xl relative overflow-hidden border border-brand-outline-variant/60 group shadow-inner">
            {currentMedia ? (
              <div className="w-full h-full relative">
                {currentMedia.type === 'video' ? (
                  <video 
                    src={currentMedia.url} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                  />
                ) : currentMedia.type === 'widget' ? (
                  <WidgetRenderer 
                    url={currentMedia.url} 
                    name={currentMedia.name} 
                    items={currentMedia.items}
                    className="w-full h-full"
                  />
                ) : (
                  <img 
                    src={currentMedia.url} 
                    alt="Pré-visualização de reprodução ao vivo" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                )}
                {currentMedia.type !== 'widget' && (
                  <div className="absolute inset-0 bg-black/30 pointer-events-none flex items-center justify-center">
                    <Play className="w-10 h-10 text-white/50 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="text-white/40 w-10 h-10" />
              </div>
            )}

            <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] text-white font-bold flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              <span className="font-geist uppercase tracking-wider">NYC-TIME-SQUARE-01</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-on-surface-variant font-medium">Carga de CPU</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-brand-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary transition-all duration-1000" 
                    style={{ width: `${cpuLoad}%` }}
                  ></div>
                </div>
                <span className="font-mono-data font-bold text-brand-on-surface text-[11px] w-8 text-right">
                  {cpuLoad}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-on-surface-variant font-medium">Velocidade de Banda</span>
              <span className="text-brand-on-surface font-bold font-mono-data">
                {bandwidth} Mbps
              </span>
            </div>
          </div>
        </div>

        {/* Support Help Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-transparent border border-brand-primary/20 flex flex-col justify-between">
          <div>
            <h4 className="font-geist text-sm font-bold text-brand-primary mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>Precisa de Ajuda?</span>
            </h4>
            <p className="text-xs text-brand-on-surface-variant leading-relaxed">
              Agende uma sessão técnica com um Arquiteto de Sinalização para otimizar suas entregas de playlists de vídeo de alto volume.
            </p>
          </div>
          <button 
            onClick={() => alert('Parabéns! Nosso arquiteto entrará em contato por e-mail em instantes.')}
            className="text-brand-primary text-xs font-bold flex items-center gap-1.5 hover:translate-x-1.5 transition-transform duration-200 mt-4 cursor-pointer text-left focus:outline-none"
          >
            <span>Agendar um Workshop</span> 
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* RSS Preview & Edit Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-[#121424] border border-white/15 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-base text-white">Pré-visualizar & Editar Feed RSS</h3>
                  <p className="text-xs text-white/50 font-inter truncate max-w-md">{linkUrl}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
              {previewLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                  <RefreshCw className="w-10 h-10 text-brand-primary animate-spin" />
                  <p className="font-montserrat font-bold text-white text-sm">Analisando e convertendo RSS em tempo real...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: Live Widget Preview mimicking WidgetRenderer */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider font-montserrat">
                        Visualização na Tela (Background + Gradiente)
                      </span>
                      <span className="text-[10px] font-mono-data text-white/40">
                        Item {activePreviewIndex + 1} de {previewItems.length}
                      </span>
                    </div>

                    <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden relative shadow-2xl border border-white/20 bg-slate-950 flex flex-col justify-between p-6">
                      {/* Background Image */}
                      {previewItems[activePreviewIndex]?.thumbnail ? (
                        <div className="absolute inset-0 z-0">
                          <img 
                            src={previewItems[activePreviewIndex].thumbnail} 
                            alt="" 
                            className="w-full h-full object-cover scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 to-indigo-950" />
                      )}

                      {/* Top Bar */}
                      <div className="relative z-10 flex justify-between items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider font-montserrat">
                          {mediaName || 'Feed de Notícias'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono-data">● Ao Vivo</span>
                      </div>

                      {/* Content */}
                      <div className="relative z-10 my-auto py-2 space-y-2">
                        {(previewItems[activePreviewIndex]?.showTitle !== false) && (
                          <h2 className="text-lg md:text-xl font-black font-montserrat text-white leading-snug drop-shadow">
                            {previewItems[activePreviewIndex]?.title}
                          </h2>
                        )}
                        {(previewItems[activePreviewIndex]?.showDescription !== false) && (
                          <p className="text-xs text-white/90 font-inter line-clamp-2 drop-shadow">
                            {previewItems[activePreviewIndex]?.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Dots */}
                      <div className="relative z-10 flex justify-between items-center text-[10px] text-white/60 pt-2 border-t border-white/10">
                        <span>Atualização Automática</span>
                        <div className="flex gap-1">
                          {previewItems.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActivePreviewIndex(idx)}
                              className={`w-1.5 h-1.5 rounded-full ${idx === activePreviewIndex ? 'bg-[#f59e0b] w-3' : 'bg-white/30'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Editable Feed Items List & Current Item Editor */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-montserrat font-bold text-xs text-white uppercase tracking-wider">
                        Matérias Extraídas ({previewItems.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewItems([
                            ...previewItems,
                            {
                              title: 'Nova Matéria em Destaque',
                              description: 'Adicione uma descrição detalhada para esta notícia ou anúncio.',
                              thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
                              pubDate: 'Hoje'
                            }
                          ]);
                          setActivePreviewIndex(previewItems.length);
                        }}
                        className="text-[10px] text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        + Adicionar Slide
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {previewItems.map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setActivePreviewIndex(idx)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            idx === activePreviewIndex 
                              ? 'bg-brand-primary/15 border-brand-primary text-white shadow' 
                              : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-mono-data text-[#f59e0b] shrink-0">#{idx + 1}</span>
                            <span className="text-xs font-bold truncate">{item.title}</span>
                          </div>
                          {previewItems.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = previewItems.filter((_, i) => i !== idx);
                                setPreviewItems(updated);
                                if (activePreviewIndex >= updated.length) {
                                  setActivePreviewIndex(updated.length - 1);
                                }
                              }}
                              className="text-white/40 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors"
                              title="Remover slide"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Detailed Editor for Active Slide */}
                    {previewItems[activePreviewIndex] && (
                      <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                            Editando Slide #{activePreviewIndex + 1}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-white/60 font-semibold uppercase">Título da Matéria</label>
                          <input 
                            type="text"
                            value={previewItems[activePreviewIndex].title}
                            onChange={(e) => {
                              const updated = [...previewItems];
                              updated[activePreviewIndex].title = e.target.value;
                              setPreviewItems(updated);
                            }}
                            className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-white/60 font-semibold uppercase">Descrição / Resumo</label>
                          <textarea 
                            rows={2}
                            value={previewItems[activePreviewIndex].description}
                            onChange={(e) => {
                              const updated = [...previewItems];
                              updated[activePreviewIndex].description = e.target.value;
                              setPreviewItems(updated);
                            }}
                            className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-white/60 font-semibold uppercase">URL da Imagem de Fundo</label>
                          <input 
                            type="url"
                            value={previewItems[activePreviewIndex].thumbnail || ''}
                            onChange={(e) => {
                              const updated = [...previewItems];
                              updated[activePreviewIndex].thumbnail = e.target.value;
                              setPreviewItems(updated);
                            }}
                            placeholder="https://exemplo.com/imagem.jpg"
                            className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                          />
                        </div>

                        {/* Display toggles */}
                        <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                          <label className="flex items-center gap-2 text-xs text-white/90 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={previewItems[activePreviewIndex].showTitle !== false}
                              onChange={(e) => {
                                const updated = [...previewItems];
                                updated[activePreviewIndex].showTitle = e.target.checked;
                                setPreviewItems(updated);
                              }}
                              className="rounded border-white/20 bg-slate-900 text-brand-primary w-4 h-4 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-medium">Título da Matéria</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs text-white/90 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={previewItems[activePreviewIndex].showDescription !== false}
                              onChange={(e) => {
                                const updated = [...previewItems];
                                updated[activePreviewIndex].showDescription = e.target.checked;
                                setPreviewItems(updated);
                              }}
                              className="rounded border-white/20 bg-slate-900 text-brand-primary w-4 h-4 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-medium">Descrição / Resumo</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-black/50 border-t border-white/10 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/10 cursor-pointer transition-all"
              >
                Voltar e Ajustar
              </button>
              <button 
                type="button"
                onClick={confirmAddRssFeed}
                className="px-6 py-2.5 rounded-xl bg-brand-primary text-brand-on-primary text-xs font-bold shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all"
              >
                Confirmar e Adicionar à Playlist
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
