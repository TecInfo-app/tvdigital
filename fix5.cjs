const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const tagIdx = lines.findIndex(line => line === "      </>");
if (tagIdx !== -1) {
    lines.splice(tagIdx, 0, "      )}");
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
