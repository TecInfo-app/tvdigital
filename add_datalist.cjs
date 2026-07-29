const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
                      <input 
                        type="text" 
                        value={propPlaylistName}
                        onChange={(e) => setPropPlaylistName(e.target.value)}
                        placeholder="Ex: Manhã, Promoções, Geral"
                        list="playlist-names"
                        style={{ width: '100%', padding: '12px', margin: '0 0 15px 0', border: '1px solid #cbd5e1', borderRadius: '10px', boxSizing: 'border-box' }}
                      />
                      <datalist id="playlist-names">
                        {Array.from(new Set(basePlaylist.map(m => m.playlistName || 'Geral'))).map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
`;

// wait, is basePlaylist available in the modal scope? Yes, basePlaylist is declared at the top level of App component.

content = content.replace(
  /<input\s+type="text"\s+value=\{propPlaylistName\}\s+onChange=\{\(e\) => setPropPlaylistName\(e.target.value\)\}\s+placeholder="Ex: Manhã, Promoções, Geral"\s+style=\{\{.*?\}\}\s+\/>/,
  replacement
);

fs.writeFileSync('src/App.tsx', content);
console.log("Added datalist");
