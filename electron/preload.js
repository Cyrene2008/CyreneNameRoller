const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // 数据操作 - 使用 invoke (异步)
  loadData: (key) => ipcRenderer.invoke('data:load', key),
  saveData: (key, data) => ipcRenderer.invoke('data:save', key, data),
  loadNames: () => ipcRenderer.invoke('data:loadNames'),
  loadChangelog: () => ipcRenderer.invoke('data:loadChangelog'),
  exportData: () => ipcRenderer.invoke('data:exportData'),
  importData: () => ipcRenderer.invoke('data:importData'),

  // 同步保存 - 确保数据立即落盘
  saveDataSync: (key, data) => ipcRenderer.sendSync('data:saveSync', key, data)
})
