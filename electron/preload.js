const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  browseFolder: () => ipcRenderer.invoke('dialog:openDirectory')
});
