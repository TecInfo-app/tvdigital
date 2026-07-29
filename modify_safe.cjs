const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const startIdx = 1042; // index of line 1043
const endIdx = 1203;   // index of line 1204

// Extract the inner content of the form, skipping the wrapper div and h2
const innerFormLines = lines.slice(startIdx + 5, endIdx).map(line => '      ' + line);

const buttonHTML = [
"          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>",
"            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#334155' }}>Playlist & Mídias</h2>",
"            <button ",
"              onClick={() => { resetForm(); setIsMediaModalOpen(true); }}",
"              style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}",
"            >",
"              + Nova Mídia",
"            </button>",
"          </div>"
];

// Now find where to insert the modal.
// We want to insert it right before the last closing `</div>` of the `screen === 'playlist'` block.
// Let's find `{/* SCREEN: RELATÓRIOS (Exact HTML structure) */}`
const reportIdx = lines.findIndex(line => line.includes("SCREEN: RELATÓRIOS"));
// The playlist screen ends a few lines above.
let insertModalIdx = reportIdx - 1;
while(insertModalIdx > 0 && !lines[insertModalIdx].includes("      )}")) {
    insertModalIdx--;
}

const modalHTML = [
"      {isMediaModalOpen && (",
"        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>",
"          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '700px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>",
"            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>",
'              {editingId ? "Editando Mídia" : "Nova Mídia"}',
"            </h2>",
...innerFormLines,
"          </div>",
"        </div>",
"      )}"
];

const newLines = [
  ...lines.slice(0, startIdx),
  ...buttonHTML,
  ...lines.slice(endIdx + 1, insertModalIdx),
  ...modalHTML,
  ...lines.slice(insertModalIdx)
];

fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log("Done");
