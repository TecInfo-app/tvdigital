/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ListMusic, Plus, Play, CheckCircle, FilePlus, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { Playlist, MediaItem } from '../types';

interface PlaylistsViewProps {
  playlists: Playlist[];
  mediaItems: MediaItem[];
  onSelectPlaylist: (playlistId: string) => void;
  onCreatePlaylist: (name: string) => void;
}

export default function PlaylistsView({
  playlists,
  mediaItems,
  onSelectPlaylist,
  onCreatePlaylist
}: PlaylistsViewProps) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-geist text-xl font-bold text-brand-on-surface">Biblioteca de Playlists</h2>
          <p className="text-xs text-brand-outline mt-0.5">Gerencie prioridades de agendamento e estruturas de composição</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-primary text-brand-on-primary px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-95 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Playlist</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 glass-card rounded-2xl border border-brand-outline-variant/40 space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">Nome da Playlist</label>
            <input 
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Ex: Apresentação da Tarde"
              className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded-xl px-4 py-2.5 text-xs text-brand-on-surface focus:ring-2 focus:ring-brand-primary focus:outline-none focus:border-transparent transition-all"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-4 py-2 hover:bg-brand-surface-variant/40 text-brand-on-surface-variant rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-brand-primary text-brand-on-primary rounded-xl text-xs font-bold cursor-pointer hover:opacity-95"
            >
              Salvar Definição
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => {
          return (
            <div 
              key={playlist.id} 
              className={`glass-card p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 shadow-md ${
                playlist.isActive 
                  ? 'border-brand-primary/50 ring-1 ring-brand-primary/20' 
                  : 'border-brand-outline-variant/40 hover:border-brand-outline/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-brand-surface-container rounded-xl border border-brand-outline-variant/20 flex items-center justify-center shrink-0">
                    <ListMusic className={`w-5 h-5 ${playlist.isActive ? 'text-brand-primary' : 'text-brand-outline'}`} />
                  </div>
                  
                  {playlist.isActive && (
                    <span className="bg-brand-primary-container/20 text-brand-primary px-2.5 py-1 rounded-full text-[9px] font-bold font-geist tracking-wider flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
                      <span>PLAYLIST ATIVA</span>
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-geist text-base font-bold text-brand-on-surface leading-snug">{playlist.name}</h3>
                  <p className="text-xs text-brand-outline mt-1 font-inter">
                    {playlist.itemIds.length} ativo{playlist.itemIds.length !== 1 ? 's' : ''} de mídia configurado{playlist.itemIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-outline-variant/20">
                <span className="text-[10px] text-brand-outline font-mono-data font-semibold">
                  ID: {playlist.id.toUpperCase()}
                </span>

                {!playlist.isActive ? (
                  <button
                    onClick={() => onSelectPlaylist(playlist.id)}
                    className="px-3.5 py-1.5 bg-brand-surface-variant/40 hover:bg-brand-primary/20 text-brand-on-surface hover:text-brand-primary rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Ativar</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-brand-secondary font-bold font-geist tracking-wider">
                    TRANSMITINDO AO VIVO
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
