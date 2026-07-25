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
  getDocs 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './components/Auth';
import { MediaItem } from './types';

export default function App() {
  // Navigation screen: 'login' | 'menu' | 'config' | 'report' | 'player'
  const [screen, setScreen] = useState<'menu' | 'config' | 'report' | 'player'>('menu');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore & local state
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states (Config)
  const [propName, setPropName] = useState('');
  const [propDuration, setPropDuration] = useState<number | ''>('');
  const [inputType, setInputType] = useState<string>('video_url');
  const [propUrl, setPropUrl] = useState('');
  const [fileData, setFileData] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

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

  // Days list labels
  const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Monitor playlist in Firestore
        const q = query(collection(db, "playlist"), where("userId", "==", currentUser.uid));
        const unsubSnap = onSnapshot(q, (snap) => {
          const items: MediaItem[] = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as MediaItem))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setPlaylist(items);
        }, (err) => {
          console.warn("Firestore error or offline fallback:", err);
        });
        setAuthLoading(false);
        return () => unsubSnap();
      } else {
        setPlaylist([]);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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

  // Day toggle for checkboxes
  const toggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter(d => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  // Save Media (Create / Update)
  const handleSave = async () => {
    if (!propName.trim()) {
      alert("Insira o nome");
      return;
    }

    let content = propUrl;
    if (inputType.startsWith('upload')) {
      if (!fileData && !editingId) {
        alert("Selecione um arquivo para upload");
        return;
      }
      if (fileData) {
        content = fileData;
      }
    }

    const dur = propDuration !== '' ? Number(propDuration) : null;

    try {
      if (editingId) {
        await updateDoc(doc(db, "playlist", editingId), {
          name: propName,
          content,
          type: inputType,
          duration: dur,
          start: startDate,
          end: endDate,
          days: selectedDays
        });
        showToast("Alterações salvas!");
      } else {
        const nextOrder = playlist.length > 0 ? Math.max(...playlist.map(i => i.order || 0)) + 1 : 1;
        await addDoc(collection(db, "playlist"), {
          name: propName,
          content,
          type: inputType,
          order: nextOrder,
          start: startDate,
          end: endDate,
          userId: user?.uid || '',
          duration: dur,
          days: selectedDays
        });
        showToast("Mídia salva!");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar mídia");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setPropName("");
    setPropDuration("");
    setPropUrl("");
    setFileData("");
    setStartDate("");
    setEndDate("");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const editItem = (item: MediaItem) => {
    setEditingId(item.id);
    setPropName(item.name);
    setPropDuration(item.duration !== undefined && item.duration !== null ? item.duration : "");
    setInputType(item.type || 'video_url');
    setPropUrl(item.content || item.url || "");
    setStartDate(item.start || "");
    setEndDate(item.end || "");
    setSelectedDays(item.days || [0, 1, 2, 3, 4, 5, 6]);
  };

  const deleteItem = async (id: string) => {
    if (confirm("Excluir?")) {
      try {
        await deleteDoc(doc(db, "playlist", id));
        showToast("Mídia excluída!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const reorder = async (idx: number, dir: number) => {
    const target = idx + dir;
    if (target < 0 || target >= playlist.length) return;
    const current = playlist[idx];
    const next = playlist[target];
    const oldOrder = current.order || 0;
    const nextOrder = next.order || 0;

    try {
      await updateDoc(doc(db, "playlist", current.id), { order: nextOrder });
      await updateDoc(doc(db, "playlist", next.id), { order: oldOrder });
    } catch (err) {
      console.error(err);
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
        const n = d.data().mediaName;
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

  // Player Loop Logic
  const startPlayer = () => {
    if (!playlist.length) {
      alert("Playlist Vazia! Cadastre ao menos uma mídia.");
      return;
    }
    setScreen('player');
    setPlayIdx(0);
  };

  // Run Player Loop when screen === 'player'
  useEffect(() => {
    if (screen !== 'player' || playlist.length === 0) {
      if (playerTimerRef.current) clearTimeout(playerTimerRef.current);
      return;
    }

    let isMounted = true;

    const playNext = (currentIndex: number) => {
      if (!isMounted) return;
      if (playerTimerRef.current) clearTimeout(playerTimerRef.current);

      let targetIdx = currentIndex;
      if (targetIdx >= playlist.length) {
        targetIdx = 0;
      }

      const item = playlist[targetIdx];
      const agora = new Date();

      // Schedule validation
      const foraHorario = (item.start && agora < new Date(item.start)) || (item.end && agora > new Date(item.end));
      const diaErrado = item.days && item.days.length > 0 && !item.days.includes(agora.getDay());

      if (foraHorario || diaErrado) {
        // Skip item
        playNext(targetIdx + 1);
        return;
      }

      // Log play event to Firestore
      try {
        addDoc(collection(db, "logs"), {
          mediaName: item.name,
          timestamp: Date.now(),
          userId: user?.uid || ''
        });
      } catch (err) {
        console.warn("Log write error", err);
      }

      setCurrentMedia(item);
      setPlayIdx(targetIdx);

      const isVideo = item.type?.includes('video');
      const isWidget = item.type === 'widget';
      const durationMs = (item.duration || (isWidget ? 40 : 10)) * 1000;

      if (!isVideo) {
        // Image or Widget timer
        playerTimerRef.current = setTimeout(() => {
          if (isMounted) playNext(targetIdx + 1);
        }, durationMs);
      }
    };

    playNext(playIdx);

    return () => {
      isMounted = false;
      if (playerTimerRef.current) clearTimeout(playerTimerRef.current);
    };
  }, [screen, playlist, playIdx]);

  const handleVideoEnded = () => {
    if (screen === 'player') {
      setPlayIdx(prev => prev + 1);
    }
  };

  const handleLogout = async () => {
    if (confirm("Deseja mesmo sair?")) {
      await signOut(auth);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-sm font-bold tracking-wider text-slate-400">Carregando FastPlayer...</span>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[10000] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* SCREEN: MENU PRINCIPAL */}
      {screen === 'menu' && (
        <div className="max-w-3xl mx-auto p-5 sm:p-8 space-y-6">
          
          {/* Main Card (Dark #0f172a) */}
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl text-center border border-slate-800">
            <h1 className="text-3xl font-extrabold mb-1">Painel Cloud ⚡</h1>
            <p className="text-xs text-slate-400 mb-6">{user.email}</p>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setScreen('config')} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                ⚙️ Playlist
              </button>
              
              <button 
                onClick={startPlayer} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                ▶️ Iniciar TV
              </button>
              
              <button 
                onClick={() => setScreen('report')} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                📊 Relatórios
              </button>
              
              <button 
                onClick={handleLogout} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                🚪 Sair
              </button>
            </div>
          </div>

          {/* Dropbox Link Converter Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-indigo-500 space-y-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>🔗 Conversor Dropbox</span>
            </h3>
            
            <input 
              type="text"
              value={dropIn}
              onChange={(e) => setDropIn(e.target.value)}
              placeholder="Cole o link dl=0 aqui..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
            
            <button 
              onClick={convertDrop}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Converter
            </button>

            {showDropOut && (
              <div className="mt-3 bg-indigo-50 p-4 rounded-xl space-y-2 border border-indigo-100">
                <div className="text-xs font-bold text-indigo-700 break-all">
                  {dropOutLink}
                </div>
                <button 
                  onClick={copyConvertedLink}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-lg cursor-pointer transition-colors"
                >
                  📋 Copiar Link
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SCREEN: CONFIG / PLAYLIST & MÍDIAS */}
      {screen === 'config' && (
        <div className="max-w-3xl mx-auto p-5 sm:p-8 space-y-6">
          <button 
            onClick={() => setScreen('menu')}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-colors inline-flex items-center gap-1"
          >
            ⬅ Menu Principal
          </button>

          {/* Form Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? "Editando Mídia" : "Nova Mídia"}
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nome da Mídia</label>
                <input 
                  type="text"
                  value={propName}
                  onChange={(e) => setPropName(e.target.value)}
                  placeholder="Nome da Mídia"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tempo (seg)</label>
                <input 
                  type="number"
                  value={propDuration}
                  onChange={(e) => setPropDuration(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Tempo (s)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Days Selector */}
            <div>
              <label className="block text-[11px] font-bold text-blue-600 uppercase mb-2">
                Dias de Exibição:
              </label>
              <div className="flex flex-wrap gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {nomesDias.map((dName, idx) => (
                  <label key={idx} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedDays.includes(idx)}
                      onChange={() => toggleDay(idx)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>{dName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Input Type Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tipo de Mídia</label>
              <select 
                value={inputType}
                onChange={(e) => {
                  setInputType(e.target.value);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="video_url">URL de Vídeo (Dropbox)</option>
                <option value="img_url">URL de Imagem (Dropbox)</option>
                <option value="widget">Widget / Site</option>
                <option value="upload_video">Upload Local VÍDEO</option>
                <option value="upload_img">Upload Local IMAGEM</option>
              </select>
            </div>

            {/* URL or File input */}
            {inputType.startsWith('upload') ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Selecione o Arquivo</label>
                <input 
                  type="file"
                  accept={inputType.includes('video') ? 'video/*' : 'image/*'}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = () => {
                        setFileData(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">URL da Mídia / Página</label>
                <input 
                  type="url"
                  value={propUrl}
                  onChange={(e) => setPropUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Start and End date bounds */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Data Início (Opcional)</label>
                <input 
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Data Fim (Opcional)</label>
                <input 
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button 
                onClick={handleSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Salvar Mídia
              </button>

              {editingId && (
                <button 
                  onClick={resetForm}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </div>

          {/* Media List */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
              Fila de Exibição ({playlist.length})
            </h3>

            {playlist.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Nenhuma mídia cadastrada na playlist.
              </div>
            ) : (
              playlist.map((item, index) => {
                let desc = (item.days && item.days.length < 7) 
                  ? "📅 " + item.days.map(d => nomesDias[d]).join(", ") 
                  : "📅 Todos os dias";

                if (item.start || item.end) desc += ` | 🕒 Agendado`;
                if (item.duration) desc += ` | ⏱️ ${item.duration}s`;

                return (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-sm">
                    {/* Reorder arrows */}
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => reorder(index, -1)}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => reorder(index, 1)}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Media Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-800 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {desc}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => editItem(item)}
                        className="text-amber-600 font-bold text-xs hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 font-bold text-lg hover:text-red-800 px-1 cursor-pointer"
                        title="Excluir"
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

      {/* SCREEN: RELATÓRIOS */}
      {screen === 'report' && (
        <div className="max-w-3xl mx-auto p-5 sm:p-8 space-y-6">
          <button 
            onClick={() => setScreen('menu')}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-colors inline-flex items-center gap-1"
          >
            ⬅ Voltar
          </button>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Relatório de Exibição</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">De:</label>
                <input 
                  type="date"
                  value={repStart}
                  onChange={(e) => setRepStart(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Até:</label>
                <input 
                  type="date"
                  value={repEnd}
                  onChange={(e) => setRepEnd(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <button 
                onClick={generateReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs h-[42px] transition-colors cursor-pointer"
              >
                {reportLoading ? "Filtrando..." : "Filtrar"}
              </button>
            </div>

            {reportResults && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h3 className="font-bold text-sm text-slate-800">Resultados da Exibição:</h3>
                {Object.keys(reportResults).length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum registro encontrado no período selecionado.</p>
                ) : (
                  Object.entries(reportResults).map(([mName, count]) => (
                    <div key={mName} className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{mName}</span>
                      <span className="font-bold text-blue-600">{count}x exibição</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN: FULLSCREEN TV PLAYER */}
      {screen === 'player' && (
        <div className="fixed inset-0 z-[9999] bg-black w-screen h-screen flex flex-col justify-center items-center overflow-hidden">
          
          {/* Top Floating Exit Button */}
          <button 
            onClick={() => setScreen('menu')}
            className="absolute top-4 right-4 z-50 bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl backdrop-blur-md shadow-lg cursor-pointer transition-all"
          >
            ✕ Sair do Player
          </button>

          <div className="w-full h-full flex justify-center items-center bg-black">
            {currentMedia ? (
              currentMedia.type?.includes('video') ? (
                <video 
                  key={currentMedia.id + '-' + playIdx}
                  src={currentMedia.content || currentMedia.url}
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleVideoEnded}
                  onError={handleVideoEnded}
                  className="w-full h-full object-contain bg-black"
                />
              ) : currentMedia.type === 'widget' ? (
                <iframe 
                  key={currentMedia.id + '-' + playIdx}
                  src={currentMedia.content || currentMedia.url}
                  className="w-full h-full border-none bg-black"
                  title={currentMedia.name}
                />
              ) : (
                <img 
                  key={currentMedia.id + '-' + playIdx}
                  src={currentMedia.content || currentMedia.url}
                  alt={currentMedia.name}
                  className="w-full h-full object-contain bg-black"
                />
              )
            ) : (
              <div className="text-white text-sm font-bold">Aguardando mídia...</div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
