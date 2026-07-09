import { ref } from 'vue'
import { APP_VERSION } from './version'
import { tauriAPI, isTauri } from './tauriAPI'

const GITHUB_REPO = 'Cyrene2008/CyreneNameRoller'
const FALLBACK_URLS = [
  `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  `https://api.kkgithub.com/repos/${GITHUB_REPO}/releases/latest`
]

export const updateState = ref({
  available: false,
  checking: false,
  version: '',
  url: '',
  body: '',
  error: null
})

function getPlatform() {
  if (isTauri()) return 'tauri-win64'
  if (typeof window !== 'undefined' && window.electronAPI) return 'electron-win64'
  return 'web'
}

function normalizeVersion(v) {
  return v.replace(/^v/i, '').trim()
}

async function fetchRelease() {
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
    updateState.value = { available: false, checking: false, version: '', url: '', body: '', error: '无法连接到更新服务器' }
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
      available: true, checking: false,
      version: release.tag_name,
      url: targetAsset ? targetAsset.browser_download_url : release.html_url,
      body: release.body || '', error: null
    }
  } else {
    updateState.value = { available: false, checking: false, version: '', url: '', body: '', error: null }
    if (!silent) updateState.value.error = '已是最新版本'
  }
}

export async function downloadUpdate() {
  if (!updateState.value.url) return
  if (isTauri()) {
    await tauriAPI.openExternal(updateState.value.url)
  } else {
    window.open(updateState.value.url, '_blank')
  }
}
