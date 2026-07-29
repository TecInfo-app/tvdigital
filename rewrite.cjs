const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>";
const endMarker = "          {/* Media List rendered as .media-item cards */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

const formContent = content.substring(startIndex, endIndex);

const beforeForm = content.substring(0, startIndex);
const afterForm = content.substring(endIndex);

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

// In formContent, replace the wrapper div with one that doesn't have the boxShadow etc if needed.
// Actually we can just keep the internal parts.
let modalForm = formContent.replace(
  startMarker,
  ""
);

modalForm = modalForm.replace(
  /<h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '20px', fontWeight: 700 }}>\s*\{editingId \? "Editando Mídia" : "Nova Mídia"\}\s*<\/h2>/,
  ""
);

// find where `screen === 'report'` starts.
const reportIndex = afterForm.indexOf("{/* SCREEN: RELATÓRIOS (Exact HTML structure) */}");
if (reportIndex === -1) {
    console.error("Could not find report screen start");
    process.exit(1);
}

// Find the last `      )}` before reportIndex.
const beforeReport = afterForm.substring(0, reportIndex);
const closeWrapperIndex = beforeReport.lastIndexOf("      )}");

if (closeWrapperIndex === -1) {
    console.error("Could not find close wrapper");
    process.exit(1);
}

const modalHTML = `
          {isMediaModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
              <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '700px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                  {editingId ? "Editando Mídia" : "Nova Mídia"}
                </h2>
                <div style={{ width: '100%' }}>
${modalForm}
              </div>
            </div>
          )}
`;

const newAfterForm = beforeReport.substring(0, closeWrapperIndex) + modalHTML + beforeReport.substring(closeWrapperIndex) + afterForm.substring(reportIndex);

fs.writeFileSync('src/App.tsx', beforeForm + buttonHTML + newAfterForm);
console.log("Done");

