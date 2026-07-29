const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("return (\n    <div className", "return (\n    <>\n    <div className");
content = content.replace("  );\n}", "    </>\n  );\n}");

fs.writeFileSync('src/App.tsx', content);
