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
  async invokeStrict(cmd, args) {
    if (!isTauri()) throw new Error('Tauri API 不可用')
    return window.__TAURI_INTERNALS__.invoke(cmd, args)
  },
  async storageGet(key) { return this.invoke('storage_get', { key }) },
  async storageSet(key, value) { return this.invoke('storage_set', { key, value }) },
  async storageDelete(key) { return this.invoke('storage_delete', { key }) },
  async storageClear() { return this.invoke('storage_clear', {}) },
  async exportEncryptedData() { return this.invoke('export_encrypted_data', {}) },
  async importEncryptedData(encodedData) { return this.invokeStrict('import_encrypted_data', { encodedData }) },
  async loadNames() { return this.invoke('load_names', {}) },
  async loadChangelog() { return this.invoke('load_changelog', {}) },
  async openExternal(url) { return this.invoke('open_external', { url }) },
  async showDataLocation() { return this.invoke('show_data_location', {}) },
  async setAutoStart(enabled, mode = 'scheduled', previousMode = mode) { return this.invoke('set_auto_start', { enabled, mode, previousMode }) },
  async restartElevatedForAutoStart(enabled, mode = 'scheduled', previousMode = mode) { return this.invoke('restart_elevated_for_auto_start', { enabled, mode, previousMode }) },
  async isProcessElevated() { return this.invoke('is_process_elevated', {}) },
  async isAutoStartLaunch() { return this.invoke('is_autostart_launch', {}) },
  async systemAccent() { return this.invoke('system_accent', {}) },
  async saveTextFile(content, defaultName, extension = 'json') { return this.invoke('save_text_file', { content, defaultName, extension }) },
  async openTextFile(extension = 'json') { return this.invoke('open_text_file', { extension }) },
  async readDroppedFile(path) { return this.invokeStrict('read_dropped_file', { path }) },
  async revealFile(path) { return this.invoke('reveal_file', { path }) },
  async exportDataFile() { return this.invoke('export_data_file', {}) },
  async importDataFile() { return this.invoke('import_data_file', {}) },
  async checkUpdate() { return this.invoke('check_update', {}) },
  async fetchAnnouncements() { return this.invoke('fetch_announcements', {}) },
  async showMainWindow() { return this.invoke('show_main_window', {}) },
  async mainWindowReady() { return this.invoke('main_window_ready', {}) },
  async downloadAndLaunchUpdate(url, fileName, expectedSize, source) {
    if (!isTauri()) return null
    return window.__TAURI_INTERNALS__.invoke('download_and_launch_update', {
      url,
      fileName,
      expectedSize,
      source
    })
  }
}
