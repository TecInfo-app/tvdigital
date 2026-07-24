/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  Tv, 
  FolderOpen, 
  ListMusic, 
  Calendar, 
  BarChart3, 
  PlusCircle, 
  Settings, 
  HelpCircle,
  Bolt,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDeployClick: () => void;
  onSettingsClick: () => void;
  onSupportClick: () => void;
  user: any;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onDeployClick,
  onSettingsClick,
  onSupportClick,
  user,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'players', label: 'Players', icon: Tv },
    { id: 'content', label: 'Conteúdo', icon: FolderOpen },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'schedules', label: 'Agendamentos', icon: Calendar },
    { id: 'analytics', label: 'Métricas', icon: BarChart3 },
  ];

  const sidebarWidthClass = isCollapsed ? 'w-[84px] px-3 py-6' : 'w-[280px] p-6';
  const mobileTranslateClass = isMobileOpen 
    ? 'translate-x-0' 
    : '-translate-x-full lg:translate-x-0';

  return (
    <aside 
      id="sidebar" 
      className={`${sidebarWidthClass} ${mobileTranslateClass} h-[calc(100vh-32px)] fixed left-4 top-4 border border-white/15 bg-white/5 backdrop-blur-3xl flex flex-col gap-4 z-50 transition-all duration-300 rounded-[28px] shadow-2xl`}
    >
      {/* Brand Header */}
      {!isCollapsed ? (
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shrink-0">
              <Bolt className="text-white w-4.5 h-4.5" />
            </div>
            <span className="font-geist text-lg font-bold text-white tracking-wide truncate">SignageOS</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Toggle Collapse Button on Desktop */}
            <button 
              onClick={onToggleCollapse}
              className="hidden lg:flex text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer shrink-0"
              title="Recolher Menu"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Close Button on Mobile */}
            <button 
              onClick={onCloseMobile}
              className="lg:hidden text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer shrink-0"
              title="Fechar Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 mb-8 px-1">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shrink-0">
            <Bolt className="text-white w-4.5 h-4.5" />
          </div>
          <button 
            onClick={onToggleCollapse}
            className="hidden lg:flex text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
            title="Expandir Menu"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation list */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'
              } ${
                isActive 
                  ? 'bg-white/10 text-white font-bold border border-white/15 shadow-md' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/60'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className={`mt-auto space-y-4 pt-6 border-t border-white/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <button 
          onClick={() => {
            onDeployClick();
            if (onCloseMobile) onCloseMobile();
          }}
          title={isCollapsed ? "Publicar Novo Conteúdo" : undefined}
          className={`w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-xl font-bold text-xs flex items-center justify-center hover:opacity-95 active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-lg ${
            isCollapsed ? 'p-3' : 'py-3 gap-2'
          }`}
        >
          <PlusCircle className="w-4.5 h-4.5 shrink-0" />
          {!isCollapsed && <span className="truncate">Publicar Novo Conteúdo</span>}
        </button>

        <div className="space-y-1 w-full">
          <button 
            onClick={() => {
              onSettingsClick();
              if (onCloseMobile) onCloseMobile();
            }}
            title={isCollapsed ? "Configurações" : undefined}
            className={`w-full flex items-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-xs text-left cursor-pointer ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2'
            }`}
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            {!isCollapsed && <span className="truncate">Configurações</span>}
          </button>
          <button 
            onClick={() => {
              onSupportClick();
              if (onCloseMobile) onCloseMobile();
            }}
            title={isCollapsed ? "Suporte" : undefined}
            className={`w-full flex items-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-xs text-left cursor-pointer ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2'
            }`}
          >
            <HelpCircle className="w-4.5 h-4.5 shrink-0" />
            {!isCollapsed && <span className="truncate">Suporte</span>}
          </button>
        </div>

        {/* User Card */}
        <div className={`flex items-center bg-white/5 rounded-2xl border border-white/10 w-full ${
          isCollapsed ? 'justify-center p-2' : 'gap-2.5 p-3'
        }`}>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
            {user?.photoURL ? (
              <img 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                alt="Avatar do Usuário"
                src={user.photoURL}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <User className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white truncate">{user?.email || 'admin@fastplayer.pro'}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold font-geist mt-0.5">Admin da Rede</p>
              </div>
              <button 
                onClick={onLogout}
                title="Sair"
                className="text-white/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
