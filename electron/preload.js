const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  browseFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  revealInFinder: (filePath) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath)
});
