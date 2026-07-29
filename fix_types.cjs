const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  "  userId?: string;",
  "  userId?: string;\n  playlistName?: string;\n  paused?: boolean;"
);

fs.writeFileSync('src/types.ts', content);
