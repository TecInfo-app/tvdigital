import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDocs, writeBatch, getDocFromServer } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, cleanUndefined } from './firebase';
import { safeLocalStorage } from './utils/safeStorage';

import DashboardView from './components/DashboardView';
import PlayersView from './components/PlayersView';
import ContentView from './components/ContentView';
import PlaylistsView from './components/PlaylistsView';
import SchedulesView from './components/SchedulesView';
import AnalyticsView from './components/AnalyticsView';
import LivePlayerModal from './components/LivePlayerModal';
import Auth from './components/Auth';

import { 
  Loader2, 
  Tv, 
  Settings, 
  X, 
  Play, 
  Film, 
  ListVideo, 
  Monitor, 
  Calendar, 
  BarChart3, 
  LayoutDashboard, 
  LogOut, 
  Search, 
  Bell, 
  ArrowLeft,
  Activity,
  User,
  Sparkles
} from 'lucide-react';

import { MediaItem, Player, Playlist, LogEntry } from './types';
import { 
  INITIAL_MEDIA_ITEMS, 
  INITIAL_PLAYERS, 
  INITIAL_PLAYLISTS, 
  INITIAL_LOGS 
} from './mockData';

export default function App() {
  // Navigation tabs state: 'home' is the main screen showing side-by-side menu cards
  const [activeTab, setActiveTab] = useState<string>('home'); 
  const [activeSubTab, setActiveSubTab] = useState<'health' | 'alerts'>('health');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Core system states
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Global toast alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live monitor slideshow loop tracker
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);

  // Player / Ads Playback Modal state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorPlayer, setSimulatorPlayer] = useState<string>('TELA-PRINCIPAL-01');

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTvBoxMode, setIsTvBoxMode] = useState(() => {
    const saved = safeLocalStorage.getItem('tv_box_mode');
    if (saved !== null) return saved === 'true';
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isKnownTv = ua.includes('smarttv') || ua.includes('tvbox') || ua.includes('tv-box') || 
                        ua.includes('appletv') || ua.includes('dtv') || ua.includes('boxee') || 
                        ua.includes('roku') || ua.includes('googletv') || ua.includes('mibox') || 
                        ua.includes('xiaomi') || ua.includes('firetv') || ua.includes('firestick') ||
                        ua.includes('android tv') || ua.includes('webos') || ua.includes('tizen') ||
                        ua.includes('mxq') || ua.includes('tx3') || ua.includes('h96') || ua.includes('tanix');
      
      const isWebView = ua.includes('wv') || ua.includes('version/4.0') || (ua.includes('android') && !ua.includes('chrome/'));
      return isKnownTv || isWebView;
    }
    return false;
  });

  useEffect(() => {
    if (isTvBoxMode) {
      document.documentElement.classList.add('tv-box-performance');
    } else {
      document.documentElement.classList.remove('tv-box-performance');
    }
  }, [isTvBoxMode]);

  const [backendUrl, setBackendUrl] = useState(() => {
    const fallbackBackend = 'https://ais-dev-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app';
    let saved = safeLocalStorage.getItem('backend_api_url') || fallbackBackend;
    if (saved.includes('ais-pre-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app')) {
      saved = fallbackBackend;
      safeLocalStorage.setItem('backend_api_url', fallbackBackend);
    }
    return saved;
  });

  const handleSaveSettings = (newUrl: string, enableTvBoxMode: boolean) => {
    let cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    safeLocalStorage.setItem('backend_api_url', cleanUrl);
    setBackendUrl(cleanUrl);
    
    safeLocalStorage.setItem('tv_box_mode', enableTvBoxMode ? 'true' : 'false');
    setIsTvBoxMode(enableTvBoxMode);
    
    showToast('Configurações salvas com sucesso.');
    setIsSettingsOpen(false);
  };

  // Verify connection to Firestore on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Firebase auth state observer and data synchronizer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoadingData(true);
        const uid = currentUser.uid;
        
        let didTimeOutOrResolve = false;

        const timeoutId = setTimeout(() => {
          if (didTimeOutOrResolve) return;
          didTimeOutOrResolve = true;
          
          try {
            const localMedia = safeLocalStorage.getItem('local_media_items');
            const localPlayers = safeLocalStorage.getItem('local_players');
            const localPlaylists = safeLocalStorage.getItem('local_playlists');
            const localLogs = safeLocalStorage.getItem('local_logs');

            setMediaItems(localMedia ? JSON.parse(localMedia) : INITIAL_MEDIA_ITEMS);
            setPlayers(localPlayers ? JSON.parse(localPlayers) : INITIAL_PLAYERS);
            setPlaylists(localPlaylists ? JSON.parse(localPlaylists) : INITIAL_PLAYLISTS);
            setLogs(localLogs ? JSON.parse(localLogs) : INITIAL_LOGS);
          } catch (e) {
            setMediaItems(INITIAL_MEDIA_ITEMS);
            setPlayers(INITIAL_PLAYERS);
            setPlaylists(INITIAL_PLAYLISTS);
            setLogs(INITIAL_LOGS);
          }

          setLoadingData(false);
          showToast("Acesso rápido ativado (Modo Desempenho Local)");
        }, 3500);

        try {
          const mediaRef = collection(db, 'users', uid, 'media_items');
          const mediaSnap = await getDocs(mediaRef);
          
          if (!didTimeOutOrResolve) {
            clearTimeout(timeoutId);
            didTimeOutOrResolve = true;

            if (mediaSnap.empty) {
              const batch = writeBatch(db);
              
              INITIAL_MEDIA_ITEMS.forEach((item) => {
                const docRef = doc(db, 'users', uid, 'media_items', item.id);
                batch.set(docRef, cleanUndefined({ ...item, userId: uid }));
              });
              
              INITIAL_PLAYERS.forEach((player) => {
                const docRef = doc(db, 'users', uid, 'players', player.id);
                batch.set(docRef, cleanUndefined({ ...player, userId: uid }));
              });
              
              INITIAL_PLAYLISTS.forEach((pl) => {
                const docRef = doc(db, 'users', uid, 'playlists', pl.id);
                batch.set(docRef, cleanUndefined({ ...pl, userId: uid }));
              });
              
              INITIAL_LOGS.forEach((log) => {
                const docRef = doc(db, 'users', uid, 'logs', log.id);
                batch.set(docRef, cleanUndefined({ ...log, userId: uid }));
              });
              
              await batch.commit();
              
              setMediaItems(INITIAL_MEDIA_ITEMS);
              setPlayers(INITIAL_PLAYERS);
              setPlaylists(INITIAL_PLAYLISTS);
              setLogs(INITIAL_LOGS);

              safeLocalStorage.setItem('local_media_items', JSON.stringify(INITIAL_MEDIA_ITEMS));
              safeLocalStorage.setItem('local_players', JSON.stringify(INITIAL_PLAYERS));
              safeLocalStorage.setItem('local_playlists', JSON.stringify(INITIAL_PLAYLISTS));
              safeLocalStorage.setItem('local_logs', JSON.stringify(INITIAL_LOGS));
            } else {
              const items: MediaItem[] = [];
              mediaSnap.forEach(doc => items.push(doc.data() as MediaItem));
              setMediaItems(items);
              safeLocalStorage.setItem('local_media_items', JSON.stringify(items));

              const playersSnap = await getDocs(collection(db, 'users', uid, 'players'));
              const loadedPlayers: Player[] = [];
              playersSnap.forEach(doc => loadedPlayers.push(doc.data() as Player));
              setPlayers(loadedPlayers);
              safeLocalStorage.setItem('local_players', JSON.stringify(loadedPlayers));

              const playlistsSnap = await getDocs(collection(db, 'users', uid, 'playlists'));
              const loadedPlaylists: Playlist[] = [];
              playlistsSnap.forEach(doc => loadedPlaylists.push(doc.data() as Playlist));
              setPlaylists(loadedPlaylists);
              safeLocalStorage.setItem('local_playlists', JSON.stringify(loadedPlaylists));

              const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
              const loadedLogs: LogEntry[] = [];
              logsSnap.forEach(doc => loadedLogs.push(doc.data() as LogEntry));
              setLogs(loadedLogs);
              safeLocalStorage.setItem('local_logs', JSON.stringify(loadedLogs));
            }
          }
        } catch (error) {
          if (!didTimeOutOrResolve) {
            clearTimeout(timeoutId);
            didTimeOutOrResolve = true;
            handleFirestoreError(error, OperationType.GET, `users/${uid}`);
          }
        } finally {
          setLoadingData(false);
        }
      } else {
        setMediaItems([]);
        setPlayers([]);
        setPlaylists([]);
        setLogs([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync state helpers
  const handleSetMediaItems = async (update: MediaItem[] | ((prev: MediaItem[]) => MediaItem[])) => {
    const nextItems = typeof update === 'function' ? update(mediaItems) : update;
    setMediaItems(nextItems); 
    
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      const nextIds = new Set(nextItems.map(item => item.id));
      const deletedItems = mediaItems.filter(item => !nextIds.has(item.id));
      
      deletedItems.forEach((item) => {
        const docRef = doc(db, 'users', uid, 'media_items', item.id);
        batch.delete(docRef);
      });

      nextItems.forEach((item) => {
        const docRef = doc(db, 'users', uid, 'media_items', item.id);
        batch.set(docRef, cleanUndefined({ ...item, userId: uid }));
      });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/media_items`);
    }
  };

  const handleSetPlayers = async (update: Player[] | ((prev: Player[]) => Player[])) => {
    const nextPlayers = typeof update === 'function' ? update(players) : update;
    setPlayers(nextPlayers);

    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      const nextIds = new Set(nextPlayers.map(p => p.id));
      const deletedPlayers = players.filter(p => !nextIds.has(p.id));

      deletedPlayers.forEach((p) => {
        const docRef = doc(db, 'users', uid, 'players', p.id);
        batch.delete(docRef);
      });

      nextPlayers.forEach((p) => {
        const docRef = doc(db, 'users', uid, 'players', p.id);
        batch.set(docRef, cleanUndefined({ ...p, userId: uid }));
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/players`);
    }
  };

  const handleSetPlaylists = async (update: Playlist[] | ((prev: Playlist[]) => Playlist[])) => {
    const nextPlaylists = typeof update === 'function' ? update(playlists) : update;
    setPlaylists(nextPlaylists);

    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      const nextIds = new Set(nextPlaylists.map(pl => pl.id));
      const deletedPlaylists = playlists.filter(pl => !nextIds.has(pl.id));

      deletedPlaylists.forEach((pl) => {
        const docRef = doc(db, 'users', uid, 'playlists', pl.id);
        batch.delete(docRef);
      });

      nextPlaylists.forEach((pl) => {
        const docRef = doc(db, 'users', uid, 'playlists', pl.id);
        batch.set(docRef, cleanUndefined({ ...pl, userId: uid }));
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/playlists`);
    }
  };

  const handleSetLogs = async (update: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => {
    const nextLogs = typeof update === 'function' ? update(logs) : update;
    setLogs(nextLogs);

    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      const nextIds = new Set(nextLogs.map(l => l.id));
      const deletedLogs = logs.filter(l => !nextIds.has(l.id));

      deletedLogs.forEach((l) => {
        const docRef = doc(db, 'users', uid, 'logs', l.id);
        batch.delete(docRef);
      });

      nextLogs.forEach((l) => {
        const docRef = doc(db, 'users', uid, 'logs', l.id);
        batch.set(docRef, cleanUndefined({ ...l, userId: uid }));
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/logs`);
    }
  };

  // Toast feedback trigger helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Switch Active Playlist
  const handleSelectPlaylist = (playlistId: string) => {
    const updatedPlaylists = playlists.map(pl => ({
      ...pl,
      isActive: pl.id === playlistId
    }));
    handleSetPlaylists(updatedPlaylists);

    const selected = playlists.find(p => p.id === playlistId);
    if (selected) {
      showToast(`Carregando playlist "${selected.name}"...`);
    }
  };

  // Create Playlist
  const handleCreatePlaylist = (name: string) => {
    const newPl: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      itemIds: ['media-1', 'media-2'],
      isActive: false
    };
    handleSetPlaylists([...playlists, newPl]);
    
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      action: `Nova playlist cadastrada: "${name}"`,
      time: 'Agora'
    };
    handleSetLogs([newLog, ...logs]);
    showToast(`Playlist "${name}" criada com sucesso.`);
  };

  // Add media asset to currently active list
  const handleAddMedia = (newItem: Omit<MediaItem, 'id' | 'active'>) => {
    const itemWithId: MediaItem = {
      ...newItem,
      id: `media-${Date.now()}`,
      active: true
    };
    handleSetMediaItems([...mediaItems, itemWithId]);

    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      action: `Adicionado asset "${newItem.name}"`,
      time: 'Agora'
    };
    handleSetLogs([newLog, ...logs]);
    showToast(`Arquivo "${newItem.name}" adicionado à playlist.`);
  };

  // Deploy all changes to active TV screens
  const handleDeployAll = () => {
    showToast("✓ Publicando alterações em todos os displays...");
    
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      action: 'Deploy global acionado.',
      time: 'Agora'
    };
    handleSetLogs([newLog, ...logs]);

    handleSetPlayers(players.map(p => ({ ...p, status: 'online', cpu: 25, lastSync: '1s atrás' })));
  };

  // Player actions
  const handlePlayerAction = (id: string, action: 'reboot' | 'sync') => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;

    if (action === 'reboot') {
      showToast(`Reiniciando "${targetPlayer.name}"...`);
      setTimeout(() => {
        showToast(`Display "${targetPlayer.name}" reiniciado com sucesso.`);
      }, 3000);
    } else {
      showToast(`Sincronizando "${targetPlayer.name}"...`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Desconectado com sucesso.');
    } catch (err) {
      console.error(err);
      showToast('Falha ao desconectar.');
    }
  };

  // Open Fullscreen Ads Reproducer directly
  const handleOpenPlayer = (player?: Player) => {
    setSimulatorPlayer(player ? player.name : 'TELA-PRINCIPAL-01');
    setIsSimulatorOpen(true);
  };

  // Loading Screen
  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
          <Tv className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Carregando FastPlayer...
          </span>
        </div>
      </div>
    );
  }

  // Not Authenticated screen
  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.ip.includes(searchQuery)
  );

  // Menu cards list for side-by-side display
  const menuItems = [
    {
      id: 'play-ads',
      title: 'Reproduzir Propagandas',
      subtitle: 'Iniciar exibição de mídias e anúncios em tela cheia agora',
      icon: Play,
      isPrimary: true,
      onClick: () => handleOpenPlayer()
    },
    {
      id: 'content',
      title: 'Mídias e Anúncios',
      subtitle: 'Cadastrar vídeos, imagens, notícias e páginas web',
      icon: Film,
      isPrimary: false,
      onClick: () => setActiveTab('content')
    },
    {
      id: 'playlists',
      title: 'Playlists',
      subtitle: 'Organizar a ordem e duração da reprodução',
      icon: ListVideo,
      isPrimary: false,
      onClick: () => setActiveTab('playlists')
    },
    {
      id: 'players',
      title: 'Telas e Players',
      subtitle: 'Gerenciar dispositivos e monitorar conexões',
      icon: Monitor,
      isPrimary: false,
      onClick: () => setActiveTab('players')
    },
    {
      id: 'schedules',
      title: 'Programação',
      subtitle: 'Agendar horários de exibição das mídias',
      icon: Calendar,
      isPrimary: false,
      onClick: () => setActiveTab('schedules')
    },
    {
      id: 'analytics',
      title: 'Estatísticas',
      subtitle: 'Métricas de reprodução e relatórios de exibição',
      icon: BarChart3,
      isPrimary: false,
      onClick: () => setActiveTab('analytics')
    },
    {
      id: 'dashboard',
      title: 'Painel Geral',
      subtitle: 'Resumo do sistema e histórico de eventos',
      icon: LayoutDashboard,
      isPrimary: false,
      onClick: () => setActiveTab('dashboard')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col">
      
      {/* Super Simple Top Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Home Button */}
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-gray-900 block leading-tight">
                FastPlayer
              </span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                Mídia Indoor
              </span>
            </div>
          </button>

          {/* Quick Search */}
          <div className="hidden sm:flex items-center relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mídias ou telas..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleDeployAll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Publicar alterações"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Publicar</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-gray-200 my-auto hidden sm:block" />

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold">
                {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Navigation Breadcrumb bar if in sub-view */}
        {activeTab !== 'home' && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-3.5 py-2 rounded-lg border border-gray-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Início (Menus)</span>
            </button>

            {/* Top Menu Tabs for fast switching */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 scroll-hide">
              {[
                { id: 'content', label: 'Mídias' },
                { id: 'playlists', label: 'Playlists' },
                { id: 'players', label: 'Telas' },
                { id: 'schedules', label: 'Programação' },
                { id: 'analytics', label: 'Estatísticas' },
                { id: 'dashboard', label: 'Painel Geral' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* HOME SCREEN: Clean Side-by-Side Menu Cards */}
        {activeTab === 'home' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Greeting Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Painel de Controle FastPlayer</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Selecione uma opção
                </h2>
                <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
                  Gerencie suas propagandas, organizando vídeos, imagens e programações de mídia indoor com simplicidade.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* SIDE-BY-SIDE MENU CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                
                if (item.isPrimary) {
                  return (
                    <div
                      key={item.id}
                      onClick={item.onClick}
                      className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 border-2 border-blue-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl hover:shadow-2xl hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                          <span className="px-3 py-1 bg-blue-500/30 text-blue-300 text-xs font-bold rounded-full border border-blue-400/30 uppercase tracking-wider">
                            Modo Exibição
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10 mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Clique para Abrir o Player</span>
                          <span className="text-lg">→</span>
                        </span>
                        <div className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md">
                          ▶ Iniciar Agora
                        </div>
                      </div>

                      <div className="absolute right-0 bottom-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    onClick={item.onClick}
                    className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 opacity-80 group-hover:opacity-100">
                      <span>Acessar</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ACTIVE SUB-VIEW RENDER */
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            {activeTab === 'dashboard' && (
              <DashboardView 
                players={players} 
                logs={logs} 
                mediaItems={mediaItems} 
                setActiveTab={setActiveTab}
                onDeployAll={handleDeployAll}
              />
            )}
            {activeTab === 'players' && (
              <PlayersView 
                players={filteredPlayers} 
                mediaItems={mediaItems}
                onPlayerAction={handlePlayerAction}
                onOpenSimulator={handleOpenPlayer}
              />
            )}
            {activeTab === 'content' && (
              <ContentView 
                mediaItems={mediaItems}
                setMediaItems={handleSetMediaItems}
                onAddMedia={handleAddMedia}
                currentPlayingIndex={currentPlayingIndex}
              />
            )}
            {activeTab === 'playlists' && (
              <PlaylistsView 
                playlists={playlists}
                mediaItems={mediaItems}
                onSelectPlaylist={handleSelectPlaylist}
                onCreatePlaylist={handleCreatePlaylist}
              />
            )}
            {activeTab === 'schedules' && (
              <SchedulesView playlists={playlists} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView />
            )}
          </div>
        )}

      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-gray-800">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full status-pulse"></div>
          <span className="text-xs font-semibold tracking-wide">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Fullscreen Ads Player Modal */}
      <LivePlayerModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        mediaItems={mediaItems}
        playerName={simulatorPlayer}
        initialIndex={currentPlayingIndex}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Configurações do Sistema</span>
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Ajuste servidores e modo de desempenho do FastPlayer.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const urlVal = formData.get('backendUrl') as string;
              const tvBoxVal = formData.get('tvBoxMode') === 'on';
              handleSaveSettings(urlVal, tvBoxVal);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  URL do Servidor de Integração
                </label>
                <input 
                  type="text"
                  name="backendUrl"
                  defaultValue={backendUrl}
                  required
                  placeholder="https://exemplo-api.fly.dev"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input 
                    type="checkbox"
                    name="tvBoxMode"
                    defaultChecked={isTvBoxMode}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Modo TV Box & Desempenho
                    </span>
                    <span className="block text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Desativa animações e melhora o desempenho em Smart TVs e Android TV Boxes.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
