/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CheckCircle, History, PlayCircle, Network, Users, AlertTriangle, Trash2, Search } from 'lucide-react';
import { Player, LogEntry, MediaItem } from '../types';

interface DashboardViewProps {
  players: Player[];
  logs: LogEntry[];
  mediaItems: MediaItem[];
  setActiveTab: (tab: string) => void;
  onDeployAll: () => void;
  syncStatus?: 'success' | 'error' | 'syncing' | 'idle';
  lastSyncTime?: string | null;
  onDeleteMedia?: (id: string) => void;
}

export default function DashboardView({
  players,
  logs,
  mediaItems,
  setActiveTab,
  onDeployAll,
  syncStatus = 'idle',
  lastSyncTime = null,
  onDeleteMedia
}: DashboardViewProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const activePlayersCount = players.filter(p => p.status === 'online').length;
  const warningPlayersCount = players.filter(p => p.status === 'warning').length;
  const totalPlayersCount = players.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome & Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Welcome Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between min-h-[210px] border border-gray-200 40 shadow-xl shadow-brand-surface-lowest/40">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-geist text-2xl font-bold text-gray-900">Bem-vindo de volta, Admin</h2>
              {/* Sync Status Indicator */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-geist tracking-wide ${
                syncStatus === 'success' ? 'bg-green-100 text-green-700' :
                syncStatus === 'error' ? 'bg-red-100 text-red-700' :
                syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                'bg-gray-100 text-gray-700'
              }`}>
                {syncStatus === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
                {syncStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5" />}
                {syncStatus === 'syncing' && <Network className="w-3.5 h-3.5" />}
                <span>
                  {syncStatus === 'success' ? 'Sincronizado' :
                   syncStatus === 'error' ? 'Falha na Sincronização' :
                   syncStatus === 'syncing' ? 'Sincronizando...' : 'Pronto'}
                </span>
                {lastSyncTime && syncStatus !== 'syncing' && <span className="font-normal opacity-80 ml-1 hidden sm:inline">{lastSyncTime}</span>}
              </div>
            </div>
            <p className="text-gray-900-variant text-sm mt-2 font-inter leading-relaxed">
              Sua rede de sinalização digital está <strong className="text-pink-600">98% operacional</strong> em todos os displays ativos em regiões metropolitanas.
            </p>
          </div>
          <div className="flex gap-4 mt-6">
            <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <p className="text-gray-500 text-[11px] uppercase tracking-wider font-bold font-geist">Mídia Total</p>
              <p className="text-xl font-bold font-geist text-gray-900 mt-1">{mediaItems.length} Itens</p>
            </div>
            <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <p className="text-gray-500 text-[11px] uppercase tracking-wider font-bold font-geist">Stream Ativo</p>
              <p className="text-xl font-bold font-geist text-pink-600 mt-1">Transmissão Ao Vivo</p>
            </div>
          </div>
        </div>

        {/* TV Status Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-gray-200 40 shadow-xl shadow-brand-surface-lowest/40">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-brand-secondary-container/20 text-pink-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </span>
            <span className="text-pink-600 flex items-center gap-1.5 text-xs font-bold font-geist">
              <span className="w-2 h-2 bg-brand-secondary rounded-full status-pulse"></span>
              ONLINE
            </span>
          </div>
          <div>
            <p className="text-brand-outline text-[11px] uppercase tracking-wider font-bold font-geist">Status da TV</p>
            <h3 className="text-2xl font-black font-geist mt-1 text-gray-900">{activePlayersCount} Ativos</h3>
            <p className="text-xs text-gray-900-variant mt-1.5 font-inter">
              {warningPlayersCount} dispositivo{warningPlayersCount !== 1 ? 's' : ''} precisando de atenção
            </p>
          </div>
        </div>

        {/* Recent Logs Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-gray-200 40 shadow-xl shadow-brand-surface-lowest/40">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-brand-tertiary/20 text-brand-tertiary rounded-xl">
              <History className="w-5 h-5" />
            </span>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className="text-blue-600 text-xs font-bold font-geist hover:underline cursor-pointer"
            >
              VER TUDO
            </button>
          </div>
          <div>
            <p className="text-brand-outline text-[11px] uppercase tracking-wider font-bold font-geist">Logs Recentes</p>
            <div className="mt-3 space-y-2.5">
              {logs.slice(0, 2).map((log) => (
                <div key={log.id} className="flex justify-between items-start gap-2 text-xs">
                  <span className="text-gray-900-variant line-clamp-1 leading-snug">{log.action}</span>
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
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-gray-200 40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Network className="w-5 h-5 text-blue-600" />
              <h3 className="font-geist text-lg font-bold text-gray-900">Status de Publicação da Rede</h3>
            </div>
            <p className="text-sm text-gray-900-variant font-inter leading-relaxed">
              Sincronize seus elementos de rede e envie as definições de playlist de mídia mais recentes instantaneamente para telas ativas em todo o mundo.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="p-3 bg-gray-50 rounded-xl text-center border border-gray-200">
              <p className="text-xl font-bold text-gray-900 font-geist">{totalPlayersCount}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-bold font-geist">Telas Totais</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center border border-gray-200">
              <p className="text-xl font-bold text-pink-600 font-geist">{activePlayersCount}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-bold font-geist">Sincronizadas</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center border border-gray-200">
              <p className="text-xl font-bold text-pink-600 font-geist">{players.filter(p => p.status === 'offline').length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-bold font-geist">Telas Offline</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onDeployAll}
              className="bg-gray-50 border border-gray-200 text-gray-900 font-bold px-5 py-3 rounded-xl text-xs hover:bg-gray-50 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sincronizar Todas as Telas</span>
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
            >
              Configurar Displays
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Varredura de Banco (Lixo)
            </button>
          </div>
        </div>

        {/* Warning Logs & Quick Troubleshooting info */}
        <div className="glass-card p-6 rounded-2xl border border-gray-200 40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-brand-tertiary w-5 h-5" />
              <h3 className="font-geist text-lg font-bold text-gray-900">Necessitam Sincronização</h3>
            </div>
            <div className="space-y-3.5">
               {players.filter(p => p.status !== 'online').map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-gray-900 font-geist">{player.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono-data">{player.ip} • Último Sync: {player.lastSync}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-geist tracking-wider shrink-0 ${
                    player.status === 'warning' 
                      ? 'bg-amber-500/20 text-amber-300' 
                      : 'bg-gray-50 text-gray-500'
                  }`}>
                    {player.status === 'warning' ? 'ATENÇÃO' : player.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 text-center">
            <p className="text-[11px] text-gray-500 font-inter">
              Todos os outros 234 terminais de TV estão conectados através de redes CDN de borda regional.
            </p>
          </div>
        </div>
      </section>

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Search className="text-red-500 w-6 h-6" />
                <div>
                  <h3 className="font-geist text-xl font-bold text-gray-900">Varredura de Banco de Dados</h3>
                  <p className="text-xs text-gray-500 mt-1 font-inter">Identifique mídias muito pesadas que possam estar atrasando o carregamento da TV.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              <div className="space-y-3">
                {mediaItems
                  .map(item => {
                    const strSize = JSON.stringify(item).length;
                    // base64 approx size in bytes
                    const bytes = strSize * 0.75; 
                    const isLarge = bytes > 100000; // > 100KB
                    return { ...item, bytes, isLarge };
                  })
                  .sort((a, b) => b.bytes - a.bytes)
                  .map(item => (
                    <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between ${item.isLarge ? 'bg-red-50/50 border-red-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-4">
                        {item.type === 'image' && item.url?.startsWith('data:image') ? (
                          <img src={item.url} alt="" className="w-12 h-12 rounded object-cover border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center border border-gray-200 text-xs font-bold text-gray-400">{item.type}</div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900 font-geist">{item.name || 'Sem Nome'}</p>
                          <p className={`text-xs mt-0.5 font-mono-data ${item.isLarge ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            Tamanho aprox: {(item.bytes / 1024).toFixed(1)} KB
                            {item.isLarge && ' (PESADO - Pode causar lentidão)'}
                          </p>
                        </div>
                      </div>
                      {onDeleteMedia && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja apagar o item "${item.name}" definitivamente do banco?`)) {
                              onDeleteMedia(item.id!);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Mídia"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                ))}
                {mediaItems.length === 0 && (
                  <div className="text-center p-8 text-gray-500 text-sm">
                    Nenhuma mídia encontrada no banco.
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end bg-white rounded-b-2xl">
              <button
                onClick={() => setIsScannerOpen(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
