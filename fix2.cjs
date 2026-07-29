const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "{screen === 'playlist' && (\n        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>",
  "{screen === 'playlist' && (\n        <>\n        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>"
);

content = content.replace(
  "      )}\n      {/* SCREEN: RELATÓRIOS (Exact HTML structure) */}",
  "      </>)}\n      {/* SCREEN: RELATÓRIOS (Exact HTML structure) */}"
);

// We also have an extra `      )}` around line 1318 that we should remove.
const lines = content.split('\n');
const extraIdx = lines.findIndex((l, idx) => l.trim() === ')}' && lines[idx+1] && lines[idx+1].trim() === ')}');
if (extraIdx !== -1) {
    lines.splice(extraIdx, 1);
}

// wait, let's just find the duplicate `)}`
for (let i = 0; i < lines.length - 1; i++) {
   if (lines[i] === "      )}" && lines[i+1] === "      )}") {
       lines.splice(i, 1);
       break;
   }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
