import { ref } from 'vue'
import { isTauri } from './tauriAPI'
import { isElectron } from './dataBridge'
import { APP_VERSION } from './version'

const GITHUB_REPO = 'Cyrene2008/CyreneNameRoller'

export const updateState = ref({
  available: false,
  checking: false,
  version: '',
  url: '',
  error: null
})

function getPlatform() {
  if (isTauri()) return 'Tauri'
  if (isElectron()) return 'Electron'
  return null
}

function normalizeVersion(v) {
  return v.replace(/^v/i, '').trim()
}

export async function checkForUpdates() {
  if (!isTauri() && !isElectron()) return
  if (updateState.value.checking) return

  updateState.value.checking = true
  updateState.value.error = null

  try {
    const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })

    if (!resp.ok) throw new Error('Failed to fetch releases')

    const release = await resp.json()
    const remoteVersion = normalizeVersion(release.tag_name)
    const currentVersion = normalizeVersion(APP_VERSION)

    if (remoteVersion !== currentVersion) {
      const platform = getPlatform()
      const assets = release.assets || []

      let targetAsset = null
      if (platform === 'Tauri') {
        targetAsset = assets.find(a => a.name.includes('Tauri') && a.name.endsWith('.exe'))
      } else if (platform === 'Electron') {
        targetAsset = assets.find(a => a.name.includes('Setup') && a.name.endsWith('.exe') && !a.name.includes('Tauri'))
      }

      updateState.value = {
        available: true,
        checking: false,
        version: release.tag_name,
        url: targetAsset ? targetAsset.browser_download_url : release.html_url,
        error: null
      }
    } else {
      updateState.value = { available: false, checking: false, version: '', url: '', error: null }
    }
  } catch (e) {
    updateState.value = { available: false, checking: false, version: '', url: '', error: e.message }
  }
}

export async function downloadUpdate() {
  if (!updateState.value.url) return
  window.open(updateState.value.url, '_blank')
}
