import { isTauri, tauriAPI } from './tauriAPI'

export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

export const safeStorage = {
  async get(key) {
    if (isTauri()) {
      try { return await tauriAPI.storageGet(key) } catch {}
    }
    if (isElectron()) {
      try { return await window.electronAPI.storageGet(key) } catch {}
    }
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  async set(key, value) {
    if (isTauri()) {
      try { await tauriAPI.storageSet(key, value) } catch {}
    }
    if (isElectron()) {
      try { await window.electronAPI.storageSet(key, value) } catch {}
    }
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  },

  async remove(key) {
    if (isTauri()) {
      try { await tauriAPI.storageDelete(key) } catch {}
    }
    if (isElectron()) {
      try { await window.electronAPI.storageDelete(key) } catch {}
    }
    try { localStorage.removeItem(key) } catch {}
  },

  async clear() {
    if (isTauri()) {
      try { await tauriAPI.storageClear() } catch {}
    }
    if (isElectron()) {
      try { await window.electronAPI.storageClear() } catch {}
    }
    try { localStorage.clear() } catch {}
  }
}
