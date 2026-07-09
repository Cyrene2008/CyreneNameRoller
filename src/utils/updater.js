import { ref } from 'vue'
import { APP_VERSION } from './version'

const GITHUB_REPO = 'Cyrene2008/CyreneNameRoller'
const API_URLS = [
  `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  `https://gh-proxy.com/https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  `https://ghfast.top/https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
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
  if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) return 'tauri-win64'
  if (typeof window !== 'undefined' && window.electronAPI) return 'electron-win64'
  return 'web'
}

function normalizeVersion(v) {
  return v.replace(/^v/i, '').trim()
}

async function fetchWithTimeout(url, timeout = 10000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      signal: ctrl.signal
    })
    clearTimeout(timer)
    if (resp.ok) return await resp.json()
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
  throw new Error('Failed')
}

export async function checkForUpdates(silent = true) {
  if (updateState.value.checking) return
  updateState.value.checking = true
  updateState.value.error = null

  let release = null
  for (const url of API_URLS) {
    try {
      release = await fetchWithTimeout(url)
      break
    } catch {}
  }

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
      targetAsset = assets.find(a => a.name.includes('Setup') && a.name.endsWith('.exe') && !a.name.includes('Tauri'))
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
  window.open(updateState.value.url, '_blank')
}
