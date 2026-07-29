const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "          {/* Media List rendered as .media-item cards */}";
const endMarker = "      {isMediaModalOpen && (";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Not found");
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newHTML = `          {/* Media List grouped by playlist */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
              Fila de Exibição ({activePlaylist.length} ativas)
            </h3>

            {basePlaylist.length === 0 ? (
              <div style={{ background: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                Nenhuma mídia na playlist. Preencha os campos acima para cadastrar.
              </div>
            ) : (
              Object.entries(
                basePlaylist.reduce((acc, item) => {
                  const pName = item.playlistName || 'Geral';
                  if (!acc[pName]) acc[pName] = [];
                  acc[pName].push(item);
                  return acc;
                }, {})
              ).map(([pName, items]) => (
                <div key={pName} style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsedPlaylists[pName] ? '0' : '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        checked={activePlaylistNames[pName] || false}
                        onChange={(e) => setActivePlaylistNames(prev => ({ ...prev, [pName]: e.target.checked }))}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#334155' }}>
                        Playlist: {pName} <span style={{ fontSize: '12px', color: '#94a3b8' }}>({items.length} itens)</span>
                      </h4>
                    </div>
                    <button 
                      onClick={() => setCollapsedPlaylists(prev => ({ ...prev, [pName]: !prev[pName] }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      {collapsedPlaylists[pName] ? '▼ Mostrar' : '▲ Recolher'}
                    </button>
                  </div>

                  {!collapsedPlaylists[pName] && (
                    <div>
                      {items.map((item, index) => {
                        let desc = (item.days && item.days.length < 7) 
                          ? "📅 " + item.days.map(d => nomesDias[d]).join(", ") 
                          : "📅 Todos os dias";
                        if (item.start || item.end) desc += \` | 🕒 Agendado\`;
                        if (item.duration) desc += \` | ⏱️ \${item.duration}s\`;
                        if (item.paused) desc += \` | ⏸️ Pausado\`;

                        return (
                          <div 
                            key={item.id} 
                            draggable={true}
                            onDragStart={(e) => {
                              setDraggedIndex(basePlaylist.findIndex(i => i.id === item.id));
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', String(basePlaylist.findIndex(i => i.id === item.id)));
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const from = draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData('text/plain'));
                              reorderDrag(from, basePlaylist.findIndex(i => i.id === item.id));
                              setDraggedIndex(null);
                            }}
                            onDragEnd={() => setDraggedIndex(null)}
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '24px 60px 1fr auto', 
                              alignItems: 'center', 
                              padding: '12px', 
                              background: item.paused ? '#f8fafc' : 'white', 
                              marginBottom: '8px', 
                              borderRadius: '12px', 
                              border: draggedIndex === basePlaylist.findIndex(i => i.id === item.id) ? '2px dashed #6366f1' : '1px solid #e2e8f0',
                              opacity: draggedIndex === basePlaylist.findIndex(i => i.id === item.id) ? 0.4 : (item.paused ? 0.6 : 1),
                              cursor: 'grab',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                              ☰
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <button 
                                onClick={() => reorder(basePlaylist.findIndex(i => i.id === item.id), -1)}
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                ▲
                              </button>
                              <button 
                                onClick={() => reorder(basePlaylist.findIndex(i => i.id === item.id), 1)}
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                ▼
                              </button>
                            </div>
                            <div style={{ paddingLeft: '10px', overflow: 'hidden' }}>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155', textDecoration: item.paused ? 'line-through' : 'none' }}>
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
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
`;

fs.writeFileSync('src/App.tsx', before + newHTML + after);
console.log("Replaced List!");
