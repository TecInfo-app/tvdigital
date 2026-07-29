const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "                }, {})",
  "                }, {} as Record<string, MediaItem[]>)"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed type");
