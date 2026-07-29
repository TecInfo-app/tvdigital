import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  updateDoc, 
  getDocs,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, cleanUndefined, getApiUrl } from './firebase';
import { safeLocalStorage } from './utils/safeStorage';
import { clientSideScrape } from './utils/scraper';

import DashboardView from './components/DashboardView';
import PlayersView from './components/PlayersView';
import ContentView from './components/ContentView';
import PlaylistsView from './components/PlaylistsView';
import SchedulesView from './components/SchedulesView';
import AnalyticsView from './components/AnalyticsView';
import LivePlayerModal from './components/LivePlayerModal';
import WidgetRenderer from './components/WidgetRenderer';
import Auth from './components/Auth';

import { MediaItem, Player, Playlist, LogEntry } from './types';
import { 
  INITIAL_MEDIA_ITEMS, 
  INITIAL_PLAYERS, 
  INITIAL_PLAYLISTS, 
  INITIAL_LOGS 
} from './mockData';

// Helper to compress local image files before uploading so they stay well under Firestore's 1MB limit
const compressImageFile = (file: File, maxWidth = 1280, maxHeight = 720, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function App() {
  // Navigation screen mode: 'menu' | 'config' | 'report' | 'players' | 'playlists' | 'schedules' | 'analytics' | 'dashboard' | 'player'
  const [screen, setScreen] = useState<string>('menu');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Core system states
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Playlist state synced directly with Firestore "playlist" collection (like the HTML code)
  const [firestorePlaylist, setFirestorePlaylist] = useState<MediaItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Global toast alerts
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states (Nova / Editando Mídia)
  const [propName, setPropName] = useState('');
  const [propDuration, setPropDuration] = useState<number | ''>('');
  const [inputType, setInputType] = useState<string>('video_url');
  const [propUrl, setPropUrl] = useState('');
  const [fileData, setFileData] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // RSS Modal & Preview states
  const [isRssModalOpen, setIsRssModalOpen] = useState(false);
  const [rssUrlInput, setRssUrlInput] = useState('https://g1.globo.com/rss/g1/');
  const [rssPresetName, setRssPresetName] = useState('G1 - Notícias Globais');
  const [rssLoading, setRssLoading] = useState(false);
  const [rssPreviewItems, setRssPreviewItems] = useState<Array<{ title: string; description: string; thumbnail?: string; pubDate?: string; selected?: boolean; duration?: number | '' }>>([
    {
      title: 'Mercado Financeiro: Bolsa opera em alta impulsionada por inovação',
      description: 'Fluxo forte de investimento e otimismo no setor tecnológico impulsionam o mercado local.',
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200',
      pubDate: 'Hoje, 11:30'
    },
    {
      title: 'Inovação em Transmissão Digital e Mídia indoor',
      description: 'Novas diretrizes promovem eficiência e alta definição na exibição de conteúdo corporativo.',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
      pubDate: 'Hoje, 09:15'
    }
  ]);
  const [rssPreviewIdx, setRssPreviewIdx] = useState(0);
  const [rssConfiguredItems, setRssConfiguredItems] = useState<any[]>([]);

  const fetchRssFeed = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setRssLoading(true);
    const formattedUrl = targetUrl.trim();
    const apiUrl = getApiUrl(`/api/scrape-rss?url=${encodeURIComponent(formattedUrl)}`);
    
    const applyConfig = (items: any[]) => {
      // If user typed a duration <= 120, assume they meant it as per-item duration. Otherwise fallback to 15.
      const defaultDuration = (propDuration && Number(propDuration) > 0 && Number(propDuration) <= 120) ? Number(propDuration) : 15;
      
      if (rssConfiguredItems && rssConfiguredItems.length > 0) {
        return items.map(item => {
          const configItem = rssConfiguredItems.find(c => c.title === item.title);
          if (configItem) {
            return { ...item, selected: configItem.selected, duration: configItem.duration || defaultDuration, title: configItem.title, description: configItem.description };
          }
          return { ...item, selected: true, duration: defaultDuration };
        });
      }
      return items.map((i: any) => ({ ...i, selected: true, duration: defaultDuration }));
    };

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        setRssPreviewItems(applyConfig(data.items));
        setRssPreviewIdx(0);
        showToast(`${data.items.length} notícias obtidas do RSS!`);
      } else {
        throw new Error("Formato inválido do backend");
      }
    } catch (err) {
      try {
        const scraped = await clientSideScrape(formattedUrl);
        if (scraped.status === 'ok' && scraped.items && scraped.items.length > 0) {
          setRssPreviewItems(applyConfig(scraped.items));
          setRssPreviewIdx(0);
          showToast(`${scraped.items.length} notícias obtidas com sucesso!`);
        }
      } catch (scrapeErr) {
        console.warn("[RSS Fetch Notice]", scrapeErr);
        if (rssConfiguredItems && rssConfiguredItems.length > 0) {
          setRssPreviewItems(rssConfiguredItems);
        }
        showToast("Exibindo pré-visualização de Notícias RSS.");
      }
    } finally {
      setRssLoading(false);
    }
  };

  // Dropbox Converter states
  const [dropIn, setDropIn] = useState('');
  const [dropOutLink, setDropOutLink] = useState('');
  const [showDropOut, setShowDropOut] = useState(false);

  // Report states
  const [repStart, setRepStart] = useState('');
  const [repEnd, setRepEnd] = useState('');
  const [reportResults, setReportResults] = useState<Record<string, number> | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Player playback states
  const [playIdx, setPlayIdx] = useState(0);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const playerTimerRef = useRef<any>(null);

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
      return isKnownTv;
    }
    return false;
  });

  const [backendUrl, setBackendUrl] = useState(() => {
    const fallbackBackend = 'https://ais-dev-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app';
    let saved = safeLocalStorage.getItem('backend_api_url') || fallbackBackend;
    if (saved.includes('ais-pre-53xuhhwynlrdgmdswoabct-358759362238.us-west1.run.app')) {
      saved = fallbackBackend;
      safeLocalStorage.setItem('backend_api_url', fallbackBackend);
    }
    return saved;
  });

  const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firebase connection check.");
        }
      }
    }
    testConnection();
  }, []);

  // Firebase auth & data synchronization
  useEffect(() => {
    let unsubSnap: (() => void) | null = null;

    // Safety timeout: ensure authLoading is never stuck true for more than 2 seconds
    const authTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(authTimeout);
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setLoadingData(true);
        setSyncStatus('syncing');
        const uid = currentUser.uid;

        if (unsubSnap) {
          unsubSnap();
          unsubSnap = null;
        }

        // Monitor Firestore "playlist" collection directly (HTML structure compatibility)
        const qPlaylist = query(collection(db, "playlist"), where("userId", "==", uid));
        unsubSnap = onSnapshot(qPlaylist, (snap) => {
          const items: MediaItem[] = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as MediaItem))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setFirestorePlaylist(items);
          setSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString());
        }, (err) => {
          console.warn("Playlist monitor notice:", err);
          setSyncStatus('error');
        });

        // Initialize user data collections with fallback
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
          setSyncStatus('error');
        }, 2500);

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
            } else {
              const items: MediaItem[] = [];
              mediaSnap.forEach(doc => items.push({ id: doc.id, ...doc.data() } as MediaItem));
              
              // Deduplicate items based on id to prevent React key errors
              const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
              setMediaItems(uniqueItems);

              const playersSnap = await getDocs(collection(db, 'users', uid, 'players'));
              const loadedPlayers: Player[] = [];
              playersSnap.forEach(doc => loadedPlayers.push({ id: doc.id, ...doc.data() } as Player));
              setPlayers(loadedPlayers);

              const playlistsSnap = await getDocs(collection(db, 'users', uid, 'playlists'));
              const loadedPlaylists: Playlist[] = [];
              playlistsSnap.forEach(doc => loadedPlaylists.push({ id: doc.id, ...doc.data() } as Playlist));
              setPlaylists(loadedPlaylists);

              const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
              const loadedLogs: LogEntry[] = [];
              logsSnap.forEach(doc => loadedLogs.push({ id: doc.id, ...doc.data() } as LogEntry));
              setLogs(loadedLogs);
            }
            setSyncStatus('success');
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        } catch (error) {
          if (!didTimeOutOrResolve) {
            clearTimeout(timeoutId);
            didTimeOutOrResolve = true;
          }
          setSyncStatus('error');
        } finally {
          setLoadingData(false);
        }
      } else {
        if (unsubSnap) {
          unsubSnap();
          unsubSnap = null;
        }
        setMediaItems([]);
        setPlayers([]);
        setPlaylists([]);
        setLogs([]);
        setFirestorePlaylist([]);
        setLoadingData(false);
      }
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
      if (unsubSnap) unsubSnap();
    };
  }, []);

  // Handlers for App states
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
        batch.delete(doc(db, 'users', uid, 'media_items', item.id));
      });
      nextItems.forEach((item) => {
        batch.set(doc(db, 'users', uid, 'media_items', item.id), cleanUndefined({ ...item, userId: uid }));
      });
      await batch.commit();
    } catch (error) {
      console.warn("Syncing media items notice:", error);
    }
  };

  const handleSetPlayers = async (update: Player[] | ((prev: Player[]) => Player[])) => {
    const nextPlayers = typeof update === 'function' ? update(players) : update;
    setPlayers(nextPlayers);
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      nextPlayers.forEach((p) => {
        batch.set(doc(db, 'users', uid, 'players', p.id), cleanUndefined({ ...p, userId: uid }));
      });
      await batch.commit();
    } catch (error) {
      console.warn("Syncing players notice:", error);
    }
  };

  const handleSetPlaylists = async (update: Playlist[] | ((prev: Playlist[]) => Playlist[])) => {
    const nextPlaylists = typeof update === 'function' ? update(playlists) : update;
    setPlaylists(nextPlaylists);
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      const batch = writeBatch(db);
      nextPlaylists.forEach((pl) => {
        batch.set(doc(db, 'users', uid, 'playlists', pl.id), cleanUndefined({ ...pl, userId: uid }));
      });
      await batch.commit();
    } catch (error) {
      console.warn("Syncing playlists notice:", error);
    }
  };

  // Dropbox Converter
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
    navigator.clipboard.writeText(dropOutLink).then(() => showToast("Copiado!"));
  };

  // Toggle Day option
  const toggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter(d => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  // Save Media in Firestore 'playlist'
  const handleSaveMedia = async () => {
    if (!propName.trim()) {
      alert("Por favor, insira o nome da mídia.");
      return;
    }

    let content = propUrl.trim();
    if (inputType.startsWith('upload')) {
      if (!fileData && !editingId) {
        alert("Selecione um arquivo para upload");
        return;
      }
      if (fileData) {
        content = fileData;
      }
    }

    if (!content && inputType !== 'rss') {
      alert("Insira a URL ou arquivo de mídia.");
      return;
    }

    const dur = propDuration !== '' && propDuration !== null && !isNaN(Number(propDuration)) ? Number(propDuration) : 10;
    const currentUid = user?.uid || auth.currentUser?.uid || 'local-user';

    const rawData = {
      name: propName.trim(),
      content: content || '',
      type: inputType,
      duration: dur,
      start: startDate || '',
      end: endDate || '',
      days: selectedDays || [0, 1, 2, 3, 4, 5, 6],
      userId: currentUid,
      updatedAt: new Date().toISOString(),
      ...(inputType === 'rss' && rssConfiguredItems.length > 0 ? { items: rssConfiguredItems } : {})
    };

    let newDocId = editingId;

    // Check size limit (Firestore limits documents to ~1MB)
    // Base64 string length * 0.75 gives approximate byte size. We cap at 900KB to be safe.
    if (content && content.length * 0.75 > 900000) {
      alert("Erro: O arquivo ou imagem selecionada é muito grande para salvar diretamente. Por favor, utilize a opção de 'URL (Dropbox)' para arquivos pesados (especialmente vídeos).");
      return;
    }

    // Save to Firestore 'playlist' collection with fallback
    try {
      setSyncStatus('syncing');
      if (editingId) {
        await updateDoc(doc(db, "playlist", editingId), cleanUndefined(rawData));
      } else {
        const nextOrder = firestorePlaylist.length > 0 ? Math.max(...firestorePlaylist.map(i => i.order || 0)) + 1 : 1;
        const docRef = await addDoc(collection(db, "playlist"), cleanUndefined({
          ...rawData,
          order: nextOrder
        }));
        newDocId = docRef.id;
      }
      setSyncStatus('success');
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (firestoreErr) {
      console.warn("[Media Save] Firestore sync notice (saving to local state):", firestoreErr);
      setSyncStatus('error');
      if (!newDocId) {
        newDocId = `media-${Date.now()}`;
      }
    }

    const newMediaItem: MediaItem = {
      id: newDocId || `media-${Date.now()}`,
      name: propName.trim(),
      url: content || '',
      content: content || '',
      duration: dur,
      type: inputType as any,
      schedule: 'Always On',
      active: true,
      start: startDate || '',
      end: endDate || '',
      days: selectedDays || [0, 1, 2, 3, 4, 5, 6],
      order: firestorePlaylist.length + 1,
      ...(inputType === 'rss' && rssConfiguredItems.length > 0 ? { items: rssConfiguredItems } : {})
    };
    
    // Immediate UI update
    if (!editingId) {
      setFirestorePlaylist(prev => [...prev.filter(i => i.id !== newMediaItem.id), newMediaItem]);
      handleSetMediaItems([...mediaItems.filter(i => i.id !== newMediaItem.id), newMediaItem]);
      showToast("Mídia salva com sucesso!");
    } else {
      setFirestorePlaylist(prev => prev.map(m => m.id === editingId ? { ...m, ...newMediaItem } : m));
      handleSetMediaItems(mediaItems.map(m => m.id === editingId ? { ...m, ...newMediaItem } : m));
      showToast("Alterações salvas com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setPropName("");
    setPropDuration("");
    setPropUrl("");
    setFileData("");
    setInputType("upload_img");
    setStartDate("");
    setEndDate("");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setRssConfiguredItems([]);
  };

  const editItem = (item: MediaItem) => {
    setEditingId(item.id);
    setPropName(item.name);
    setPropDuration(item.duration !== undefined && item.duration !== null ? item.duration : "");
    
    let mappedType = item.type || 'upload_img';
    if (mappedType === 'image') mappedType = 'img_url';
    if (mappedType === 'video') mappedType = 'video_url';
    
    const contentStr = item.content || item.url || '';
    if (contentStr.startsWith('data:image/')) mappedType = 'upload_img';
    else if (contentStr.startsWith('data:video/')) mappedType = 'upload_video';
    else if (contentStr.includes('rss') || contentStr.includes('xml')) mappedType = 'rss';

    setInputType(mappedType);
    setPropUrl(item.content || item.url || "");
    setFileData(contentStr.startsWith('data:') ? contentStr : "");
    setStartDate(item.start || "");
    setEndDate(item.end || "");
    setSelectedDays(item.days || [0, 1, 2, 3, 4, 5, 6]);
    if (mappedType === 'rss' && item.items) {
      setRssConfiguredItems(item.items);
    } else {
      setRssConfiguredItems([]);
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm("Deseja excluir esta mídia?")) {
      // Immediate local state update for zero latency
      setFirestorePlaylist(prev => prev.filter(m => m.id !== id));
      setMediaItems(prev => prev.filter(m => m.id !== id));

      if (editingId === id) {
        resetForm();
      }

      showToast("Mídia excluída!");

      // Async Firestore cleanup
      try {
        setSyncStatus('syncing');
        await deleteDoc(doc(db, "playlist", id));
        if (user?.uid) {
          await deleteDoc(doc(db, "users", user.uid, "media_items", id));
        }
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn("[Delete notice]:", err);
        setSyncStatus('error');
      }
    }
  };

  const reorder = async (idx: number, dir: number) => {
    const list = firestorePlaylist.length > 0 ? [...firestorePlaylist] : [...mediaItems];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;

    // Swap items in local array
    const temp = list[idx];
    list[idx] = list[target];
    list[target] = temp;

    // Re-index order property sequentially to ensure unique order values
    const reorderedList = list.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    // Update local React states immediately for instant UI re-ordering
    setFirestorePlaylist(reorderedList);
    setMediaItems(reorderedList);

    // Sync order changes to Firestore asynchronously
    try {
      const updates = reorderedList.map(async (item) => {
        if (item.id && !item.id.startsWith('media-')) {
          try {
            await updateDoc(doc(db, "playlist", item.id), { order: item.order });
          } catch (e) {
            // ignore
          }
        }
      });
      await Promise.all(updates);
    } catch (err) {
      console.warn("[Reorder sync notice]:", err);
    }
  };

  // Generate Report
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
        const n = d.data().mediaName || d.data().action;
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

  // Player Loop Logic (like the HTML code)
  const activePlaylist = firestorePlaylist.length > 0 ? firestorePlaylist : mediaItems;

  const startPlayer = () => {
    if (!activePlaylist.length) {
      alert("Playlist Vazia!");
      return;
    }
    setScreen('player');
    setPlayIdx(0);
  };

  useEffect(() => {
    if (screen !== 'player' || activePlaylist.length === 0) {
      if (playerTimerRef.current) clearTimeout(playerTimerRef.current);
      return;
    }

    let isMounted = true;

    const loop = (currentIndex: number) => {
      if (!isMounted) return;
      if (playerTimerRef.current) clearTimeout(playerTimerRef.current);

      let targetIdx = currentIndex;
      if (targetIdx >= activePlaylist.length) {
        targetIdx = 0;
      }

      const item = activePlaylist[targetIdx];
      const agora = new Date();

      const foraHorario = (item.start && agora < new Date(item.start)) || (item.end && agora > new Date(item.end));
      const diaErrado = item.days && item.days.length > 0 && !item.days.includes(agora.getDay());

      if (foraHorario || diaErrado) {
        loop(targetIdx + 1);
        return;
      }

      try {
        addDoc(collection(db, "logs"), {
          mediaName: item.name,
          timestamp: Date.now(),
          userId: user?.uid || ''
        });
      } catch (err) {
        console.warn("Log write notice", err);
      }

      setCurrentMedia(item);
      setPlayIdx(targetIdx);

      const isVideo = item.type?.includes('video');
      const isWidget = item.type === 'widget';
      const durationMs = (item.duration || (isWidget ? 40 : 10)) * 1000;

      if (!isVideo) {
        playerTimerRef.current = setTimeout(() => {
          if (isMounted) loop(targetIdx + 1);
        }, durationMs);
      }
    };

    loop(playIdx);

    return () => {
      isMounted = false;
      if (playerTimerRef.current) clearTimeout(playerTimerRef.current);
    };
  }, [screen, activePlaylist, playIdx]);

  const handleVideoEnded = () => {
    if (screen === 'player') {
      setPlayIdx(prev => prev + 1);
    }
  };

  const handleLogout = async () => {
    if (confirm("Sair?")) {
      await signOut(auth);
    }
  };

  const handleSaveSettings = (newUrl: string, enableTvBoxMode: boolean) => {
    let cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    safeLocalStorage.setItem('backend_api_url', cleanUrl);
    setBackendUrl(cleanUrl);
    
    safeLocalStorage.setItem('tv_box_mode', enableTvBoxMode ? 'true' : 'false');
    setIsTvBoxMode(enableTvBoxMode);
    
    showToast('Configurações salvas!');
    setIsSettingsOpen(false);
  };

  if (authLoading || loadingData) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '14px', color: '#cbd5e1' }}>Carregando FastPlayer...</p>
        <button
          onClick={() => {
            setAuthLoading(false);
            setLoadingData(false);
          }}
          style={{
            marginTop: '20px',
            background: 'transparent',
            border: '1px solid #475569',
            color: '#94a3b8',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Acessar Painel Direto
        </button>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f1f5f9', color: '#1e293b', minHeight: '100vh' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 10000,
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* SCREEN: MENU PRINCIPAL (Exact structure from HTML) */}
      {screen === 'menu' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          
          {/* Main Dark Card (#0f172a) */}
          <div style={{ background: '#0f172a', color: 'white', padding: '25px', borderRadius: '16px', textAlign: 'center', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h1 style={{ marginBottom: '5px', fontSize: '28px', fontWeight: 800 }}>Painel Cloud ⚡</h1>
            <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>{user.email}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={() => setScreen('config')}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#2563eb', color: 'white', fontSize: '14px' }}
              >
                ⚙️ Playlist & Mídias
              </button>

              <button 
                onClick={startPlayer}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#10b981', color: 'white', fontSize: '14px' }}
              >
                ▶️ Iniciar TV
              </button>

              <button 
                onClick={() => setScreen('report')}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#6366f1', color: 'white', fontSize: '14px' }}
              >
                📊 Relatórios
              </button>

              <button 
                onClick={() => setScreen('players')}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#0284c7', color: 'white', fontSize: '14px' }}
              >
                🖥️ Telas & Players
              </button>

              <button 
                onClick={() => setScreen('playlists')}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#8b5cf6', color: 'white', fontSize: '14px' }}
              >
                📋 Listas Salvas
              </button>

              <button 
                onClick={() => setScreen('schedules')}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#f59e0b', color: 'white', fontSize: '14px' }}
              >
                📅 Programação
              </button>

              <button 
                onClick={() => setScreen('analytics')}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#06b6d4', color: 'white', fontSize: '14px' }}
              >
                📈 Estatísticas
              </button>

              <button 
                onClick={() => setScreen('dashboard')}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#475569', color: 'white', fontSize: '14px' }}
              >
                🎛️ Painel Geral
              </button>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#334155', color: 'white', fontSize: '14px' }}
              >
                ⚙️ Configurações
              </button>

              <button 
                onClick={handleLogout}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#ef4444', color: 'white', fontSize: '14px' }}
              >
                🚪 Sair
              </button>
            </div>
          </div>

          {/* Dashed Border Dropbox Card (Exact HTML styling) */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '2px dashed #6366f1', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700 }}>🔗 Conversor Dropbox</h3>
            <input 
              type="text" 
              value={dropIn}
              onChange={(e) => setDropIn(e.target.value)}
              placeholder="Cole o link dl=0 aqui..."
              style={{ width: '100%', padding: '12px', margin: '8px 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
            />
            <button 
              onClick={convertDrop}
              style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#6366f1', color: 'white' }}
            >
              Converter
            </button>

            {showDropOut && (
              <div style={{ marginTop: '10px', background: '#f0f4ff', padding: '15px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', wordBreak: 'break-all', fontWeight: 'bold', marginBottom: '10px', color: '#6366f1' }}>
                  {dropOutLink}
                </div>
                <button 
                  onClick={copyConvertedLink}
                  style={{ padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, background: '#334155', color: 'white', fontSize: '12px', width: 'auto' }}
                >
                  📋 Copiar Link
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SCREEN: CONFIG / PLAYLIST & MÍDIAS (Exact HTML Form and List layout) */}
      {screen === 'config' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <button 
            onClick={() => setScreen('menu')} 
            style={{ background: '#ddd', width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginBottom: '15px' }}
          >
            ⬅ Menu Principal
          </button>

          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '20px', fontWeight: 700 }}>
              {editingId ? "Editando Mídia" : "Nova Mídia"}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>NOME DA MÍDIA</label>
                <input 
                  type="text" 
                  value={propName}
                  onChange={(e) => setPropName(e.target.value)}
                  placeholder="Nome da Mídia"
                  style={{ width: '100%', padding: '12px', margin: '0 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>TEMPO (SEG)</label>
                <input 
                  type="number" 
                  value={propDuration}
                  onChange={(e) => setPropDuration(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Tempo (seg)"
                  style={{ width: '100%', padding: '12px', margin: '0 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', display: 'block', marginBottom: '6px' }}>
              Dias de Exibição:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
              {nomesDias.map((dName, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedDays.includes(idx)}
                    onChange={() => toggleDay(idx)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>{dName}</span>
                </label>
              ))}
            </div>

            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>TIPO DE MÍDIA</label>
            <select 
              value={inputType}
              onChange={(e) => {
                const val = e.target.value;
                setInputType(val);
                if (val === 'rss' && !propUrl) {
                  setPropUrl('https://g1.globo.com/rss/g1/');
                }
              }}
              style={{ width: '100%', padding: '12px', margin: '0 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box', background: 'white' }}
            >
              <option value="rss">🗞️ Feed RSS / Notícias</option>
              <option value="video_url">📹 URL de Vídeo (Dropbox)</option>
              <option value="img_url">🖼️ URL de Imagem (Dropbox)</option>
              <option value="widget">🌐 Widget / Site / Clima</option>
              <option value="upload_video">📁 Upload Local VÍDEO</option>
              <option value="upload_img">📁 Upload Local IMAGEM</option>
            </select>

            {inputType.startsWith('upload') ? (
              <div style={{ marginBottom: '15px' }}>
                <input 
                  type="file" 
                  accept={inputType.includes('video') ? 'video/*' : 'image/*'}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (file.type.startsWith('image/') || inputType.includes('img')) {
                        const compressed = await compressImageFile(file);
                        setFileData(compressed);
                      } else {
                        const reader = new FileReader();
                        reader.onload = () => setFileData(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px' }}
                />
              </div>
            ) : inputType === 'rss' ? (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', display: 'block', marginBottom: '4px' }}>
                  URL DO FEED RSS (XML OU NOTÍCIAS)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="url" 
                    value={propUrl}
                    onChange={(e) => setPropUrl(e.target.value)}
                    placeholder="https://g1.globo.com/rss/g1/"
                    style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const target = propUrl || 'https://g1.globo.com/rss/g1/';
                      setRssUrlInput(target);
                      fetchRssFeed(target);
                      setIsRssModalOpen(true);
                    }}
                    style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '0 16px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ⚡ Abrir Menu / Editar RSS
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input 
                  type="url" 
                  value={propUrl}
                  onChange={(e) => setPropUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '12px', margin: '0 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <small style={{ fontWeight: 'bold', color: '#64748b' }}>Data Início:</small>
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', margin: '4px 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <small style={{ fontWeight: 'bold', color: '#64748b' }}>Data Fim:</small>
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', margin: '4px 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button 
              onClick={handleSaveMedia}
              style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#10b981', color: 'white', marginBottom: editingId ? '10px' : '0' }}
            >
              Salvar Mídia
            </button>

            {editingId && (
              <button 
                onClick={resetForm}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#ef4444', color: 'white' }}
              >
                Cancelar Edição
              </button>
            )}
          </div>

          {/* Media List rendered as .media-item cards */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
              Fila de Exibição ({activePlaylist.length})
            </h3>

            {activePlaylist.length === 0 ? (
              <div style={{ background: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                Nenhuma mídia na playlist. Preencha os campos acima para cadastrar.
              </div>
            ) : (
              activePlaylist.map((item, index) => {
                let desc = (item.days && item.days.length < 7) 
                  ? "📅 " + item.days.map(d => nomesDias[d]).join(", ") 
                  : "📅 Todos os dias";

                if (item.start || item.end) desc += ` | 🕒 Agendado`;
                if (item.duration) desc += ` | ⏱️ ${item.duration}s`;

                return (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', alignItems: 'center', padding: '12px', background: 'white', marginBottom: '8px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button 
                        onClick={() => reorder(index, -1)}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => reorder(index, 1)}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ▼
                      </button>
                    </div>

                    <div style={{ paddingLeft: '10px', overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        {desc}
                      </div>
                    </div>

                    <div>
                      <button 
                        onClick={() => editItem(item)}
                        style={{ color: '#f59e0b', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px', fontSize: '18px', fontWeight: 'bold' }}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SCREEN: RELATÓRIOS (Exact HTML structure) */}
      {screen === 'report' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <button 
            onClick={() => setScreen('menu')}
            style={{ background: '#ddd', width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginBottom: '15px' }}
          >
            ⬅ Voltar
          </button>

          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '20px', fontWeight: 700 }}>Relatório de Exibição</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <small style={{ fontWeight: 'bold', color: '#64748b' }}>De:</small>
                <input 
                  type="date" 
                  value={repStart}
                  onChange={(e) => setRepStart(e.target.value)}
                  style={{ width: '100%', padding: '12px', margin: '4px 0 0 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <small style={{ fontWeight: 'bold', color: '#64748b' }}>Até:</small>
                <input 
                  type="date" 
                  value={repEnd}
                  onChange={(e) => setRepEnd(e.target.value)}
                  style={{ width: '100%', padding: '12px', margin: '4px 0 0 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
              <button 
                onClick={generateReport}
                style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, background: '#2563eb', color: 'white', height: '45px', margin: 0 }}
              >
                {reportLoading ? "Filtrando..." : "Filtrar"}
              </button>
            </div>

            {reportResults && (
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 10px 0' }}>Resultados:</h3>
                {Object.keys(reportResults).length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Nenhum registro encontrado para este período.</p>
                ) : (
                  Object.entries(reportResults).map(([n, count]) => (
                    <p key={n} style={{ fontSize: '13px', margin: '6px 0', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <strong>{n}:</strong> {count}x exibição
                    </p>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW: TELAS E PLAYERS */}
      {screen === 'players' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <button onClick={() => setScreen('menu')} style={{ background: '#ddd', width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginBottom: '15px' }}>
            ⬅ Menu Principal
          </button>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <PlayersView 
              players={players} 
              mediaItems={mediaItems}
              onPlayerAction={(id, action) => showToast(`Ação ${action} executada.`)}
              onOpenSimulator={() => startPlayer()}
            />
          </div>
        </div>
      )}

      {/* SUB-VIEW: LISTAS SALVAS (PLAYLISTS) */}
      {screen === 'playlists' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <button onClick={() => setScreen('menu')} style={{ background: '#ddd', width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginBottom: '15px' }}>
            ⬅ Menu Principal
          </button>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <PlaylistsView 
              playlists={playlists}
              mediaItems={mediaItems}
              onSelectPlaylist={(id) => showToast(`Playlist selecionada: ${id}`)}
              onCreatePlaylist={(name) => handleSetPlaylists([...playlists, { id: `pl-${Date.now()}`, name, itemIds: [], isActive: false }])}
            />
          </div>
        </div>
      )}

      {/* SUB-VIEW: PROGRAMAÇÃO */}
      {screen === 'schedules' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <button onClick={() => setScreen('menu')} style={{ background: '#ddd', width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginBottom: '15px' }}>
            ⬅ Menu Principal
          </button>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <SchedulesView playlists={playlists} />
          </div>
        </div>
      )}

      {/* SUB-VIEW: ESTATÍSTICAS */}
      {screen === 'analytics' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <button onClick={() => setScreen('menu')} style={{ background: '#ddd', width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginBottom: '15px' }}>
            ⬅ Menu Principal
          </button>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <AnalyticsView />
          </div>
        </div>
      )}

      {/* SUB-VIEW: PAINEL GERAL */}
      {screen === 'dashboard' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <button onClick={() => setScreen('menu')} style={{ background: '#ddd', width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, marginBottom: '15px' }}>
            ⬅ Menu Principal
          </button>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <DashboardView 
              players={players} 
              logs={logs} 
              mediaItems={mediaItems} 
              setActiveTab={(tab) => setScreen(tab)}
              onDeployAll={() => {
                setSyncStatus('syncing');
                setTimeout(() => {
                  setSyncStatus('success');
                  setLastSyncTime(new Date().toLocaleTimeString());
                  showToast("Publicação global concluída.");
                }, 1500);
              }}
              syncStatus={syncStatus}
              lastSyncTime={lastSyncTime}
              onDeleteMedia={deleteItem}
            />
          </div>
        </div>
      )}

      {/* FULLSCREEN PLAYER (#player from HTML code) */}
      {screen === 'player' && (
        <div id="player" style={{ background: '#000', position: 'fixed', top: 0, left: 0, zIndex: 9999, height: '100vh', width: '100vw' }}>
          <div id="displayArea" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {currentMedia ? (() => {
              const contentStr = currentMedia.content || currentMedia.url || '';
              const isVideo = currentMedia.type?.includes('video') || contentStr.startsWith('data:video/') || /\.(mp4|webm|mkv|mov)(\?.*)?$/i.test(contentStr);
              const isImage = currentMedia.type?.includes('img') || currentMedia.type === 'image' || contentStr.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg|bmp)(\?.*)?$/i.test(contentStr);

              if (isVideo) {
                return (
                  <video 
                    key={currentMedia.id + '-' + playIdx}
                    src={contentStr}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnded}
                    onError={handleVideoEnded}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', border: 'none', background: '#000' }}
                  />
                );
              }
              if (isImage) {
                return (
                  <img 
                    key={currentMedia.id + '-' + playIdx}
                    src={contentStr}
                    alt={currentMedia.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', border: 'none', background: '#000' }}
                  />
                );
              }
              return (
                <WidgetRenderer 
                  key={currentMedia.id + '-' + playIdx}
                  url={contentStr} 
                  name={currentMedia.name} 
                  items={currentMedia.items}
                  defaultDuration={currentMedia.duration}
                />
              );
            })() : (
              <div style={{ color: 'white', fontWeight: 'bold' }}>Aguardando mídia...</div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: 700 }}>⚙️ Configurações do Sistema</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const urlVal = formData.get('backendUrl') as string;
              const tvBoxVal = formData.get('tvBoxMode') === 'on';
              handleSaveSettings(urlVal, tvBoxVal);
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>URL DO SERVIDOR</label>
                <input 
                  type="text"
                  name="backendUrl"
                  defaultValue={backendUrl}
                  required
                  placeholder="https://exemplo-api.fly.dev"
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <label style={{ display: 'flex', itemsCenter: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  <input 
                    type="checkbox"
                    name="tvBoxMode"
                    defaultChecked={isTvBoxMode}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>Modo Desempenho (TV Box / Smart TV)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  style={{ padding: '10px 18px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '10px 18px', border: 'none', borderRadius: '8px', background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RSS Config & Preview Modal */}
      {isRssModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🗞️</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Configuração & Pré-visualização de Feed RSS</h3>
              </div>
              <button 
                onClick={() => setIsRssModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Presets Bar */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' }}>FEEDS POPULARES PRÉ-CONFIGURADOS:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { name: 'G1 Brasil', url: 'https://g1.globo.com/rss/g1/' },
                  { name: 'Globo Esporte', url: 'https://ge.globo.com/rss/ge/' },
                  { name: 'Economia & Mercado', url: 'https://valor.globo.com/rss/valor/' },
                  { name: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' }
                ].map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      setRssUrlInput(preset.url);
                      setRssPresetName(preset.name);
                      fetchRssFeed(preset.url);
                    }}
                    style={{
                      background: rssUrlInput === preset.url ? '#2563eb' : '#f8fafc',
                      color: rssUrlInput === preset.url ? 'white' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed URL input */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>URL DO FEED RSS OU SITE DE NOTÍCIAS:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="url"
                  value={rssUrlInput}
                  onChange={(e) => setRssUrlInput(e.target.value)}
                  placeholder="https://g1.globo.com/rss/g1/"
                  style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => fetchRssFeed(rssUrlInput)}
                  style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '0 16px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  {rssLoading ? "Buscando..." : "🔎 Buscar"}
                </button>
              </div>
            </div>

            {/* Live RSS Preview Card */}
            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', color: 'white', marginBottom: '20px', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#60a5fa', letterSpacing: '1px' }}>
                  PRÉ-VISUALIZAÇÃO DA NOTÍCIA ({rssPreviewIdx + 1}/{rssPreviewItems.length || 1})
                </span>
                <span style={{ fontSize: '11px', background: '#1e293b', padding: '2px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                  {rssPreviewItems[rssPreviewIdx]?.pubDate || 'Hoje'}
                </span>
              </div>

              {rssLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid #60a5fa', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>Carregando matérias do RSS...</span>
                </div>
              ) : rssPreviewItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: rssPreviewItems[rssPreviewIdx]?.thumbnail ? '120px 1fr' : '1fr', gap: '15px', alignItems: 'center' }}>
                  {rssPreviewItems[rssPreviewIdx]?.thumbnail && (
                    <img 
                      src={rssPreviewItems[rssPreviewIdx].thumbnail} 
                      alt="Thumbnail"
                      style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #334155' }}
                    />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                      {rssPreviewItems[rssPreviewIdx].title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rssPreviewItems[rssPreviewIdx].description}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '30px 0' }}>Nenhuma notícia encontrada nesta URL.</p>
              )}

              {/* Slider Navigation */}
              {rssPreviewItems.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
                  <button
                    type="button"
                    onClick={() => setRssPreviewIdx(prev => (prev > 0 ? prev - 1 : rssPreviewItems.length - 1))}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ◀ Anterior
                  </button>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Troca automática por tempo configurado</span>
                  <button
                    type="button"
                    onClick={() => setRssPreviewIdx(prev => (prev < rssPreviewItems.length - 1 ? prev + 1 : 0))}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Próxima ▶
                  </button>
                </div>
              )}
            </div>

            {/* List of News Items */}
            {rssPreviewItems.length > 0 && (
              <div style={{ marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', margin: '0 0 10px 0' }}>Selecione e edite as notícias ({rssPreviewItems.filter(i => i.selected !== false).length}/{rssPreviewItems.length}):</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                  {rssPreviewItems.map((item, idx) => (
                    <div key={idx} style={{ background: item.selected === false ? '#f8fafc' : 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', opacity: item.selected === false ? 0.6 : 1, transition: 'all 0.2s' }}>
                      <div style={{ paddingTop: '8px' }}>
                        <input type="checkbox" checked={item.selected !== false} onChange={(e) => {
                          const newItems = [...rssPreviewItems];
                          newItems[idx].selected = e.target.checked;
                          setRssPreviewItems(newItems);
                        }} style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input type="text" value={item.title} onChange={(e) => {
                          const newItems = [...rssPreviewItems];
                          newItems[idx].title = e.target.value;
                          setRssPreviewItems(newItems);
                        }} style={{ width: '100%', fontWeight: 700, fontSize: '13px', marginBottom: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', boxSizing: 'border-box' }} disabled={item.selected === false} />
                        
                        <textarea value={item.description} onChange={(e) => {
                          const newItems = [...rssPreviewItems];
                          newItems[idx].description = e.target.value;
                          setRssPreviewItems(newItems);
                        }} style={{ width: '100%', fontSize: '12px', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', resize: 'vertical', minHeight: '60px', boxSizing: 'border-box', marginBottom: '6px' }} disabled={item.selected === false} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tempo (segundos):</label>
                          <input 
                            type="number" 
                            min="5" 
                            placeholder={propDuration ? `Padrão (${propDuration}s)` : "Padrão (15s)"}
                            value={item.duration || ''} 
                            onChange={(e) => {
                              const newItems = [...rssPreviewItems];
                              newItems[idx].duration = e.target.value ? parseInt(e.target.value) : '';
                              setRssPreviewItems(newItems);
                            }} 
                            style={{ width: '90px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 6px' }} 
                            disabled={item.selected === false}
                          />
                        </div>
                      </div>
                      {item.thumbnail && (
                        <div style={{ flexShrink: 0, width: '80px' }}>
                          <img src={item.thumbnail} alt="" style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsRssModalOpen(false)}
                style={{ padding: '12px 20px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPropUrl(rssUrlInput);
                  setInputType('rss');
                  if (!propName) {
                    setPropName(rssPresetName || 'Feed RSS - Notícias');
                  }
                  
                  const activeItems = rssPreviewItems.filter(i => i.selected !== false);
                  const totalTime = activeItems.reduce((acc, item) => acc + (item.duration || 15), 0);
                  setPropDuration(totalTime);
                  
                  setRssConfiguredItems(activeItems);
                  setIsRssModalOpen(false);
                  showToast("Feed RSS configurado!");
                }}
                style={{ padding: '12px 24px', border: 'none', borderRadius: '10px', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
              >
                ✅ Salvar & Aplicar Feed RSS
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
