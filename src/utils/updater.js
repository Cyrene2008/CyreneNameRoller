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

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

export async function fetchRelease() {
  if (typeof window !== 'undefined' && window.electronAPI?.checkUpdate) {
    const result = await window.electronAPI.checkUpdate()
    if (result?.ok && result.data) return result.data
    throw new Error(result?.error || 'update check failed')
  }
  if (isTauri()) {
    const data = await tauriAPI.checkUpdate()
    if (data) return data
    throw new Error('tauri update check failed')
  }
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

export async function checkForUpdates(silent = true, bannerFn = null) {
  if (updateState.value.checking || updateState.value.downloading) return
  updateState.value.checking = true
  updateState.value.error = null

  let release = null
  try {
    release = await fetchRelease()
  } catch {}

  if (!release) {
    updateState.value = { available: false, checking: false, downloading: false, downloadProgress: 0, version: '', url: '', fileName: '', body: '', error: '无法连接到更新服务器' }
    if (bannerFn) bannerFn({ message: '无法连接到更新服务器', icon: 'warning-16-regular', type: 'warning', duration: 3000 })
    return
  }

  const remoteVersion = normalizeVersion(release.tag_name)
  const currentVersion = normalizeVersion(APP_VERSION)

  if (compareVersions(remoteVersion, currentVersion) > 0) {
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
    if (bannerFn) {
      bannerFn({
        message: `发现新版本 ${release.tag_name}`,
        icon: 'arrow-download-16-regular',
        type: 'info',
        duration: 0,
        dismissible: true
      })
    }
  } else {
    updateState.value = { available: false, checking: false, downloading: false, downloadProgress: 0, version: '', url: '', fileName: '', body: '', error: null }
    if (!silent && bannerFn) {
      bannerFn({ message: '已是最新版本', icon: 'checkmark-circle-16-regular', type: 'success', duration: 3000 })
    }
  }
}

export async function downloadUpdate(bannerFn = null) {
  if (!updateState.value.url) return

  const originalUrl = updateState.value.url
  const downloadUrl = getDownloadUrl(originalUrl)

  if (!isTauri() && !window.electronAPI) {
    window.open(downloadUrl, '_blank')
    return
  }

  updateState.value.downloading = true
  updateState.value.downloadProgress = 0

  let bannerHandle = null
  if (bannerFn) {
    bannerHandle = bannerFn({
      message: `正在下载新版本: ${updateState.value.version}`,
      icon: 'arrow-download-16-regular',
      type: 'download',
      dismissible: false,
      progress: 0
    })
  }

  try {
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
        const pct = Math.round((receivedLength / total) * 100)
        updateState.value.downloadProgress = pct
        if (bannerHandle) bannerHandle.update({ progress: pct })
      }
    }

    const allChunks = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }

    const blob = new Blob([allChunks])
    saveBlob(blob, updateState.value.fileName || 'update.exe')

    if (bannerHandle) {
      bannerHandle.update({ message: '下载完成，请手动运行安装程序', icon: 'checkmark-circle-16-regular', type: 'success', progress: 100, dismissible: true })
      setTimeout(() => bannerHandle.dismiss(), 5000)
    }

    updateState.value.downloading = false
    updateState.value.downloadProgress = 100
  } catch (error) {
    console.error('Download failed:', error)
    updateState.value.downloading = false
    updateState.value.downloadProgress = 0
    if (bannerHandle) {
      bannerHandle.update({ message: '下载失败，正在尝试备用链接...', icon: 'warning-16-regular', type: 'warning', progress: 0, dismissible: true })
      setTimeout(() => bannerHandle.dismiss(), 3000)
    }
    if (isTauri()) {
      await tauriAPI.openExternal(originalUrl)
    } else if (window.electronAPI) {
      window.electronAPI.openExternal(originalUrl)
    } else {
      window.open(originalUrl, '_blank')
    }
  }
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
