const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /marginBottom: editingId \? '10px' : '0' \}\}\n\s*>\n\s*Salvar Mídia\n\s*<\/button>\n\s*\{editingId && \(\n\s*<button \n\s*onClick=\{resetForm\}\n\s*style=\{\{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#ef4444', color: 'white' \}\}\n\s*>\n\s*Cancelar Edição\n\s*<\/button>\n\s*\)\}/,
  "marginBottom: '10px' }}\n                  >\n                    Salvar Mídia\n                  </button>\n                  <button \n                    onClick={resetForm}\n                    style={{ padding: '14px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, width: '100%', background: '#ef4444', color: 'white' }}\n                  >\n                    Cancelar\n                  </button>"
);

fs.writeFileSync('src/App.tsx', content);
