import { ref } from 'vue'
import { APP_VERSION } from './version'
import { tauriAPI, isTauri } from './tauriAPI'

const GITHUB_REPO = 'Cyrene2008/CyreneNameRoller'
const GHPROXY_BASE = 'https://gh.xn--8hvv1o.cn/'
const FALLBACK_URLS = [
  `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  `https://api.kkgithub.com/repos/${GITHUB_REPO}/releases/latest`
]

export const updateState = ref({
  available: false,
  checking: false,
  downloading: false,
  downloadProgress: 0,
  version: '',
  url: '',
  fileName: '',
  body: '',
  error: null
})

export function getPlatform() {
  if (isTauri()) return 'tauri-win64'
  if (typeof window !== 'undefined' && window.electronAPI) return 'electron-win64'
  return 'web'
}

function normalizeVersion(v) {
  return v.replace(/^v/i, '').trim()
}

function getDownloadUrl(originalUrl) {
  if (!originalUrl) return ''
  return GHPROXY_BASE + originalUrl
}

export async function fetchRelease() {
  // Electron: 通过主进程 IPC
  if (typeof window !== 'undefined' && window.electronAPI?.checkUpdate) {
    const result = await window.electronAPI.checkUpdate()
    if (result?.ok && result.data) return result.data
    throw new Error(result?.error || 'update check failed')
  }
  // Tauri: 通过 Rust 后端
  if (isTauri()) {
    const data = await tauriAPI.checkUpdate()
    if (data) return data
    throw new Error('tauri update check failed')
  }
  // Web fallback: 直接 fetch
  for (const url of FALLBACK_URLS) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10000)
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: ctrl.signal
      })
      clearTimeout(timer)
      if (resp.ok) return await resp.json()
    } catch {}
  }
  throw new Error('all sources failed')
}

export async function checkForUpdates(silent = true) {
  if (updateState.value.checking) return
  updateState.value.checking = true
  updateState.value.error = null

  let release = null
  try {
    release = await fetchRelease()
  } catch {}

  if (!release) {
    updateState.value = { available: false, checking: false, downloading: false, downloadProgress: 0, version: '', url: '', fileName: '', body: '', error: '无法连接到更新服务器' }
    return
  }

  const remoteVersion = normalizeVersion(release.tag_name)
  const currentVersion = normalizeVersion(APP_VERSION)

  if (remoteVersion !== currentVersion) {
    const platform = getPlatform()
    const assets = release.assets || []
    let targetAsset = null
    if (platform === 'tauri-win64') {
      targetAsset = assets.find(a => a.name.includes('Tauri') && a.name.endsWith('.exe'))
    } else if (platform === 'electron-win64') {
      targetAsset = assets.find(a => a.name.includes('electron-win64') && a.name.endsWith('.exe'))
    }
    updateState.value = {
      available: true, checking: false, downloading: false, downloadProgress: 0,
      version: release.tag_name,
      url: targetAsset ? targetAsset.browser_download_url : release.html_url,
      fileName: targetAsset ? targetAsset.name : '',
      body: release.body || '', error: null
    }
  } else {
    updateState.value = { available: false, checking: false, downloading: false, downloadProgress: 0, version: '', url: '', fileName: '', body: '', error: null }
    if (!silent) updateState.value.error = '已是最新版本'
  }
}

export async function downloadUpdate() {
  if (!updateState.value.url) return

  const originalUrl = updateState.value.url
  const downloadUrl = getDownloadUrl(originalUrl)

  // 如果是网页端，直接打开浏览器
  if (!isTauri() && !window.electronAPI) {
    window.open(downloadUrl, '_blank')
    return
  }

  updateState.value.downloading = true
  updateState.value.downloadProgress = 0

  try {
    // 使用fetch下载文件
    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error('Download failed')

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    const reader = response.body.getReader()
    const chunks = []
    let receivedLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      receivedLength += value.length
      if (total > 0) {
        updateState.value.downloadProgress = Math.round((receivedLength / total) * 100)
      }
    }

    // 合并chunks
    const allChunks = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }

    // 创建Blob并下载
    const blob = new Blob([allChunks])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = updateState.value.fileName || 'update.exe'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    updateState.value.downloading = false
    updateState.value.downloadProgress = 100
  } catch (error) {
    console.error('Download failed:', error)
    updateState.value.downloading = false
    updateState.value.downloadProgress = 0
    // 如果ghproxy失败，尝试直接使用原始URL
    if (isTauri()) {
      await tauriAPI.openExternal(originalUrl)
    } else if (window.electronAPI) {
      window.electronAPI.openExternal(originalUrl)
    } else {
      window.open(originalUrl, '_blank')
    }
  }
}
