const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

let win
const isDev = !app.isPackaged

const userDataPath = app.getPath('userData')
const dataDir = path.join(userDataPath, 'data')
const windowStatePath = path.join(userDataPath, 'window-state.json')

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function loadWindowState() {
  try {
    if (fs.existsSync(windowStatePath)) {
      return JSON.parse(fs.readFileSync(windowStatePath, 'utf-8'))
    }
  } catch {}
  return null
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return
  try {
    const bounds = win.getBounds()
    const isMaximized = win.isMaximized()
    const state = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, isMaximized }
    fs.writeFileSync(windowStatePath, JSON.stringify(state), 'utf-8')
  } catch {}
}

function createWindow() {
  ensureDataDir()
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

  if (saved && saved.isMaximized) {
    win.maximize()
  }

  win.on('close', saveWindowState)
  win.on('resize', saveWindowState)
  win.on('move', saveWindowState)

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// 窗口控制 IPC
ipcMain.on('window-minimize', () => win.minimize())
ipcMain.on('window-maximize', () => {
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('window-close', () => win.close())
ipcMain.handle('window-is-maximized', () => win.isMaximized())

// 数据文件路径
function getDataFilePath(key) {
  return path.join(dataDir, `${key}.json`)
}

// 数据操作 IPC
ipcMain.handle('data:load', (_, key) => {
  ensureDataDir()
  const filePath = getDataFilePath(key)
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw)
    }
    return null
  } catch (e) {
    console.error(`[data] Failed to load ${key}:`, e.message)
    return null
  }
})

ipcMain.handle('data:save', (_, key, data) => {
  ensureDataDir()
  const filePath = getDataFilePath(key)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error(`[data] Failed to save ${key}:`, e.message)
    return false
  }
})

ipcMain.handle('data:loadNames', () => {
  // 优先从 .origin 读取，不存在则从 userData/data 读取
  const bundledPath = path.join(__dirname, '../.origin/names.json')
  const userDataPath2 = getDataFilePath('defaultNames')
  try {
    if (fs.existsSync(bundledPath)) {
      return JSON.parse(fs.readFileSync(bundledPath, 'utf-8'))
    }
    if (fs.existsSync(userDataPath2)) {
      return JSON.parse(fs.readFileSync(userDataPath2, 'utf-8'))
    }
  } catch (e) {
    console.error('[data] Failed to load names:', e.message)
  }
  return { names: [] }
})

ipcMain.handle('data:loadChangelog', () => {
  const bundledPath = path.join(__dirname, '../.origin/up.json')
  try {
    if (fs.existsSync(bundledPath)) {
      return JSON.parse(fs.readFileSync(bundledPath, 'utf-8'))
    }
  } catch (e) {
    console.error('[data] Failed to load changelog:', e.message)
  }
  return []
})

ipcMain.handle('data:exportData', async () => {
  ensureDataDir()
  try {
    const allData = {}
    const files = fs.readdirSync(dataDir)
    for (const file of files) {
      if (file.endsWith('.json')) {
        const key = file.replace('.json', '')
        allData[key] = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'))
      }
    }
    const { filePath: savePath } = await dialog.showSaveDialog(win, {
      title: '导出数据',
      defaultPath: 'cyrene-data.cyrene',
      filters: [{ name: 'Cyrene Data', extensions: ['cyrene'] }]
    })
    if (savePath) {
      fs.writeFileSync(savePath, JSON.stringify(allData, null, 2), 'utf-8')
      return { success: true, path: savePath }
    }
    return { success: false, cancelled: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('data:importData', async () => {
  ensureDataDir()
  try {
    const { filePaths } = await dialog.showOpenDialog(win, {
      title: '导入数据',
      filters: [{ name: 'Cyrene Data', extensions: ['cyrene', 'json'] }],
      properties: ['openFile']
    })
    if (filePaths.length > 0) {
      const raw = fs.readFileSync(filePaths[0], 'utf-8')
      const allData = JSON.parse(raw)
      const writtenKeys = []
      for (const [key, value] of Object.entries(allData)) {
        const filePath = path.join(dataDir, `${key}.json`)
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
        writtenKeys.push(key)
      }
      // 验证写入
      for (const key of writtenKeys) {
        const filePath = path.join(dataDir, `${key}.json`)
        if (!fs.existsSync(filePath)) {
          throw new Error(`Verification failed: ${key}.json not written`)
        }
      }
      return { success: true, keys: writtenKeys }
    }
    return { success: false, cancelled: true }
  } catch (e) {
    console.error('[import] Failed:', e.message)
    return { success: false, error: e.message }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
