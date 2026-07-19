const { app, BrowserWindow, ipcMain, dialog, shell, net, Tray, Menu: ElectronMenu } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const os = require('os')

let win
let floatingWin
let tray
let store
let windowStateStore
let tray = null
let quitting = false
const isDev = !app.isPackaged
const UPDATE_PROXY_BASE = 'https://gh.xn--8hvv1o.cn/'
const UPDATE_URL_PREFIX = 'https://github.com/Cyrene2008/CyreneNameRoller/releases/download/'
const MIN_INSTALLER_SIZE = 1024 * 1024
const MAX_UPDATE_REDIRECTS = 8

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

  // 关闭时最小化到托盘
  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('Cyreneの随机点名器')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => { if (win && !win.isDestroyed()) { win.show(); win.focus() } } },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit() } }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    if (win && !win.isDestroyed()) { win.show(); win.focus() }
  })
}

// 窗口控制
ipcMain.on('window-minimize', () => win.minimize())
ipcMain.on('window-maximize', () => { win.isMaximized() ? win.unmaximize() : win.maximize() })
ipcMain.on('window-close', () => win.close())
ipcMain.on('window-hide', () => win.hide())
ipcMain.handle('window-is-maximized', () => win.isMaximized())

// 悬浮窗拖拽
let dragWin = null
let dragStartPos = null

ipcMain.handle('window-drag-start', (event) => {
  dragWin = BrowserWindow.fromWebContents(event.sender)
  if (dragWin && !dragWin.isDestroyed()) {
    dragStartPos = dragWin.getPosition()
    return [Math.round(dragStartPos[0]), Math.round(dragStartPos[1])]
  }
  return [0, 0]
})

ipcMain.handle('window-drag-move', (_, dx, dy) => {
  if (!dragWin || dragWin.isDestroyed() || !dragStartPos) return
  dragWin.setPosition(
    Math.round(dragStartPos[0] + dx),
    Math.round(dragStartPos[1] + dy)
  )
  return true
})

ipcMain.handle('window-drag-end', () => {
  dragWin = null
  dragStartPos = null
  return true
})

ipcMain.on('open-floating-window', () => {
  if (floatingWin && !floatingWin.isDestroyed()) {
    floatingWin.show()
    floatingWin.focus()
    return
  }
  floatingWin = new BrowserWindow({
    width: 64, height: 64,
    alwaysOnTop: true, frame: false, resizable: false,
    skipTaskbar: true,
    transparent: true,
    hasShadow: false,
    roundedCorners: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  if (isDev) {
    floatingWin.loadURL('http://localhost:5173/#/floating')
  } else {
    floatingWin.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/floating' })
  }
})

ipcMain.on('close-floating-window', () => {
  if (floatingWin && !floatingWin.isDestroyed()) floatingWin.close()
})

ipcMain.on('focus-main-window', () => {
  if (win && !win.isDestroyed()) { win.show(); win.focus() }
})

ipcMain.on('minimize-main-window', () => {
  if (win && !win.isDestroyed()) win.minimize()
})

ipcMain.handle('open-external', (_, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url)
  }
})

function sanitizeInstallerName(fileName) {
  const safeName = path.basename(String(fileName || 'update.exe'))
  return safeName.toLowerCase().endsWith('.exe') ? safeName : `${safeName}.exe`
}

