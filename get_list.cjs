const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "          {/* Media List rendered as .media-item cards */}";
const endMarker = "      {isMediaModalOpen && (";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

console.log(startIndex, endIndex);
