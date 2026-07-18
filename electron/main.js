const { app, BrowserWindow, ipcMain, dialog, shell, net, Tray, Menu: ElectronMenu } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const os = require('os')

let win
let store
let windowStateStore
let tray = null
let quitting = false
const isDev = !app.isPackaged

// 单实例限制：多次启动主程序只保留一个进程
if (!app.requestSingleInstanceLock()) {
  app.quit()
}
app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
})

async function initStore() {
  const { default: Store } = await import('electron-store')
  store = new Store({ name: 'cyrene-data' })
  windowStateStore = new Store({ name: 'window-state' })
}

function loadWindowState() {
  try {
    const x = windowStateStore.get('x')
    const y = windowStateStore.get('y')
    const width = windowStateStore.get('width')
    const height = windowStateStore.get('height')
    const isMaximized = windowStateStore.get('isMaximized')
    if (width && height) return { x, y, width, height, isMaximized }
  } catch {}
  return null
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return
  try {
    const bounds = win.getBounds()
    windowStateStore.set('x', bounds.x)
    windowStateStore.set('y', bounds.y)
    windowStateStore.set('width', bounds.width)
    windowStateStore.set('height', bounds.height)
    windowStateStore.set('isMaximized', win.isMaximized())
  } catch {}
}

function createWindow() {
  const saved = loadWindowState()
  const defaults = { width: 1200, height: 900, minWidth: 800, minHeight: 600 }
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

  // 关闭时最小化到托盘而非退出（后台常驻），仅托盘“退出”时真正退出
  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      win.hide()
      return
    }
    saveWindowState()
  })
  win.on('resize', saveWindowState)
  win.on('move', saveWindowState)

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// 窗口控制
ipcMain.on('window-minimize', () => win.minimize())
ipcMain.on('window-maximize', () => { win.isMaximized() ? win.unmaximize() : win.maximize() })
ipcMain.on('window-close', () => win.close())
ipcMain.handle('window-is-maximized', () => win.isMaximized())

ipcMain.handle('open-external', (_, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url)
  }
})

ipcMain.handle('save-and-launch', async (_, uint8Array, fileName) => {
  try {
    const { filePath } = await dialog.showSaveDialog(win, {
      title: '保存安装程序',
      defaultPath: fileName,
      filters: [{ name: '安装程序', extensions: ['exe'] }]
    })
    if (!filePath) return { cancelled: true }
    fs.writeFileSync(filePath, Buffer.from(uint8Array))
    await shell.openPath(filePath)
    return { success: true, filePath }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('save-file-dialog', async (_, uint8Array, fileName) => {
  try {
    const { filePath } = await dialog.showSaveDialog(win, {
      title: '另存为',
      defaultPath: fileName,
      filters: [{ name: '安装程序', extensions: ['exe'] }]
    })
    if (!filePath) return { cancelled: true }
    fs.writeFileSync(filePath, Buffer.from(uint8Array))
    return { success: true, filePath }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// electron-store 存储 IPC
ipcMain.handle('storage-get', (_, key) => {
  try {
    if (!store) return null
    const val = store.get(key)
    return val !== undefined ? val : null
  } catch (e) {
    console.error(`[storage-get] Failed for "${key}":`, e.message)
    return null
  }
})

ipcMain.handle('storage-set', (_, key, value) => {
  try {
    if (!store) return false
    store.set(key, value)
    return true
  } catch (e) {
    console.error(`[storage-set] Failed for "${key}":`, e.message)
    return false
  }
})

ipcMain.handle('storage-delete', (_, key) => {
  try {
    if (!store) return false
    store.delete(key)
    return true
  } catch (e) {
    return false
  }
})

ipcMain.handle('storage-clear', () => {
  try {
    if (!store) return false
    store.clear()
    return true
  } catch (e) {
    return false
  }
})

// 检查更新（通过主进程避免 CORS）
ipcMain.handle('check-update', async () => {
  const urls = [
    'https://api.github.com/repos/Cyrene2008/CyreneNameRoller/releases/latest',
    'https://api.kkgithub.com/repos/Cyrene2008/CyreneNameRoller/releases/latest'
  ]
  for (const url of urls) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: { 'User-Agent': 'CyreneNameRoller', 'Accept': 'application/vnd.github.v3+json' },
          timeout: 8000
        }, (res) => {
          if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return }
          let body = ''
          res.on('data', c => body += c)
          res.on('end', () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
        })
        req.on('error', reject)
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
      })
      return { ok: true, data }
    } catch {}
  }
  return { ok: false, error: '无法连接到更新服务器' }
})

// 公告拉取（通过主进程避免 CORS / webview 网络限制）。
// 下载到系统 TEMP 缓存文件再读回；全部失败则复用本地缓存（离线兜底）。
ipcMain.handle('fetch-announcements', async () => {
  const urls = [
    'https://gh.xn--8hvv1o.cn/raw.githubusercontent.com/Cyrene2008/CyreneNameRoller/refs/heads/master/.announcement/latest.json',
    'https://nameapi.cyrene.hi.cn/announcement/latest.json',
    'https://raw.githubusercontent.com/Cyrene2008/CyreneNameRoller/master/.announcement/latest.json'
  ]
  const cachePath = path.join(os.tmpdir(), 'CyreneNameRoller', 'announcement.json')
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })

  for (const url of urls) {
    try {
      const body = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: { 'User-Agent': 'CyreneNameRoller' },
          timeout: 10000
        }, (res) => {
          if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return }
          let buf = ''
          res.on('data', c => buf += c)
          res.on('end', () => resolve(buf))
        })
        req.on('error', reject)
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
      })
      // 1) 写入 TEMP 缓存文件
      fs.writeFileSync(cachePath, body)
      // 2) 从磁盘读回并解析
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
      return { ok: true, data }
    } catch {}
  }

  // 全部拉取失败：尝试读取之前已缓存的文件（离线兜底）
  try {
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    return { ok: true, data }
  } catch {}
  return { ok: false, error: '无法获取公告内容' }
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
  const paths = [
    path.join(__dirname, '../dist/updatelogs/up.json'),
    path.join(__dirname, '../public/updatelogs/up.json'),
    path.join(__dirname, '../.origin/up.json')
  ]
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'))
      }
    } catch {}
  }
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

function createTray() {
  try {
    const iconPath = path.join(__dirname, '../src-tauri/icons/icon.png')
    tray = new Tray(iconPath)
    const contextMenu = ElectronMenu.buildFromTemplate([
      { label: '显示主窗口', click: () => { if (win) { win.show(); win.focus() } } },
      { type: 'separator' },
      { label: '退出', click: () => { quitting = true; app.quit() } }
    ])
    tray.setToolTip('Cyreneの随机点名器')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => { if (win) { win.show(); win.focus() } })
  } catch (e) {
    console.error('[tray] failed to create:', e.message)
  }
}

app.whenReady().then(async () => {
  await initStore()
  createWindow()
  createTray()
})
// 后台常驻：窗口关闭后进程不退出（由托盘管理退出）
app.on('window-all-closed', () => {})
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
