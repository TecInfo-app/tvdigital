const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const newFields = `
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>NOME DA PLAYLIST (Grupo)</label>
                      <input 
                        type="text" 
                        value={propPlaylistName}
                        onChange={(e) => setPropPlaylistName(e.target.value)}
                        placeholder="Ex: Manhã, Promoções, Geral"
                        style={{ width: '100%', padding: '12px', margin: '0 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={propPaused}
                          onChange={(e) => setPropPaused(e.target.checked)}
                          style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                        />
                        ⏸️ Pausar Mídia
                      </label>
                    </div>
                  </div>
`;

content = content.replace(
  "                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>\n                    <div>\n                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>NOME DA MÍDIA</label>",
  newFields + "\n                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>\n                    <div>\n                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>NOME DA MÍDIA</label>"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Done part 2");
