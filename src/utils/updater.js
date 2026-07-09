import { ref } from 'vue'
import { isTauri } from './tauriAPI'
import { isElectron } from './dataBridge'
import { APP_VERSION } from './version'

const GITHUB_REPO = 'Cyrene2008/CyreneNameRoller'
const API_PRIMARY = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
const API_FALLBACK = `https://gh-proxy.com/https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

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
  if (isElectron()) return 'electron-win64'
  return 'web'
}

function normalizeVersion(v) {
  return v.replace(/^v/i, '').trim()
}

async function fetchWithFallback() {
  try {
    const resp = await fetch(API_PRIMARY, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    if (resp.ok) return await resp.json()
  } catch {}

  try {
    const resp = await fetch(API_FALLBACK, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    if (resp.ok) return await resp.json()
  } catch {}

  throw new Error('无法连接到更新服务器')
}

export async function checkForUpdates(silent = true) {
  if (!isTauri() && !isElectron()) return
  if (updateState.value.checking) return

  updateState.value.checking = true
  updateState.value.error = null

  try {
    const release = await fetchWithFallback()
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
        available: true,
        checking: false,
        version: release.tag_name,
        url: targetAsset ? targetAsset.browser_download_url : release.html_url,
        body: release.body || '',
        error: null
      }
    } else {
      updateState.value = { available: false, checking: false, version: '', url: '', body: '', error: null }
      if (!silent) updateState.value.error = '已是最新版本'
    }
  } catch (e) {
    updateState.value = { available: false, checking: false, version: '', url: '', body: '', error: e.message }
  }
}

export async function downloadUpdate() {
  if (!updateState.value.url) return
  window.open(updateState.value.url, '_blank')
}
