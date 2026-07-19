const { contextBridge, ipcRenderer, shell } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  downloadAndLaunchUpdate: (url, fileName, expectedSize) => ipcRenderer.invoke('download-and-launch-update', url, fileName, expectedSize),
  onUpdateDownloadProgress: (callback) => {
    const listener = (_, progress) => callback(progress)
    ipcRenderer.on('update-download-progress', listener)
    return () => ipcRenderer.removeListener('update-download-progress', listener)
  },

  storageGet: (key) => ipcRenderer.invoke('storage-get', key),
  storageSet: (key, value) => ipcRenderer.invoke('storage-set', key, value),
  storageDelete: (key) => ipcRenderer.invoke('storage-delete', key),
  storageClear: () => ipcRenderer.invoke('storage-clear'),

  loadNames: () => ipcRenderer.invoke('data:loadNames'),
  loadChangelog: () => ipcRenderer.invoke('data:loadChangelog'),
  exportData: () => ipcRenderer.invoke('data:exportData'),
  importData: () => ipcRenderer.invoke('data:importData'),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  fetchAnnouncements: () => ipcRenderer.invoke('fetch-announcements')
})
