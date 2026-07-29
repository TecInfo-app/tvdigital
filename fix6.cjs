const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "                        {editingId && (\n                    <button \n                       onClick={resetForm}\n                      style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#ef4444', color: 'white' }}\n                    >\n                      Cancelar Edição\n                    </button>\n                  )}",
  "                    <button \n                       onClick={resetForm}\n                      style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#ef4444', color: 'white', marginTop: '10px' }}\n                    >\n                      Cancelar\n                    </button>"
);

fs.writeFileSync('src/App.tsx', content);
