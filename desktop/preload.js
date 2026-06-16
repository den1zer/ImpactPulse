const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  apiRequest: (opts) => ipcRenderer.invoke('api-request', opts),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFilesDialog: () => ipcRenderer.invoke('open-files-dialog'),
  onServerReady: (cb) => ipcRenderer.on('server-ready', cb),
  onServerError: (cb) => ipcRenderer.on('server-error', (_e, msg) => cb(msg)),
  serverUrl: process.env.SERVER_URL || 'https://impactpulse.onrender.com'
});
