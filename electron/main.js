const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const Store = require('electron-store')

let win
const isDev = !app.isPackaged

const store = new Store({ name: 'cyrene-data' })
const windowStatePath = new Store({ name: 'window-state' })

function loadWindowState() {
  try {
    const x = windowStatePath.get('x')
    const y = windowStatePath.get('y')
    const width = windowStatePath.get('width')
    const height = windowStatePath.get('height')
    const isMaximized = windowStatePath.get('isMaximized')
    if (width && height) return { x, y, width, height, isMaximized }
  } catch {}
  return null
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return
  try {
    const bounds = win.getBounds()
    windowStatePath.set('x', bounds.x)
    windowStatePath.set('y', bounds.y)
    windowStatePath.set('width', bounds.width)
    windowStatePath.set('height', bounds.height)
    windowStatePath.set('isMaximized', win.isMaximized())
  } catch {}
}

function createWindow() {
  const saved = loadWindowState()
  const defaults = { width: 1200, height: 900, minWidth: 1200, minHeight: 900 }
  const opts = { ...defaults }
  if (saved) {
    opts.x = saved.x
    opts.y = saved.y
    opts.width = Math.max(saved.width, defaults.minWidth)
    opts.height = Math.max(saved.height, defaults.minHeight)
  }

  win = new BrowserWindow({
    ...opts,
    frame: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (saved && saved.isMaximized) win.maximize()

  win.on('close', saveWindowState)
  win.on('resize', saveWindowState)
  win.on('move', saveWindowState)

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// 窗口控制
ipcMain.on('window-minimize', () => win.minimize())
ipcMain.on('window-maximize', () => { win.isMaximized() ? win.unmaximize() : win.maximize() })
ipcMain.on('window-close', () => win.close())
ipcMain.handle('window-is-maximized', () => win.isMaximized())

// electron-store 存储 IPC
ipcMain.handle('storage-get', (_, key) => {
  try {
    const val = store.get(key)
    return val !== undefined ? val : null
  } catch (e) {
    console.error(`[storage-get] Failed for "${key}":`, e.message)
    return null
  }
})

ipcMain.handle('storage-set', (_, key, value) => {
  try {
    store.set(key, value)
    return true
  } catch (e) {
    console.error(`[storage-set] Failed for "${key}":`, e.message)
    return false
  }
})

ipcMain.handle('storage-delete', (_, key) => {
  try {
    store.delete(key)
    return true
  } catch (e) {
    return false
  }
})

ipcMain.handle('storage-clear', () => {
  try {
    store.clear()
    return true
  } catch (e) {
    return false
  }
})

// 名单加载（从 .origin 目录）
ipcMain.handle('data:loadNames', () => {
  const bundledPath = path.join(__dirname, '../.origin/names.json')
  try {
    if (fs.existsSync(bundledPath)) {
      return JSON.parse(fs.readFileSync(bundledPath, 'utf-8'))
    }
  } catch (e) {
    console.error('[data:loadNames] Failed:', e.message)
  }
  return { names: [] }
})

ipcMain.handle('data:loadChangelog', () => {
  const bundledPath = path.join(__dirname, '../.origin/up.json')
  try {
    if (fs.existsSync(bundledPath)) {
      return JSON.parse(fs.readFileSync(bundledPath, 'utf-8'))
    }
  } catch {}
  return []
})

// 导出/导入
ipcMain.handle('data:exportData', async () => {
  try {
    const allData = store.store
    const { filePath: savePath } = await dialog.showSaveDialog(win, {
      title: '导出数据',
      defaultPath: 'cyrene-data.cyrene',
      filters: [{ name: 'Cyrene Data', extensions: ['cyrene'] }]
    })
    if (savePath) {
      fs.writeFileSync(savePath, JSON.stringify(allData, null, 2), 'utf-8')
      return { success: true }
    }
    return { success: false, cancelled: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('data:importData', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(win, {
      title: '导入数据',
      filters: [{ name: 'Cyrene Data', extensions: ['cyrene', 'json'] }],
      properties: ['openFile']
    })
    if (filePaths.length > 0) {
      const raw = fs.readFileSync(filePaths[0], 'utf-8')
      const allData = JSON.parse(raw)
      for (const [key, value] of Object.entries(allData)) {
        store.set(key, value)
      }
      return { success: true }
    }
    return { success: false, cancelled: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
