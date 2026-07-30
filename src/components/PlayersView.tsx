/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Monitor, 
  RefreshCw, 
  Power, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  UserCheck, 
  UserPlus, 
  Wifi, 
  ShieldAlert, 
  Laptop, 
  Loader2 
} from 'lucide-react';
import { Player, MediaItem } from '../types';

interface PlayersViewProps {
  players: Player[];
  mediaItems: MediaItem[];
  registeredUsers?: any[];
  onPlayerAction: (id: string, action: 'reboot' | 'sync') => void;
  onAssignUser: (playerId: string, userEmail: string, userId?: string) => void;
  onOpenSimulator: (player: Player) => void;
}

const DEMO_USERS = [
  { id: 'usr-1', email: 'iranildo.jobs@gmail.com', status: 'online' },
  { id: 'usr-2', email: 'operador.noite@fastplayer.com', status: 'offline' },
  { id: 'usr-3', email: 'suporte.tecnico@fastplayer.com', status: 'online' },
  { id: 'usr-4', email: 'cliente.supermercado@fastplayer.com', status: 'online' }
];

export default function PlayersView({
  players,
  mediaItems,
  registeredUsers = [],
  onPlayerAction,
  onAssignUser,
  onOpenSimulator
}: PlayersViewProps) {
  const [rebootingIds, setRebootingIds] = useState<Record<string, boolean>>({});
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});

  // Merge registered users with demo users to offer a rich checklist, while deduplicating by email
  const userList = useMemo(() => {
    const map = new Map<string, any>();
    
    // Add demo users first
    DEMO_USERS.forEach(u => map.set(u.email.toLowerCase(), u));
    
    // Add real registered users (will overwrite demo if email matches)
    registeredUsers.forEach(u => {
      if (u.email) {
        map.set(u.email.toLowerCase(), {
          id: u.uid || u.id,
          email: u.email,
          status: u.status || 'online'
        });
      }
    });

    return Array.from(map.values());
  }, [registeredUsers]);

  const handleReboot = (playerId: string) => {
    setRebootingIds(prev => ({ ...prev, [playerId]: true }));
    onPlayerAction(playerId, 'reboot');
    
    // Remove local spinner overlay after 3 seconds
    setTimeout(() => {
      setRebootingIds(prev => ({ ...prev, [playerId]: false }));
    }, 3000);
  };

  const handleSync = (playerId: string) => {
    setSyncingIds(prev => ({ ...prev, [playerId]: true }));
    onPlayerAction(playerId, 'sync');
    
    setTimeout(() => {
      setSyncingIds(prev => ({ ...prev, [playerId]: false }));
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-geist text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>Terminais de Rede & Players ({players.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie, reinicie e atribua operadores para cada display físico de TV de sinalização digital.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl cursor-pointer transition-colors text-xs font-bold"
          title="Forçar atualização de telemetria"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Painel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {players.map((player) => {
          // Find currently playing media details
          const currentMedia = mediaItems.find(item => item.id === player.currentMediaId);
          const isRebooting = rebootingIds[player.id];
          const isSyncing = syncingIds[player.id];

          return (
            <div 
              key={player.id} 
              className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 shadow-sm flex flex-col justify-between bg-white ${
                isRebooting 
                  ? 'border-amber-300 ring-2 ring-amber-500/10' 
                  : player.status === 'offline'
                  ? 'border-slate-200 opacity-90'
                  : 'border-slate-200 hover:border-pink-300 hover:shadow-md'
              }`}
            >
              {/* Rebooting overlay with beautiful progress indicators */}
              {isRebooting && (
                <div className="absolute inset-0 bg-slate-900/95 z-25 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-200">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center animate-spin mb-4">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white font-geist">Reiniciando Terminal</h4>
                  <p className="text-[11px] text-slate-400 font-inter mt-1 max-w-xs">
                    Enviando pacote de reinicialização para {player.name} ({player.ip})...
                  </p>
                  <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-amber-500 animate-pulse" style={{ width: '70%' }} />
                  </div>
                </div>
              )}

              <div>
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                      player.status === 'online'
                        ? 'bg-pink-50 border-pink-100 text-pink-600'
                        : player.status === 'warning'
                        ? 'bg-amber-50 border-amber-100 text-amber-600'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <Monitor className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="font-geist font-bold text-gray-900 text-base flex items-center gap-1.5">
                        {player.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono-data mt-0.5">
                        IP: {player.ip} • Resolução: {player.resolution}
                      </p>
                    </div>
                  </div>

                  {/* Status chip */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-geist tracking-wider shrink-0 flex items-center gap-1.5 ${
                    player.status === 'online'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : player.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      player.status === 'online'
                        ? 'bg-emerald-500 animate-pulse'
                        : player.status === 'warning'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}></span>
                    <span>{player.status === 'warning' ? 'ATENÇÃO' : player.status.toUpperCase()}</span>
                  </span>
                </div>

                {/* Playing Info block */}
                <div className="mt-5 p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center gap-4">
                  <div className="w-16 h-10 rounded-lg bg-slate-200 overflow-hidden border border-slate-300 shrink-0 relative flex items-center justify-center">
                    {currentMedia ? (
                      currentMedia.type === 'video' ? (
                        <video 
                          src={currentMedia.url} 
                          className="w-full h-full object-cover" 
                          muted 
                          autoPlay 
                          playsInline 
                          loop 
                        />
                      ) : (
                        <img src={currentMedia.url} alt="Playing thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )
                    ) : (
                      <Monitor className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold font-geist">Mídia Ativa</p>
                    <p className="text-xs font-bold text-gray-900 truncate mt-0.5">
                      {currentMedia ? currentMedia.name : 'Nenhum Conteúdo Carregado'}
                    </p>
                  </div>
                  {player.status !== 'offline' && (
                    <button 
                      onClick={() => onOpenSimulator(player)}
                      className="p-2 bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all rounded-lg cursor-pointer"
                      title="Simular reprodutor no navegador"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>

                {/* Assign Operator / User Selection */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-geist flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-pink-600" />
                    <span>Operador Logado / Responsável</span>
                  </label>
                  
                  <div className="flex gap-2">
                    <select
                      value={player.assignedUserEmail || ''}
                      onChange={(e) => onAssignUser(player.id, e.target.value)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 cursor-pointer transition-all"
                    >
                      <option value="">-- Sem Operador Vinculado --</option>
                      {userList.map((usr) => (
                        <option key={usr.id || usr.email} value={usr.email}>
                          {usr.email} {usr.status === 'online' ? '🟢' : '⚫'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {player.assignedUserEmail ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-bold font-inter">
                        Operador {player.assignedUserEmail} vinculado à tela.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-amber-600 font-bold font-inter">
                        Esta tela necessita de vinculação de operador para auditoria.
                      </span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                {player.status !== 'offline' ? (
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-500 font-geist">Carga de CPU</p>
                      <div className="flex items-center gap-2.5 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              player.cpu > 80 ? 'bg-amber-500' : 'bg-pink-500'
                            }`}
                            style={{ width: `${player.cpu}%` }}
                          ></div>
                        </div>
                        <span className="font-mono-data text-xs font-bold text-gray-800 w-7 text-right">{player.cpu}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-geist">Uso de Banda</p>
                      <p className="font-mono-data text-xs font-bold text-gray-800 mt-1">{player.bandwidth} Mbps</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center py-2 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 italic font-inter flex items-center justify-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span>Sem resposta do ping. Forçar reinicialização para reparar.</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleSync(player.id)}
                  disabled={player.status === 'offline' || isSyncing}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <span>Forçar Sincronização</span>
                  )}
                </button>
                <button
                  onClick={() => handleReboot(player.id)}
                  className="px-4 py-2 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 font-bold text-xs"
                  title="Reiniciar fisicamente o controlador de tela"
                >
                  <Power className="w-4 h-4" />
                  <span>Reiniciar Tela</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
