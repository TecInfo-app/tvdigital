/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle, History, PlayCircle, Network, Users, AlertTriangle } from 'lucide-react';
import { Player, LogEntry, MediaItem } from '../types';

interface DashboardViewProps {
  players: Player[];
  logs: LogEntry[];
  mediaItems: MediaItem[];
  setActiveTab: (tab: string) => void;
  onDeployAll: () => void;
}

export default function DashboardView({
  players,
  logs,
  mediaItems,
  setActiveTab,
  onDeployAll
}: DashboardViewProps) {
  const activePlayersCount = players.filter(p => p.status === 'online').length;
  const warningPlayersCount = players.filter(p => p.status === 'warning').length;
  const totalPlayersCount = players.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome & Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Welcome Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between min-h-[210px] border border-brand-outline-variant/40 shadow-xl shadow-brand-surface-lowest/40">
          <div>
            <h2 className="font-geist text-2xl font-bold text-brand-on-surface">Bem-vindo de volta, Admin</h2>
            <p className="text-brand-on-surface-variant text-sm mt-2 font-inter leading-relaxed">
              Sua rede de sinalização digital está <strong className="text-brand-secondary">98% operacional</strong> em todos os displays ativos em regiões metropolitanas.
            </p>
          </div>
          <div className="flex gap-4 mt-6">
            <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/15 hover:bg-white/10 transition-colors">
              <p className="text-white/50 text-[11px] uppercase tracking-wider font-bold font-geist">Mídia Total</p>
              <p className="text-xl font-bold font-geist text-white mt-1">{mediaItems.length} Itens</p>
            </div>
            <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/15 hover:bg-white/10 transition-colors">
              <p className="text-white/50 text-[11px] uppercase tracking-wider font-bold font-geist">Stream Ativo</p>
              <p className="text-xl font-bold font-geist text-brand-secondary mt-1">Transmissão Ao Vivo</p>
            </div>
          </div>
        </div>

        {/* TV Status Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-brand-outline-variant/40 shadow-xl shadow-brand-surface-lowest/40">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-brand-secondary-container/20 text-brand-secondary rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </span>
            <span className="text-brand-secondary flex items-center gap-1.5 text-xs font-bold font-geist">
              <span className="w-2 h-2 bg-brand-secondary rounded-full status-pulse"></span>
              ONLINE
            </span>
          </div>
          <div>
            <p className="text-brand-outline text-[11px] uppercase tracking-wider font-bold font-geist">Status da TV</p>
            <h3 className="text-2xl font-black font-geist mt-1 text-brand-on-surface">{activePlayersCount} Ativos</h3>
            <p className="text-xs text-brand-on-surface-variant mt-1.5 font-inter">
              {warningPlayersCount} dispositivo{warningPlayersCount !== 1 ? 's' : ''} precisando de atenção
            </p>
          </div>
        </div>

        {/* Recent Logs Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-brand-outline-variant/40 shadow-xl shadow-brand-surface-lowest/40">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-brand-tertiary/20 text-brand-tertiary rounded-xl">
              <History className="w-5 h-5" />
            </span>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className="text-brand-primary text-xs font-bold font-geist hover:underline cursor-pointer"
            >
              VER TUDO
            </button>
          </div>
          <div>
            <p className="text-brand-outline text-[11px] uppercase tracking-wider font-bold font-geist">Logs Recentes</p>
            <div className="mt-3 space-y-2.5">
              {logs.slice(0, 2).map((log) => (
                <div key={log.id} className="flex justify-between items-start gap-2 text-xs">
                  <span className="text-brand-on-surface-variant line-clamp-1 leading-snug">{log.action}</span>
                  <span className="text-brand-outline shrink-0 font-geist text-[10px]">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Network Overview Map Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Sync Panel */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-brand-outline-variant/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Network className="w-5 h-5 text-brand-primary" />
              <h3 className="font-geist text-lg font-bold text-brand-on-surface">Status de Publicação da Rede</h3>
            </div>
            <p className="text-sm text-brand-on-surface-variant font-inter leading-relaxed">
              Sincronize seus elementos de rede e envie as definições de playlist de mídia mais recentes instantaneamente para telas ativas em todo o mundo.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
              <p className="text-xl font-bold text-white font-geist">{totalPlayersCount}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mt-1 font-bold font-geist">Telas Totais</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
              <p className="text-xl font-bold text-brand-secondary font-geist">{activePlayersCount}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mt-1 font-bold font-geist">Sincronizadas</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
              <p className="text-xl font-bold text-brand-secondary font-geist">{players.filter(p => p.status === 'offline').length}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mt-1 font-bold font-geist">Telas Offline</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDeployAll}
              className="bg-white/10 border border-white/20 text-white font-bold px-5 py-3 rounded-xl text-xs hover:bg-white/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sincronizar Todas as Telas</span>
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className="border border-white/15 hover:bg-white/5 text-white/80 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
            >
              Configurar Displays
            </button>
          </div>
        </div>

        {/* Warning Logs & Quick Troubleshooting info */}
        <div className="glass-card p-6 rounded-2xl border border-brand-outline-variant/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-brand-tertiary w-5 h-5" />
              <h3 className="font-geist text-lg font-bold text-brand-on-surface">Necessitam Sincronização</h3>
            </div>
            <div className="space-y-3.5">
               {players.filter(p => p.status !== 'online').map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white font-geist">{player.name}</p>
                    <p className="text-[10px] text-white/40 mt-0.5 font-mono-data">{player.ip} • Último Sync: {player.lastSync}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-geist tracking-wider shrink-0 ${
                    player.status === 'warning' 
                      ? 'bg-amber-500/20 text-amber-300' 
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {player.status === 'warning' ? 'ATENÇÃO' : player.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-[11px] text-white/40 font-inter">
              Todos os outros 234 terminais de TV estão conectados através de redes CDN de borda regional.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
