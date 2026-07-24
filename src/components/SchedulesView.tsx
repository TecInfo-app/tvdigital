/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, Clock, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { Playlist } from '../types';

interface SchedulesViewProps {
  playlists: Playlist[];
}

export default function SchedulesView({ playlists }: SchedulesViewProps) {
  const scheduleItems = [
    {
      day: 'Segunda a Sexta (M, T, W, T, F)',
      time: '08:00 - 18:00',
      playlistName: playlists[0]?.name || 'Summer Campaign 2024',
      target: 'Telas de Recepção e Lojas',
      priority: 'Alta'
    },
    {
      day: 'Sábados e Domingos (Fim de Semana)',
      time: '09:00 - 22:00',
      playlistName: playlists[2]?.name || 'Holiday Promotional Slide',
      target: 'Painéis Externos (Led)',
      priority: 'Crítica'
    },
    {
      day: 'Período Noturno (Noite Diária)',
      time: '22:00 - 02:00',
      playlistName: playlists[1]?.name || 'Corporate Announcements',
      target: 'Todos os Terminais',
      priority: 'Média'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-geist text-xl font-bold text-white">Calendários de Reprodução Semanal</h2>
          <p className="text-xs text-white/50 mt-0.5">Defina gatilhos automatizados diurnos e noturnos para sincronização de terminais</p>
        </div>
        <button 
          onClick={() => alert('Agendamento customizado está disponível na versão Enterprise.')}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Gatilho de Agendamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timetable List */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/15 overflow-hidden shadow-lg">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <Clock className="w-5 h-5 text-white" />
            <h3 className="font-geist text-base font-bold text-white">Gatilhos de Agendamento Ativos</h3>
          </div>
          
          <div className="divide-y divide-white/10">
            {scheduleItems.map((item, index) => (
              <div key={index} className="p-5 hover:bg-white/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-bold text-white font-geist">{item.day}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-white/50 font-inter">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {item.time}
                    </span>
                    <span>Destino: {item.target}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold font-geist">Playlist Associada</p>
                    <p className="text-xs font-bold text-brand-secondary mt-0.5">{item.playlistName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-geist tracking-wider ${
                    item.priority === 'Crítica'
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/25'
                      : 'bg-white/10 text-white/80'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Insights Box */}
        <div className="glass-card p-6 rounded-2xl border border-white/15 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-geist text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-brand-secondary" />
              <span>Despachante Inteligente</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Nosso agendador automatizado de conteúdo reduz a carga geral de banda WAN armazenando arquivos em cache nos nós reprodutores horas antes do gatilho agendado.
            </p>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold font-geist">Auto-Esmaecimento de Terminais</p>
              <p className="text-xs text-white/70">
                Os displays entram em modo de suspensão automaticamente durante períodos inativos (ex: 02:00 às 07:00), estendendo a vida útil geral dos painéis traseiros das TVs em até 30%.
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center text-[10px] text-white/50 font-inter mt-6">
            <AlertCircle className="w-4 h-4 text-white/60 shrink-0" />
            <span>Fuso horário ajustado automaticamente para o relógio local do sistema.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
