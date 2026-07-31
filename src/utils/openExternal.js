import { isTauri, tauriAPI } from './tauriAPI'

export function openExternal(url) {
  if (!url) return
  if (isTauri()) {
    tauriAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}
