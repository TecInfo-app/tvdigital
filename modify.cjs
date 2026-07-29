const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>";
const endMarker = "          {/* Media List rendered as .media-item cards */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers", startIndex, endIndex);
  process.exit(1);
}

const formContent = content.substring(startIndex, endIndex);

const buttonHTML = `          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#334155' }}>Playlist & Mídias</h2>
            <button 
              onClick={() => { resetForm(); setIsMediaModalOpen(true); }}
              style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
            >
              + Nova Mídia
            </button>
          </div>
`;

const modalHTML = `
      {isMediaModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '700px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              {editingId ? "Editando Mídia" : "Nova Mídia"}
            </h2>
            ${formContent.replace(/          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>/, "<div>")
                         .replace(/<h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '20px', fontWeight: 700 }}>\s*\{editingId \? "Editando Mídia" : "Nova Mídia"\}\s*<\/h2>/, "")}
        </div>
      )}
`;

const beforeForm = content.substring(0, startIndex);
const afterForm = content.substring(endIndex);

// inject modal HTML at the end of the return statement.
// find the last "  );"
const lastParenIndex = afterForm.lastIndexOf("  );");
const newAfterForm = afterForm.substring(0, lastParenIndex) + modalHTML + "\n" + afterForm.substring(lastParenIndex);

content = beforeForm + buttonHTML + newAfterForm;
fs.writeFileSync('src/App.tsx', content);
console.log("Done");
