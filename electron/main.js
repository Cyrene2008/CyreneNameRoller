const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

let win
const isDev = !app.isPackaged

const userDataPath = app.getPath('userData')
const dataDir = path.join(userDataPath, 'data')

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 1200,
    minHeight: 900,
    frame: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

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
    console.error(`Failed to load ${key}:`, e)
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
    console.error(`Failed to save ${key}:`, e)
    return false
  }
})

ipcMain.handle('data:loadNames', () => {
  const bundledPath = path.join(__dirname, '../.origin/names.json')
  try {
    const raw = fs.readFileSync(bundledPath, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load names.json:', e)
    return { names: [] }
  }
})

ipcMain.handle('data:loadChangelog', () => {
  const bundledPath = path.join(__dirname, '../.origin/up.json')
  try {
    const raw = fs.readFileSync(bundledPath, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load up.json:', e)
    return []
  }
})

ipcMain.handle('data:exportData', async () => {
  ensureDataDir()
  try {
    const allData = {}
    const files = fs.readdirSync(dataDir)
    for (const file of files) {
      if (file.endsWith('.json')) {
        const key = file.replace('.json', '')
        const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8')
        allData[key] = JSON.parse(raw)
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
      for (const [key, value] of Object.entries(allData)) {
        fs.writeFileSync(path.join(dataDir, `${key}.json`), JSON.stringify(value, null, 2), 'utf-8')
      }
      return { success: true }
    }
    return { success: false, cancelled: true }
  } catch (e) {
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
