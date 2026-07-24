/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Bell, MonitorPlay, Activity, Menu } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeSubTab: 'health' | 'alerts';
  setActiveSubTab: (tab: 'health' | 'alerts') => void;
  onDeployAll: () => void;
  onOpenSimulator: () => void;
  logsCount: number;
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  activeSubTab,
  setActiveSubTab,
  onDeployAll,
  onOpenSimulator,
  logsCount,
  onMenuClick,
  isSidebarCollapsed = false
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const headerLayoutClass = isSidebarCollapsed 
    ? 'lg:ml-[112px] lg:w-[calc(100%-128px)]' 
    : 'lg:ml-[312px] lg:w-[calc(100%-328px)]';

  return (
    <header className={`flex justify-between items-center h-16 px-4 md:px-8 sticky top-4 z-40 bg-[#14102c] border border-white/10 rounded-2xl shadow-lg mt-4 mr-4 ml-4 w-[calc(100%-32px)] ${headerLayoutClass} transition-all duration-300`}>
      <div className="flex items-center gap-3 md:gap-10">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden text-white/60 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="font-geist text-xs md:text-sm font-black text-white uppercase tracking-wider hidden sm:block shrink-0">
          FastPlayer Pro
        </h1>
        <div className="flex gap-3 md:gap-6 h-full items-center">
          <button
            onClick={() => setActiveSubTab('health')}
            className={`font-semibold text-[10px] md:text-xs pb-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'health'
                ? 'text-white border-white'
                : 'text-white/60 hover:text-white border-transparent'
            }`}
          >
            Saúde da Rede
          </button>
          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`font-semibold text-[10px] md:text-xs pb-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'alerts'
                ? 'text-white border-white'
                : 'text-white/60 hover:text-white border-transparent'
            }`}
          >
            <span>Alertas</span>
            {logsCount > 0 && (
              <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full status-pulse"></span>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 max-w-[50%] md:max-w-none">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="bg-white/5 border border-white/10 rounded-full pl-8 pr-3 py-1 text-xs text-white placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:outline-none transition-all w-24 sm:w-44 md:w-64"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-4 border-l border-white/10 pl-2 sm:pl-6 h-6">
          {/* Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            title="Abrir Simulador de Tela de TV"
            className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="hidden xl:inline">Simular Tela de TV</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer relative shrink-0"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-secondary rounded-full"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-slate-900/95 border border-white/15 rounded-xl shadow-2xl p-4 backdrop-blur-2xl z-50">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <h4 className="font-semibold text-xs text-white font-geist">Notificações</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] text-white/80 hover:underline font-bold">Fechar</button>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scroll-hide">
                  <div className="p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                    <p className="text-white font-medium">Todos os displays sincronizados com sucesso</p>
                    <p className="text-[10px] text-white/50 mt-0.5">há 2 min</p>
                  </div>
                  <div className="p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                    <p className="text-white font-medium">Player 'LONDON-PICCADILLY-04' está offline</p>
                    <p className="text-[10px] text-white/50 mt-0.5">há 2 horas</p>
                  </div>
                  <div className="p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                    <p className="text-white font-medium">Limite de largura de banda excedido em TOKYO</p>
                    <p className="text-[10px] text-white/50 mt-0.5">há 4 horas</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deploy All */}
          <button
            onClick={onDeployAll}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-2.5 sm:px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer shadow-md flex items-center gap-1 shrink-0"
          >
            <Activity className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
            <span className="hidden sm:inline">Publicar Tudo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
