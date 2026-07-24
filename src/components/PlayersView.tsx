/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Monitor, RefreshCw, Power, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { Player, MediaItem } from '../types';

interface PlayersViewProps {
  players: Player[];
  mediaItems: MediaItem[];
  onPlayerAction: (id: string, action: 'reboot' | 'sync') => void;
  onOpenSimulator: (player: Player) => void;
}

export default function PlayersView({
  players,
  mediaItems,
  onPlayerAction,
  onOpenSimulator
}: PlayersViewProps) {
  
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-geist text-xl font-bold text-brand-on-surface">Terminais de Rede ({players.length})</h2>
          <p className="text-xs text-brand-outline mt-0.5">Gerencie, reinicie e visualize os displays físicos de TV de sinalização local</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="border border-brand-outline-variant hover:bg-brand-surface-variant/40 text-brand-on-surface p-2.5 rounded-xl cursor-pointer transition-colors"
          title="Forçar atualização de telemetria"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {players.map((player) => {
          // Find currently playing media details
          const currentMedia = mediaItems.find(item => item.id === player.currentMediaId);

          return (
            <div 
              key={player.id} 
              className="glass-card p-6 rounded-2xl border border-brand-outline-variant/40 flex flex-col justify-between hover:border-brand-primary/40 transition-all duration-300 shadow-lg group"
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-surface-container rounded-xl border border-brand-outline-variant/20 flex items-center justify-center">
                      <Monitor className={`w-5 h-5 ${
                        player.status === 'online' 
                          ? 'text-brand-secondary' 
                          : player.status === 'warning' 
                          ? 'text-brand-tertiary' 
                          : 'text-brand-outline'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-geist font-bold text-brand-on-surface text-base">{player.name}</h3>
                      <p className="text-[10px] text-brand-outline font-mono-data mt-0.5">{player.ip} • {player.resolution}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-geist tracking-wider shrink-0 flex items-center gap-1.5 ${
                    player.status === 'online'
                      ? 'bg-brand-secondary-container/10 text-brand-secondary'
                      : player.status === 'warning'
                      ? 'bg-brand-tertiary/20 text-brand-tertiary'
                      : 'bg-brand-surface-highest text-brand-outline'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      player.status === 'online'
                        ? 'bg-brand-secondary status-pulse'
                        : player.status === 'warning'
                        ? 'bg-brand-tertiary status-pulse'
                        : 'bg-brand-outline'
                    }`}></span>
                    <span>{player.status === 'warning' ? 'ATENÇÃO' : player.status.toUpperCase()}</span>
                  </span>
                </div>

                {/* Playing Info block */}
                <div className="mt-5 p-3.5 bg-brand-surface-lowest/60 border border-brand-outline-variant/20 rounded-xl flex items-center gap-4">
                  <div className="w-16 h-10 rounded-lg bg-brand-surface-container overflow-hidden border border-brand-outline-variant/10 shrink-0 relative">
                    {currentMedia ? (
                      currentMedia.type === 'video' ? (
                        <video 
                          src={currentMedia.url} 
                          className="w-full h-full object-cover" 
                          muted 
                          autoPlay 
                          playsInline 
                          loop 
                          onCanPlay={(e) => {
                            e.currentTarget.muted = true;
                            e.currentTarget.play().catch(err => console.log("Autoplay preview:", err));
                          }}
                        />
                      ) : (
                        <img src={currentMedia.url} alt="Playing thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )
                    ) : (
                      <div className="w-full h-full bg-brand-surface-high flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-brand-outline/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-brand-outline uppercase tracking-wider font-bold font-geist">Em Reprodução</p>
                    <p className="text-xs font-bold text-brand-on-surface truncate mt-0.5">
                      {currentMedia ? currentMedia.name : 'Nenhum Conteúdo Carregado'}
                    </p>
                  </div>
                  {player.status !== 'offline' && (
                    <button 
                      onClick={() => onOpenSimulator(player)}
                      className="p-2 bg-brand-primary-container text-brand-on-primary-container hover:scale-105 active:scale-95 transition-all rounded-lg cursor-pointer"
                      title="Abrir tela de reprodução completa"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>

                {/* Metrics */}
                {player.status !== 'offline' ? (
                  <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-brand-outline-variant/20">
                    <div>
                      <p className="text-[10px] text-brand-outline font-geist">Carga de CPU</p>
                      <div className="flex items-center gap-2.5 mt-1">
                        <div className="flex-1 h-1.5 bg-brand-surface-container rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              player.cpu > 80 ? 'bg-brand-tertiary' : 'bg-brand-primary'
                            }`}
                            style={{ width: `${player.cpu}%` }}
                          ></div>
                        </div>
                        <span className="font-mono-data text-xs font-bold text-brand-on-surface w-7 text-right">{player.cpu}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-outline font-geist">Uso de Banda</p>
                      <p className="font-mono-data text-xs font-bold text-brand-on-surface mt-1">{player.bandwidth} Mbps</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 pt-4 border-t border-brand-outline-variant/20 text-center py-2">
                    <p className="text-xs text-brand-outline italic font-inter">Terminal offline. Falha no ping de teste.</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => onPlayerAction(player.id, 'sync')}
                  disabled={player.status === 'offline'}
                  className="flex-1 py-2 bg-brand-surface-variant/40 hover:bg-brand-surface-variant/70 text-brand-on-surface rounded-xl font-bold text-xs cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  Forçar Sincronização
                </button>
                <button
                  onClick={() => onPlayerAction(player.id, 'reboot')}
                  className="px-4 py-2 bg-brand-surface-variant/40 hover:bg-brand-surface-variant/70 text-brand-outline hover:text-brand-tertiary rounded-xl cursor-pointer transition-colors flex items-center justify-center"
                  title="Reiniciar fisicamente o controlador de tela"
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
