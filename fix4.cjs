const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const reportIdx = lines.findIndex(line => line.includes("SCREEN: RELATÓRIOS (Exact HTML structure)"));
let closingIdx = reportIdx - 1;
while(closingIdx > 0 && lines[closingIdx].trim() !== ")}") {
    closingIdx--;
}

if (closingIdx > 0) {
    lines.splice(closingIdx, 0, "      </>");
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
