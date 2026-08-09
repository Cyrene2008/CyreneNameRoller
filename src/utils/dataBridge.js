import { isTauri, tauriAPI } from './tauriAPI'
import { decryptCyreneData, encryptCyreneData } from './cyreneCrypto'
import { emitFileNotice } from './desktopFiles'

const TAURI_CORE_INPUT_KEYS = new Set(['lists', 'currentListId', 'balance'])

export const dataBridge = {
  async load(key) {
    // Tauri
    if (isTauri()) {
      try {
        const val = await tauriAPI.storageGet(key)
        return val ?? null
      } catch (e) {
        console.warn(`[dataBridge] Tauri load failed for "${key}":`, e)
        return null
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
      const result = TAURI_CORE_INPUT_KEYS.has(key)
        ? await tauriAPI.coreStateSet(key, data)
        : await tauriAPI.storageSet(key, data)
      if (result === true || result?.success === true) return result
      throw Object.assign(new Error(result?.error || `Tauri save failed for "${key}"`), { code: result?.code || 'CORE_TRANSACTION_REJECTED' })
    }

    // Browser fallback
    try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
  },

  async clearAll() {
    if (isTauri()) {
      return tauriAPI.coreMaintenanceExecute('reset-all')
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
    if (isTauri()) {
      try {
        const result = await tauriAPI.exportDataFile()
        return result
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
    if (isTauri()) {
      try {
        const result = await tauriAPI.importDataFile()
        if (result?.success && result.filePath) emitFileNotice(`程序数据已导入：${result.filePath}`, result.filePath)
        return result
      } catch (error) { return { success: false, error: error.message } }
    }
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'; input.accept = '.cyrene'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) { resolve({ success: false, cancelled: true }); return }
        try {
          const bytes = new Uint8Array(await file.arrayBuffer())
          const data = await decryptCyreneData(bytes)
          for (const [k, v] of Object.entries(data)) {
            localStorage.setItem(k, JSON.stringify(v))
          }
          resolve({ success: true })
        } catch (error) { resolve({ success: false, error: error.message || 'Parse error' }) }
      }
      input.click()
    })
  },

  async importDataBytes(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
    if (isTauri()) {
      try {
        const success = await tauriAPI.importEncryptedData(bytesToBase64(bytes))
        return { success: !!success }
      } catch (error) {
        return { success: false, error: error.message || String(error) }
      }
    }
    try {
      const values = await decryptCyreneData(bytes)
      localStorage.clear()
      for (const [key, value] of Object.entries(values)) {
        localStorage.setItem(key, JSON.stringify(value))
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Parse error' }
    }
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
