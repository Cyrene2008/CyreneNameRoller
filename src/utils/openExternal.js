import { isTauri, tauriAPI } from './tauriAPI'

export function openExternal(url) {
  if (!url) return
  if (isTauri()) {
    tauriAPI.openExternal(url)
  } else if (window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}
