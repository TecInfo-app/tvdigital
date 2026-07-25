import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDocs, writeBatch, getDocFromServer, query, where } from 'firebase/firestore';
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
  ArrowLeft,
  Activity,
  User,
  Link,
  FileText,
  Copy,
  Check
} from 'lucide-react';

import { MediaItem, Player, Playlist, LogEntry } from './types';
import { 
  INITIAL_MEDIA_ITEMS, 
  INITIAL_PLAYERS, 
  INITIAL_PLAYLISTS, 
  INITIAL_LOGS 
} from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home'); 
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
  const [currentPlayingIndex] = useState(0);

  // Player / Ads Playback Modal state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorPlayer, setSimulatorPlayer] = useState<string>('TELA-PRINCIPAL-01');

  // Dropbox Converter states
  const [dropIn, setDropIn] = useState('');
  const [dropOutLink, setDropOutLink] = useState('');
  const [showDropOut, setShowDropOut] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Report states
  const [repStart, setRepStart] = useState('');
  const [repEnd, setRepEnd] = useState('');
  const [reportResults, setReportResults] = useState<Record<string, number> | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

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
    
    showToast('Configurações salvas.');
    setIsSettingsOpen(false);
  };

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
          showToast("Acesso rápido ativado");
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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSelectPlaylist = (playlistId: string) => {
    const updatedPlaylists = playlists.map(pl => ({
      ...pl,
      isActive: pl.id === playlistId
    }));
    handleSetPlaylists(updatedPlaylists);

    const selected = playlists.find(p => p.id === playlistId);
    if (selected) {
      showToast(`Playlist ativa: ${selected.name}`);
    }
  };

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
      action: `Nova playlist: "${name}"`,
      time: 'Agora'
    };
    handleSetLogs([newLog, ...logs]);
    showToast(`Playlist "${name}" criada.`);
  };

  const handleAddMedia = (newItem: Omit<MediaItem, 'id' | 'active'>) => {
    const itemWithId: MediaItem = {
      ...newItem,
      id: `media-${Date.now()}`,
      active: true
    };
    handleSetMediaItems([...mediaItems, itemWithId]);

    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      action: `Adicionada mídia "${newItem.name}"`,
      time: 'Agora'
    };
    handleSetLogs([newLog, ...logs]);
    showToast(`Mídia "${newItem.name}" adicionada.`);
  };

  const handleDeployAll = () => {
    showToast("Publicando alterações em todos os exibições...");
    
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      action: 'Publicação global acionada.',
      time: 'Agora'
    };
    handleSetLogs([newLog, ...logs]);
    handleSetPlayers(players.map(p => ({ ...p, status: 'online', cpu: 25, lastSync: '1s atrás' })));
  };

  const handlePlayerAction = (id: string, action: 'reboot' | 'sync') => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;

    if (action === 'reboot') {
      showToast(`Reiniciando ${targetPlayer.name}...`);
    } else {
      showToast(`Sincronizando ${targetPlayer.name}...`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Sessão encerrada.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao sair.');
    }
  };

  const handleOpenPlayer = (player?: Player) => {
    setSimulatorPlayer(player ? player.name : 'TELA-PRINCIPAL-01');
    setIsSimulatorOpen(true);
  };

  // Convert Dropbox Link helper
  const convertDrop = () => {
    if (!dropIn.includes('dropbox.com')) {
      alert("Link Inválido");
      return;
    }
    const converted = dropIn.replace('dl=0', 'raw=1');
    setDropOutLink(converted);
    setShowDropOut(true);
    showToast("Convertido!");
  };

  const copyConvertedLink = () => {
    navigator.clipboard.writeText(dropOutLink).then(() => {
      setCopiedLink(true);
      showToast("Copiado!");
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Generate Report Helper
  const generateReport = async () => {
    if (!repStart || !repEnd) {
      alert("Selecione as datas!");
      return;
    }
    setReportLoading(true);
    setReportResults(null);

    try {
      const sDate = new Date(repStart + "T00:00:00").getTime();
      const eDate = new Date(repEnd + "T23:59:59").getTime();

      const q = query(
        collection(db, "logs"),
        where("userId", "==", user?.uid || ""),
        where("timestamp", ">=", sDate),
        where("timestamp", "<=", eDate)
      );

      const snap = await getDocs(q);
      const stats: Record<string, number> = {};

      snap.forEach(d => {
        const n = d.data().action || d.data().mediaName;
        if (n) {
          stats[n] = (stats[n] || 0) + 1;
        }
      });

      setReportResults(stats);
    } catch (err) {
      console.error(err);
      setReportResults({});
    } finally {
      setReportLoading(false);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-3 text-white">
        <div className="w-12 h-12 bg-blue-600 flex items-center justify-center rounded">
          <Tv className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span>Carregando FastPlayer...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.ip.includes(searchQuery)
  );

  const menuItems = [
    {
      id: 'play-ads',
      title: 'Reproduzir Propagandas',
      subtitle: 'Iniciar exibição de anúncios em tela cheia',
      icon: Play,
      isPrimary: true,
      onClick: () => handleOpenPlayer()
    },
    {
      id: 'content',
      title: 'Mídias e Anúncios',
      subtitle: 'Cadastrar vídeos, imagens, notícias RSS e clima',
      icon: Film,
      isPrimary: false,
      onClick: () => setActiveTab('content')
    },
    {
      id: 'playlists',
      title: 'Playlists',
      subtitle: 'Organizar ordem e tempo de exibição',
      icon: ListVideo,
      isPrimary: false,
      onClick: () => setActiveTab('playlists')
    },
    {
      id: 'players',
      title: 'Telas e Players',
      subtitle: 'Gerenciar telas e monitorar conexões',
      icon: Monitor,
      isPrimary: false,
      onClick: () => setActiveTab('players')
    },
    {
      id: 'schedules',
      title: 'Programação',
      subtitle: 'Agendar horários e dias das mídias',
      icon: Calendar,
      isPrimary: false,
      onClick: () => setActiveTab('schedules')
    },
    {
      id: 'analytics',
      title: 'Estatísticas',
      subtitle: 'Métricas de tráfego e relatórios',
      icon: BarChart3,
      isPrimary: false,
      onClick: () => setActiveTab('analytics')
    },
    {
      id: 'report',
      title: 'Relatórios de Exibição',
      subtitle: 'Consultar exibições por intervalo de datas',
      icon: FileText,
      isPrimary: false,
      onClick: () => setActiveTab('report')
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
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-600 text-white flex items-center justify-center rounded">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 block leading-none">
                FastPlayer
              </span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase block mt-0.5">
                Mídia Indoor
              </span>
            </div>
          </button>

          <div className="hidden sm:flex items-center relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mídias ou telas..."
              className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeployAll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Publicar</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-gray-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold">
                {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        
        {/* Navigation Breadcrumb bar if in sub-view */}
        {activeTab !== 'home' && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-gray-300">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded border border-gray-300 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Início (Menus)</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {[
                { id: 'content', label: 'Mídias' },
                { id: 'playlists', label: 'Playlists' },
                { id: 'players', label: 'Telas' },
                { id: 'schedules', label: 'Programação' },
                { id: 'analytics', label: 'Estatísticas' },
                { id: 'report', label: 'Relatórios' },
                { id: 'dashboard', label: 'Painel Geral' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* HOME SCREEN: Clean Flat Side-by-Side Menu Cards */}
        {activeTab === 'home' ? (
          <div className="space-y-6">
            {/* Header Title */}
            <div className="bg-white border border-gray-300 rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Painel Principal FastPlayer
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Usuário conectado: <strong>{user.email}</strong>
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenPlayer()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>▶ Iniciar TV</span>
                </button>
              </div>
            </div>

            {/* SIDE-BY-SIDE FLAT MENU CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                
                if (item.isPrimary) {
                  return (
                    <div
                      key={item.id}
                      onClick={item.onClick}
                      className="sm:col-span-2 lg:col-span-2 bg-blue-600 border border-blue-700 rounded p-6 text-white cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 bg-blue-800 text-white flex items-center justify-center rounded">
                            <Play className="w-5 h-5 fill-current" />
                          </div>
                          <span className="px-2.5 py-1 bg-blue-700 text-white text-[11px] font-bold rounded uppercase tracking-wider">
                            Modo Exibição
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {item.title}
                          </h3>
                          <p className="text-xs text-blue-100 mt-1">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-blue-500 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Clique para iniciar a transmissão
                        </span>
                        <div className="px-3 py-1.5 bg-white text-blue-700 font-bold text-xs rounded">
                          ▶ Iniciar Anúncios
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    onClick={item.onClick}
                    className="bg-white border border-gray-300 rounded p-5 cursor-pointer flex flex-col justify-between hover:border-blue-600"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 bg-gray-100 text-blue-600 flex items-center justify-center rounded">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-blue-600">
                      <span>Abrir</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DROPBOX LINK CONVERTER TOOL CARD */}
            <div className="bg-white p-6 rounded border border-gray-300 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Link className="w-4 h-4 text-indigo-600" />
                <span>Conversor de Links Dropbox</span>
              </h3>
              <p className="text-xs text-gray-500">
                Cole o link compartilhado do Dropbox com `dl=0` para converter em URL de reprodução direta `raw=1`.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text"
                  value={dropIn}
                  onChange={(e) => setDropIn(e.target.value)}
                  placeholder="Cole o link dl=0 aqui..."
                  className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
                <button 
                  onClick={convertDrop}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer"
                >
                  Converter
                </button>
              </div>

              {showDropOut && (
                <div className="bg-indigo-50 p-3 rounded border border-indigo-200 space-y-2">
                  <div className="text-xs font-mono font-bold text-indigo-800 break-all">
                    {dropOutLink}
                  </div>
                  <button 
                    onClick={copyConvertedLink}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded cursor-pointer flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar Link Direto'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* SUB-VIEW */
          <div className="bg-white border border-gray-300 rounded p-4 sm:p-6">
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
            {activeTab === 'report' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Relatórios de Exibição de Mídias</h2>
                <p className="text-xs text-gray-500">
                  Consulte os registros de reprodução acionados nos terminais por intervalo de datas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-gray-50 p-4 rounded border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">De:</label>
                    <input 
                      type="date"
                      value={repStart}
                      onChange={(e) => setRepStart(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Até:</label>
                    <input 
                      type="date"
                      value={repEnd}
                      onChange={(e) => setRepEnd(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs"
                    />
                  </div>
                  <button 
                    onClick={generateReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs h-[38px] cursor-pointer"
                  >
                    {reportLoading ? "Filtrando..." : "Filtrar Exibições"}
                  </button>
                </div>

                {reportResults && (
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <h3 className="font-bold text-sm text-gray-800">Resultados da Consulta:</h3>
                    {Object.keys(reportResults).length === 0 ? (
                      <p className="text-xs text-gray-500">Nenhum registro encontrado no período selecionado.</p>
                    ) : (
                      Object.entries(reportResults).map(([mName, count]) => (
                        <div key={mName} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                          <span className="font-semibold text-gray-800">{mName}</span>
                          <span className="font-bold text-blue-600">{count}x exibido</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded text-xs font-semibold shadow border border-gray-700">
          {toastMessage}
        </div>
      )}

      {/* Live Player Modal */}
      <LivePlayerModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        mediaItems={mediaItems}
        playerName={simulatorPlayer}
        initialIndex={currentPlayingIndex}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-white border border-gray-300 rounded p-6 relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Configurações do Sistema</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Ajuste as opções de servidor e modo de tela.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const urlVal = formData.get('backendUrl') as string;
              const tvBoxVal = formData.get('tvBoxMode') === 'on';
              handleSaveSettings(urlVal, tvBoxVal);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  URL do Servidor
                </label>
                <input 
                  type="text"
                  name="backendUrl"
                  defaultValue={backendUrl}
                  required
                  placeholder="https://exemplo-api.fly.dev"
                  className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="border-t border-gray-200 pt-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    name="tvBoxMode"
                    defaultChecked={isTvBoxMode}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-bold text-gray-900">
                      Modo Desempenho (TV Box / Smart TV)
                    </span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">
                      Desativa animações e reduz o consumo de memória em aparelhos TV Box.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
