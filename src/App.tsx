import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDocs, writeBatch, getDocFromServer } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, cleanUndefined } from './firebase';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import PlayersView from './components/PlayersView';
import ContentView from './components/ContentView';
import PlaylistsView from './components/PlaylistsView';
import SchedulesView from './components/SchedulesView';
import AnalyticsView from './components/AnalyticsView';
import LivePlayerModal from './components/LivePlayerModal';
import Auth from './components/Auth';
import { Loader2, Tv, Settings, X } from 'lucide-react';

import { MediaItem, Player, Playlist, LogEntry } from './types';
import { 
  INITIAL_MEDIA_ITEMS, 
  INITIAL_PLAYERS, 
  INITIAL_PLAYLISTS, 
  INITIAL_LOGS 
} from './mockData';

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<string>('content'); 
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

  // Simulator Modal states
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorPlayer, setSimulatorPlayer] = useState<string>('NYC-TIME-SQUARE-01');

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTvBoxMode, setIsTvBoxMode] = useState(() => {
    const saved = localStorage.getItem('tv_box_mode');
    if (saved !== null) return saved === 'true';
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isTv = ua.includes('smarttv') || ua.includes('tvbox') || ua.includes('tv-box') || 
                   ua.includes('appletv') || ua.includes('dtv') || ua.includes('boxee') || 
                   ua.includes('roku') || ua.includes('googletv') || ua.includes('mibox') || 
                   ua.includes('xiaomi') || ua.includes('firetv') || ua.includes('firestick') ||
                   ua.includes('android tv') || ua.includes('webos') || ua.includes('tizen');
      return isTv;
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const [backendUrl, setBackendUrl] = useState(() => {
    const fallbackBackend = 'https://ais-dev-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app';
    let saved = localStorage.getItem('backend_api_url') || fallbackBackend;
    if (saved.includes('ais-pre-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app')) {
      saved = fallbackBackend;
      localStorage.setItem('backend_api_url', fallbackBackend);
    }
    return saved;
  });

  const handleSaveSettings = (newUrl: string, enableTvBoxMode: boolean) => {
    let cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    localStorage.setItem('backend_api_url', cleanUrl);
    setBackendUrl(cleanUrl);
    
    localStorage.setItem('tv_box_mode', enableTvBoxMode ? 'true' : 'false');
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

        // Set a 3.5s timeout for TV Box/WebView stability
        const timeoutId = setTimeout(() => {
          if (didTimeOutOrResolve) return;
          didTimeOutOrResolve = true;
          console.warn("[App Load] Firebase firestore load timed out. Loading from localStorage or defaults...");
          
          try {
            const localMedia = localStorage.getItem('local_media_items');
            const localPlayers = localStorage.getItem('local_players');
            const localPlaylists = localStorage.getItem('local_playlists');
            const localLogs = localStorage.getItem('local_logs');

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
              // Seed default data into Firestore for the first-time user
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

              // Update cache
              localStorage.setItem('local_media_items', JSON.stringify(INITIAL_MEDIA_ITEMS));
              localStorage.setItem('local_players', JSON.stringify(INITIAL_PLAYERS));
              localStorage.setItem('local_playlists', JSON.stringify(INITIAL_PLAYLISTS));
              localStorage.setItem('local_logs', JSON.stringify(INITIAL_LOGS));
            } else {
              // Load existing data from Firestore
              const items: MediaItem[] = [];
              mediaSnap.forEach(doc => items.push(doc.data() as MediaItem));
              setMediaItems(items);
              localStorage.setItem('local_media_items', JSON.stringify(items));

              const playersSnap = await getDocs(collection(db, 'users', uid, 'players'));
              const loadedPlayers: Player[] = [];
              playersSnap.forEach(doc => loadedPlayers.push(doc.data() as Player));
              setPlayers(loadedPlayers);
              localStorage.setItem('local_players', JSON.stringify(loadedPlayers));

              const playlistsSnap = await getDocs(collection(db, 'users', uid, 'playlists'));
              const loadedPlaylists: Playlist[] = [];
              playlistsSnap.forEach(doc => loadedPlaylists.push(doc.data() as Playlist));
              setPlaylists(loadedPlaylists);
              localStorage.setItem('local_playlists', JSON.stringify(loadedPlaylists));

              const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
              const loadedLogs: LogEntry[] = [];
              logsSnap.forEach(doc => loadedLogs.push(doc.data() as LogEntry));
              setLogs(loadedLogs);
              localStorage.setItem('local_logs', JSON.stringify(loadedLogs));
            }
          }
        } catch (error) {
          if (!didTimeOutOrResolve) {
            clearTimeout(timeoutId);
            didTimeOutOrResolve = true;
            handleFirestoreError(error, OperationType.GET, `users/${uid}`);
          } else {
            console.error("Firestore loading error after timeout: ", error);
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

  // Sync state helpers that write updates dynamically to Firestore
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

  // Playlist slideshow cycle timing engine
  useEffect(() => {
    if (mediaItems.length === 0) return;
    const currentItem = mediaItems[currentPlayingIndex];
    const displayDuration = (currentItem && currentItem.duration > 0) 
      ? currentItem.duration * 1000 
      : 10000;

    const timer = setTimeout(() => {
      setCurrentPlayingIndex((prev) => (prev + 1) % mediaItems.length);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [currentPlayingIndex, mediaItems]);

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
    showToast("✓ Implantando todas as playlists ativas em 240 terminais...");
    
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      action: 'Deploy global acionado. Sincronização de 240 displays concluída.',
      time: 'Agora'
    };
    handleSetLogs([newLog, ...logs]);

    handleSetPlayers(players.map(p => {
      if (p.status === 'warning') {
        return { ...p, status: 'online', cpu: 30, lastSync: '1s ago' };
      }
      return p;
    }));
  };

  // Player action items reboots and force syncs
  const handlePlayerAction = (id: string, action: 'reboot' | 'sync') => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;

    if (action === 'reboot') {
      showToast(`Reiniciando controlador de display "${targetPlayer.name}"...`);
      handleSetPlayers(players.map(p => {
        if (p.id === id) {
          return { ...p, status: 'offline', cpu: 0, bandwidth: 0, lastSync: '1s ago' };
        }
        return p;
      }));

      setTimeout(() => {
        handleSetPlayers(prev => prev.map(p => {
          if (p.id === id) {
            return { ...p, status: 'online', cpu: 22, bandwidth: 10.5, lastSync: 'Just now' };
          }
          return p;
        }));
        showToast(`Display "${targetPlayer.name}" recuperado com sucesso.`);
      }, 4000);

    } else {
      showToast(`Forçando sincronização de cache em "${targetPlayer.name}"...`);
      handleSetPlayers(players.map(p => {
        if (p.id === id) {
          return { ...p, status: 'online', lastSync: 'Just now', cpu: 45 };
        }
        return p;
      }));
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

  const handleOpenSimulator = (player?: Player) => {
    setSimulatorPlayer(player ? player.name : 'NYC-TIME-SQUARE-01');
    setIsSimulatorOpen(true);
  };

  // Loading Screen for Auth and initial Firestore fetch
  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1c1242] to-[#0d0921] flex flex-col items-center justify-center gap-4 text-brand-on-surface">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-purple-500 flex items-center justify-center shadow-lg shadow-brand-primary/20">
          <Tv className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
          <span className="text-xs font-bold font-geist tracking-wide text-brand-outline uppercase">
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

  // Dashboard router
  const renderActiveView = () => {
    const filteredPlayers = players.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.ip.includes(searchQuery)
    );

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            players={players} 
            logs={logs} 
            mediaItems={mediaItems} 
            setActiveTab={setActiveTab}
            onDeployAll={handleDeployAll}
          />
        );
      case 'players':
        return (
          <PlayersView 
            players={filteredPlayers} 
            mediaItems={mediaItems}
            onPlayerAction={handlePlayerAction}
            onOpenSimulator={handleOpenSimulator}
          />
        );
      case 'content':
        return (
          <ContentView 
            mediaItems={mediaItems}
            setMediaItems={handleSetMediaItems}
            onAddMedia={handleAddMedia}
            currentPlayingIndex={currentPlayingIndex}
          />
        );
      case 'playlists':
        return (
          <PlaylistsView 
            playlists={playlists}
            mediaItems={mediaItems}
            onSelectPlaylist={handleSelectPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
          />
        );
      case 'schedules':
        return <SchedulesView playlists={playlists} />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return (
          <ContentView 
            mediaItems={mediaItems}
            setMediaItems={handleSetMediaItems}
            onAddMedia={handleAddMedia}
            currentPlayingIndex={currentPlayingIndex}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c1242] to-[#0d0921] text-brand-on-surface flex flex-col font-inter relative overflow-hidden">
      
      {/* Mesh Gradient Accents */}
      {!isTvBoxMode && (
        <>
          <div className="absolute top-[-10%] right-[-15%] w-[600px] h-[600px] rounded-full blur-[140px] bg-pink-500/15 pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] left-[5%] w-[550px] h-[550px] rounded-full blur-[130px] bg-blue-400/15 pointer-events-none z-0" />
          <div className="absolute top-[35%] left-[45%] w-[450px] h-[450px] rounded-full blur-[145px] bg-purple-600/10 pointer-events-none z-0" />
        </>
      )}
      
      {/* Sidebar Navigation */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onDeployClick={() => {
          setActiveTab('content');
          setTimeout(() => {
            document.getElementById('quick-upload-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onSupportClick={() => showToast('Abrindo chat de suporte com a engenharia...')}
        user={user}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Header Controller */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        onDeployAll={handleDeployAll}
        onOpenSimulator={() => handleOpenSimulator()}
        logsCount={logs.length}
        onMenuClick={() => setIsMobileSidebarOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Screen Content Frame */}
      <main className={`p-4 md:p-10 min-h-[calc(100vh-64px)] bg-transparent relative z-10 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-[112px]' : 'lg:ml-[312px]'
      } ml-0`}>
        {renderActiveView()}
      </main>

      {/* Toast Overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-surface-highest border border-brand-outline-variant/60 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md">
          <div className="w-2.5 h-2.5 bg-brand-secondary rounded-full status-pulse"></div>
          <span className="text-xs font-bold text-brand-on-surface font-geist tracking-wide">
            {toastMessage}
          </span>
        </div>
      )}

      {/* TV Screen Fullscreen playback Simulator Modal */}
      <LivePlayerModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        mediaItems={mediaItems}
        playerName={simulatorPlayer}
        initialIndex={currentPlayingIndex}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="w-full max-w-lg bg-[#140e30]/95 border border-white/10 rounded-[28px] p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2 font-geist flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>Configurações do Sistema</span>
            </h3>
            <p className="text-xs text-white/60 mb-6">
              Gerencie a integração do back-end para as funcionalidades dinâmicas em produção.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const urlVal = formData.get('backendUrl') as string;
              const tvBoxVal = formData.get('tvBoxMode') === 'on';
              handleSaveSettings(urlVal, tvBoxVal);
            }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-2 font-geist">
                  URL da API de Integração (Conversor RSS/Sites)
                </label>
                <input 
                  type="text"
                  name="backendUrl"
                  defaultValue={backendUrl}
                  required
                  placeholder="https://exemplo-api.fly.dev"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <p className="text-[10px] text-white/40 mt-1.5 leading-relaxed">
                  Necessário para buscar conteúdos de sites e convertê-los em slides (Web Scraping). Por padrão, utiliza o servidor do Google Cloud Run temporário.
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input 
                    type="checkbox"
                    name="tvBoxMode"
                    defaultChecked={isTvBoxMode}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-0 focus:ring-offset-0 mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Modo TV Box & Desempenho
                    </span>
                    <span className="block text-[10px] text-white/50 leading-relaxed mt-0.5">
                      Desativa filtros CSS pesados (blur de fundo) e acelera o carregamento geral. Recomendado para TV Boxes, tablets ou dispositivos com hardware mais limitado.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/80 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-xs font-bold text-white shadow-lg hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