function removeFileIfPresent(filePath) {
  try { fs.unlinkSync(filePath) } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

function downloadToFile(url, targetPath, onProgress, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    let parsedUrl
    try {
      parsedUrl = new URL(url)
      if (parsedUrl.protocol !== 'https:') throw new Error('仅允许 HTTPS 更新地址')
    } catch (error) {
      reject(error)
      return
    }

    const request = https.get(parsedUrl, {
      headers: {
        'User-Agent': 'CyreneNameRoller',
        'Accept': 'application/octet-stream'
      }
    }, response => {
      const status = response.statusCode || 0
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume()
        if (redirectCount >= MAX_UPDATE_REDIRECTS) {
          reject(new Error('更新下载重定向次数过多'))
          return
        }
        const redirectedUrl = new URL(response.headers.location, parsedUrl).toString()
        resolve(downloadToFile(redirectedUrl, targetPath, onProgress, redirectCount + 1))
        return
      }
      if (status !== 200) {
        response.resume()
        reject(new Error(`更新服务器返回 HTTP ${status}`))
        return
      }

      const contentType = String(response.headers['content-type'] || '').toLowerCase()
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        response.resume()
        reject(new Error(`更新服务器返回了非安装程序内容 (${contentType || 'unknown'})`))
        return
      }

      const declaredSize = Number(response.headers['content-length']) || 0
      let receivedSize = 0
      let settled = false
      const output = fs.createWriteStream(targetPath, { flags: 'w' })

      const fail = error => {
        if (settled) return
        settled = true
        response.destroy()
        output.destroy()
        reject(error)
      }

      response.on('data', chunk => {
        receivedSize += chunk.length
        if (declaredSize > 0) onProgress(Math.min(99, Math.round((receivedSize / declaredSize) * 100)))
      })
      response.on('error', fail)
      output.on('error', fail)
      output.on('finish', () => {
        output.close(error => {
          if (settled) return
          if (error) {
            fail(error)
            return
          }
          settled = true
          resolve(receivedSize)
        })
      })
      response.pipe(output)
    })

    request.setTimeout(30000, () => request.destroy(new Error('更新下载连接超时')))
    request.on('error', reject)
  })
}

function validateInstaller(filePath, expectedSize) {
  const stat = fs.statSync(filePath)
  if (expectedSize > 0 && stat.size !== expectedSize) {
    throw new Error(`安装程序不完整：应为 ${expectedSize} 字节，实际为 ${stat.size} 字节`)
  }
  if (stat.size < MIN_INSTALLER_SIZE) {
    throw new Error(`安装程序体积异常：仅 ${stat.size} 字节`)
  }
  const descriptor = fs.openSync(filePath, 'r')
  try {
    const header = Buffer.alloc(2)
    fs.readSync(descriptor, header, 0, 2, 0)
    if (header[0] !== 0x4d || header[1] !== 0x5a) {
      throw new Error('安装程序文件头无效，不是 Windows PE 文件')
    }
  } finally {
    fs.closeSync(descriptor)
  }
}

async function downloadInstaller(originalUrl, fileName, expectedSize, onProgress) {
  if (!String(originalUrl).startsWith(UPDATE_URL_PREFIX)) {
    throw new Error('更新地址不属于 CyreneNameRoller 官方发布源')
  }
  const updateDir = path.join(app.getPath('temp'), 'CyreneNameRoller-Update')
  fs.mkdirSync(updateDir, { recursive: true })
  const finalPath = path.join(updateDir, sanitizeInstallerName(fileName))
  const partialPath = `${finalPath}.part`
  const urls = [`${UPDATE_PROXY_BASE}${originalUrl}`, originalUrl]
  const failures = []

  for (const url of urls) {
    try {
      removeFileIfPresent(partialPath)
      onProgress(0)
      await downloadToFile(url, partialPath, onProgress)
      validateInstaller(partialPath, expectedSize)
      removeFileIfPresent(finalPath)
      fs.renameSync(partialPath, finalPath)
      onProgress(100)
      return finalPath
    } catch (error) {
      failures.push(error.message)
      removeFileIfPresent(partialPath)
    }
  }
  throw new Error(failures.join('；') || '安装程序下载失败')
}

ipcMain.handle('download-and-launch-update', async (event, originalUrl, fileName, expectedSize) => {
  try {
    const sendProgress = progress => {
      if (!event.sender.isDestroyed()) event.sender.send('update-download-progress', progress)
    }
    const filePath = await downloadInstaller(originalUrl, fileName, Number(expectedSize) || 0, sendProgress)
    const launchError = await shell.openPath(filePath)
    if (launchError) throw new Error(`无法启动安装程序：${launchError}`)
    setTimeout(() => {
      quitting = true
      app.quit()
    }, 1500)
    return { success: true, filePath, size: fs.statSync(filePath).size }
  } catch (error) {
    return { success: false, error: error.message }
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
