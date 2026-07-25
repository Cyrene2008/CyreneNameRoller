import { isTauri, tauriAPI } from './tauriAPI'
import { decryptCyreneData, encryptCyreneData } from './cyreneCrypto'

export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

function isBrowser() {
  return !isTauri() && !isElectron()
}

export const dataBridge = {
  async load(key) {
    // Tauri
    if (isTauri()) {
      try {
        const val = await tauriAPI.storageGet(key)
        if (val !== null && val !== undefined) return val
      } catch (e) {
        console.warn(`[dataBridge] Tauri load failed for "${key}":`, e)
      }
    }

    // Electron
    if (isElectron()) {
      try {
        const val = await window.electronAPI.storageGet(key)
        if (val !== null && val !== undefined) return val
      } catch (e) {
        console.warn(`[dataBridge] Electron load failed for "${key}":`, e)
      }
    }

    // Browser fallback
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  async save(key, data) {
    // Tauri
    if (isTauri()) {
      try { await tauriAPI.storageSet(key, data) } catch (e) {
        console.warn(`[dataBridge] Tauri save failed for "${key}":`, e)
      }
    }

    // Electron
    if (isElectron()) {
      try { await window.electronAPI.storageSet(key, data) } catch (e) {
        console.warn(`[dataBridge] Electron save failed for "${key}":`, e)
      }
    }

    // Browser fallback
    try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
  },

  async clearAll() {
    if (isTauri()) {
      try { await tauriAPI.storageClear() } catch {}
    }
    if (isElectron()) {
      try { await window.electronAPI.storageClear() } catch {}
    }
    try { localStorage.clear() } catch {}
  },

  async loadNames() {
    if (isTauri()) {
      try {
        const result = await tauriAPI.loadNames()
        if (result && result.names) return result
      } catch {}
    }
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
    if (isTauri()) {
      try {
        const result = await tauriAPI.loadChangelog()
        if (Array.isArray(result)) return result
      } catch {}
    }
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
    if (isTauri()) {
      try {
        const encoded = await tauriAPI.exportEncryptedData()
        if (!encoded) return { success: false, error: '无法导出加密数据' }
        downloadEncryptedFile(base64ToBytes(encoded))
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }

    // Browser fallback: keep the same encrypted container format.
    const allData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      try { allData[key] = JSON.parse(localStorage.getItem(key)) } catch {}
    }
    downloadEncryptedFile(await encryptCyreneData(allData))
    return { success: true }
  },

  async importData() {
    if (isElectron()) {
      try { return await window.electronAPI.importData() } catch {}
    }
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'; input.accept = '.cyrene'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) { resolve({ success: false, cancelled: true }); return }
        try {
          const bytes = new Uint8Array(await file.arrayBuffer())
          if (isTauri()) {
            const result = await tauriAPI.importEncryptedData(bytesToBase64(bytes))
            if (result !== true) throw new Error('导入失败')
          } else {
            const data = await decryptCyreneData(bytes)
            for (const [k, v] of Object.entries(data)) {
              localStorage.setItem(k, JSON.stringify(v))
            }
          }
          resolve({ success: true })
        } catch (error) { resolve({ success: false, error: error.message || 'Parse error' }) }
      }
      input.click()
    })
  }
}

function downloadEncryptedFile(bytes) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'cyrene-data.cyrene'; a.click()
  URL.revokeObjectURL(url)
}

function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}
