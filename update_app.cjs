const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add new states
const stateInjection = `
  const [propPlaylistName, setPropPlaylistName] = useState('Geral');
  const [propPaused, setPropPaused] = useState(false);
  const [collapsedPlaylists, setCollapsedPlaylists] = useState({});
  const [activePlaylistNames, setActivePlaylistNames] = useState({ 'Geral': true });
`;

content = content.replace("const [propName, setPropName] = useState('');", stateInjection + "\n  const [propName, setPropName] = useState('');");

// 2. update resetForm
content = content.replace(
  "setRssConfiguredItems([]);\n    setIsMediaModalOpen(false);",
  "setRssConfiguredItems([]);\n    setIsMediaModalOpen(false);\n    setPropPlaylistName('Geral');\n    setPropPaused(false);"
);

// 3. update editItem
content = content.replace(
  "setPropName(item.name);",
  "setPropName(item.name);\n    setPropPlaylistName(item.playlistName || 'Geral');\n    setPropPaused(!!item.paused);"
);

// 4. update handleSaveMedia
content = content.replace(
  "order: firestorePlaylist.length + 1,",
  "order: firestorePlaylist.length + 1,\n      playlistName: propPlaylistName || 'Geral',\n      paused: propPaused,"
);

// 5. Update Loop logic
content = content.replace(
  "const activePlaylist = firestorePlaylist.length > 0 ? firestorePlaylist : mediaItems;",
  "const basePlaylist = firestorePlaylist.length > 0 ? firestorePlaylist : mediaItems;\n  const activePlaylist = basePlaylist.filter(item => activePlaylistNames[item.playlistName || 'Geral'] && !item.paused);"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Done part 1");
