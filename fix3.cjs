const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "{screen === 'config' && (\n        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>",
  "{screen === 'config' && (\n        <>\n        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>"
);

fs.writeFileSync('src/App.tsx', content);
