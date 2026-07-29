const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "Object.entries(",
  "(Object.entries("
);

content = content.replace(
  "              ).map(([pName, items]) => (",
  "              ) as [string, MediaItem[]][]).map(([pName, items]) => ("
);

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed type casting");
