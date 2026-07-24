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
    <header className={`flex justify-between items-center h-16 px-4 md:px-8 sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm w-full transition-all duration-300`}>
      <div className="flex items-center gap-3 md:gap-10">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden text-gray-500 hover:text-gray-900 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="font-geist text-xs md:text-sm font-black text-gray-900 uppercase tracking-wider hidden sm:block shrink-0">
          FastPlayer Pro
        </h1>
        <div className="flex gap-3 md:gap-6 h-full items-center">
          <button
            onClick={() => setActiveSubTab('health')}
            className={`font-semibold text-[10px] md:text-xs pb-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'health'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-900 border-transparent'
            }`}
          >
            Saúde da Rede
          </button>
          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`font-semibold text-[10px] md:text-xs pb-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'alerts'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 hover:text-gray-900 border-transparent'
            }`}
          >
            <span>Alertas</span>
            {logsCount > 0 && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full status-pulse"></span>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 max-w-[50%] md:max-w-none">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="bg-white border border-gray-300 rounded-full pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all w-24 sm:w-44 md:w-64 shadow-sm"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-4 border-l border-gray-200 pl-2 sm:pl-6 h-6">
          {/* Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            title="Abrir Simulador de Tela de TV"
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="hidden xl:inline">Simular Tela de TV</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-all cursor-pointer relative shrink-0"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                  <h4 className="font-semibold text-xs text-gray-900 font-geist">Notificações</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] text-gray-500 hover:underline font-bold">Fechar</button>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scroll-hide">
                  <div className="p-2 hover:bg-gray-50 rounded-lg text-xs transition-colors">
                    <p className="text-gray-900 font-medium">Todos os displays sincronizados com sucesso</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">há 2 min</p>
                  </div>
                  <div className="p-2 hover:bg-gray-50 rounded-lg text-xs transition-colors">
                    <p className="text-gray-900 font-medium">Player 'LONDON-PICCADILLY-04' está offline</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">há 2 horas</p>
                  </div>
                  <div className="p-2 hover:bg-gray-50 rounded-lg text-xs transition-colors">
                    <p className="text-gray-900 font-medium">Limite de largura de banda excedido em TOKYO</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">há 4 horas</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deploy All */}
          <button
            onClick={onDeployAll}
            className="bg-blue-600 hover:bg-blue-700 text-gray-900 px-2.5 sm:px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Publicar Tudo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
