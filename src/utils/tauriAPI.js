export function isTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

export const tauriAPI = {
  async invoke(cmd, args) {
    if (!isTauri()) return null
    try {
      return await window.__TAURI_INTERNALS__.invoke(cmd, args)
    } catch (e) {
      console.warn(`[tauri] invoke "${cmd}" failed:`, e)
      return null
    }
  },
  async storageGet(key) { return this.invoke('storage_get', { key }) },
  async storageSet(key, value) { return this.invoke('storage_set', { key, value }) },
  async storageDelete(key) { return this.invoke('storage_delete', { key }) },
  async storageClear() { return this.invoke('storage_clear', {}) },
  async loadNames() { return this.invoke('load_names', {}) },
  async loadChangelog() { return this.invoke('load_changelog', {}) },
  async openExternal(url) { return this.invoke('open_external', { url }) },
  async checkUpdate() { return this.invoke('check_update', {}) },
  async fetchAnnouncements() { return this.invoke('fetch_announcements', {}) },
  async downloadAndLaunchUpdate(url, fileName, expectedSize) {
    if (!isTauri()) return null
    return window.__TAURI_INTERNALS__.invoke('download_and_launch_update', {
      url,
      file_name: fileName,
      expected_size: expectedSize
    })
  }
}
