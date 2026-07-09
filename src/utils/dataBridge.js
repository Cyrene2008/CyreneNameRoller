import { isElectron } from './safeStorage'

export const dataBridge = {
  async load(key) {
    // electron-store 或 localStorage
    if (isElectron()) {
      try {
        const val = await window.electronAPI.storageGet(key)
        if (val !== null && val !== undefined) return val
      } catch (e) {
        console.warn(`[dataBridge] load failed for "${key}":`, e)
      }
    }
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  async save(key, data) {
    // 写入 electron-store（Electron）或 localStorage（Web）
    if (isElectron()) {
      try {
        await window.electronAPI.storageSet(key, data)
      } catch (e) {
        console.warn(`[dataBridge] save failed for "${key}":`, e)
      }
    }
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {}
  },

  async clearAll() {
    if (isElectron()) {
      try { await window.electronAPI.storageClear() } catch {}
    }
    try { localStorage.clear() } catch {}
  },

  async loadNames() {
    if (isElectron()) {
      try {
        const result = await window.electronAPI.loadNames()
        if (result && result.names) return result
      } catch {}
    }
    try {
      const res = await fetch('./names.json')
      return await res.json()
    } catch {
      return { names: [] }
    }
  },

  async loadChangelog() {
    if (isElectron()) {
      try {
        const result = await window.electronAPI.loadChangelog()
        if (Array.isArray(result)) return result
      } catch {}
    }
    try {
      const res = await fetch('./updatelogs/up.json')
      return await res.json()
    } catch {
      try {
        const res = await fetch('./up.json')
        return await res.json()
      } catch {
        return []
      }
    }
  },

  async exportData() {
    if (isElectron()) {
      try { return await window.electronAPI.exportData() } catch {}
    }
    const allData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      try { allData[key] = JSON.parse(localStorage.getItem(key)) } catch {}
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'cyrene-data.cyrene'; a.click()
    URL.revokeObjectURL(url)
    return { success: true }
  },

  async importData() {
    if (isElectron()) {
      try { return await window.electronAPI.importData() } catch {}
    }
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'; input.accept = '.cyrene,.json'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) { resolve({ success: false, cancelled: true }); return }
        try {
          const data = JSON.parse(await file.text())
          for (const [k, v] of Object.entries(data)) localStorage.setItem(k, JSON.stringify(v))
          resolve({ success: true })
        } catch { resolve({ success: false, error: 'Parse error' }) }
      }
      input.click()
    })
  }
}
