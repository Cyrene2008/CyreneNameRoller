export function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

export const dataBridge = {
  async load(key) {
    if (isElectron()) {
      return await window.electronAPI.loadData(key)
    }
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  async save(key, data) {
    if (isElectron()) {
      return await window.electronAPI.saveData(key, data)
    }
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  },

  async loadNames() {
    if (isElectron()) {
      return await window.electronAPI.loadNames()
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
      return await window.electronAPI.loadChangelog()
    }
    try {
      const res = await fetch('./up.json')
      return await res.json()
    } catch {
      return []
    }
  },

  async exportData() {
    if (isElectron()) {
      return await window.electronAPI.exportData()
    }
    return { success: false, error: 'Not in Electron' }
  },

  async importData() {
    if (isElectron()) {
      return await window.electronAPI.importData()
    }
    return { success: false, error: 'Not in Electron' }
  }
}
