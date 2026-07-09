export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

export const safeStorage = {
  async get(key) {
    if (isElectron()) {
      try {
        const val = await window.electronAPI.storageGet(key)
        return val !== null && val !== undefined ? val : null
      } catch (e) {
        console.warn(`[safeStorage] get failed for "${key}":`, e)
      }
    }
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  async set(key, value) {
    if (isElectron()) {
      try {
        await window.electronAPI.storageSet(key, value)
      } catch (e) {
        console.warn(`[safeStorage] set failed for "${key}":`, e)
      }
    }
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  },

  async remove(key) {
    if (isElectron()) {
      try { await window.electronAPI.storageDelete(key) } catch {}
    }
    try { localStorage.removeItem(key) } catch {}
  },

  async clear() {
    if (isElectron()) {
      try { await window.electronAPI.storageClear() } catch {}
    }
    try { localStorage.clear() } catch {}
  }
}
