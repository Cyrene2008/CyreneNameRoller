import { ref } from 'vue'
import { APP_VERSION } from './version'
import { tauriAPI, isTauri } from './tauriAPI'

const GITHUB_REPO = 'Cyrene2008/CyreneNameRoller'
const GHPROXY_BASE = 'https://gh.昔涟.cn/'
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
  fileSize: 0,
  body: '',
  error: null
})

export function getPlatform() {
  if (isTauri()) return 'tauri-win64'
  if (typeof window !== 'undefined' && window.electronAPI) return 'electron-win64'
  return 'web'
}

export function findPlatformAsset(assets, platform = getPlatform()) {
  const platformName = platform.startsWith('tauri')
    ? 'tauri'
    : platform.startsWith('electron') ? 'electron' : ''
  if (!platformName) return null

  return (assets || []).find(asset => {
    const name = String(asset?.name || '').toLowerCase()
    const isWin64 = name.includes('win64') || name.includes('x64')
    return name.endsWith('.exe') && name.includes(platformName) && isWin64
  }) || null
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
    const targetAsset = findPlatformAsset(assets, platform)
    updateState.value = {
      available: true, checking: false, downloading: false, downloadProgress: 0,
      version: release.tag_name,
      url: targetAsset ? targetAsset.browser_download_url : release.html_url,
      fileName: targetAsset ? targetAsset.name : '',
      fileSize: targetAsset ? targetAsset.size : 0,
      body: release.body || '', error: null
    }
    if (bannerFn) {
      const sizeMB = targetAsset ? (targetAsset.size / 1024 / 1024).toFixed(1) : ''
      const sizeText = sizeMB ? ` (${sizeMB} MB)` : ''
      bannerFn({
        message: `发现新版本 ${release.tag_name}${sizeText}`,
        icon: 'arrow-download-16-regular',
        type: 'info',
        duration: 0,
        dismissible: true
      })
    }
  } else {
    updateState.value = { available: false, checking: false, downloading: false, downloadProgress: 0, version: '', url: '', fileName: '', body: '', error: null }
    if (!silent && bannerFn) {
      bannerFn({ message: '已是最新版本', icon: 'checkmark-circle-16-regular', type: 'success', duration: 8000 })
    }
  }
}

export async function downloadUpdate(bannerFn = null) {
  if (!updateState.value.url) return

  const originalUrl = updateState.value.url
  const fileName = updateState.value.fileName
  const expectedSize = Number(updateState.value.fileSize) || 0
  const downloadUrl = getDownloadUrl(originalUrl)

  if (!isTauri() && !window.electronAPI) {
    window.open(downloadUrl, '_blank')
    return
  }

  if (!fileName || !fileName.toLowerCase().endsWith('.exe')) {
    if (isTauri()) await tauriAPI.openExternal(originalUrl)
    else await window.electronAPI.openExternal(originalUrl)
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
      duration: 0,
      dismissible: false,
      progress: 0
    })
  }

  let removeProgressListener = null
  try {
    let result
    if (window.electronAPI?.downloadAndLaunchUpdate) {
      if (window.electronAPI.onUpdateDownloadProgress) {
        removeProgressListener = window.electronAPI.onUpdateDownloadProgress(progress => {
          updateState.value.downloadProgress = progress
          if (bannerHandle) bannerHandle.update({ progress })
        })
      }
      result = await window.electronAPI.downloadAndLaunchUpdate(originalUrl, fileName, expectedSize)
    } else if (isTauri()) {
      if (bannerHandle) bannerHandle.update({ progress: 5 })
      result = await tauriAPI.downloadAndLaunchUpdate(originalUrl, fileName, expectedSize)
    }

    if (!result?.success) throw new Error(result?.error || '原生更新程序未能启动')

    updateState.value.downloadProgress = 100
    if (bannerHandle) {
      bannerHandle.update({ message: '安装程序已验证并启动，应用即将退出', icon: 'checkmark-circle-16-regular', type: 'success', progress: 100, duration: 8000 })
    }
  } catch (error) {
    console.error('Download failed:', error)
    updateState.value.downloadProgress = 0
    if (bannerHandle) {
      bannerHandle.update({ message: `更新失败：${error?.message || error}`, icon: 'warning-16-regular', type: 'warning', progress: 0, duration: 8000 })
    }
  } finally {
    if (typeof removeProgressListener === 'function') removeProgressListener()
    updateState.value.downloading = false
  }
}
