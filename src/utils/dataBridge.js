export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

// 待写入队列（关闭前刷新）
const pendingWrites = new Map()

// 页面关闭前刷新所有待写入数据
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    for (const [key, data] of pendingWrites) {
      try { localStorage.setItem(`db_${key}`, JSON.stringify(data)) } catch {}
      if (isElectron()) {
        try {
          // 使用 navigator.sendBeacon 或同步 XHR 无法用于 IPC，所以用 localStorage 兜底
          // 下次启动时 load 会从 localStorage 恢复到文件系统
        } catch {}
      }
    }
    pendingWrites.clear()
  })
}

export const dataBridge = {
  async load(key) {
    let result = null

    if (isElectron()) {
      try {
        result = await window.electronAPI.loadData(key)
      } catch (e) {
        console.warn(`[dataBridge] Electron load failed for "${key}":`, e)
      }
    }

    if (result !== null && result !== undefined) {
      try { localStorage.setItem(`db_${key}`, JSON.stringify(result)) } catch {}
      return result
    }

    try {
      const raw = localStorage.getItem(`db_${key}`)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        if (isElectron() && parsed !== null) {
          try { await window.electronAPI.saveData(key, parsed) } catch {}
        }
        return parsed
      }
    } catch {}

    return null
  },

  async save(key, data) {
    // 立即写入 localStorage
    try { localStorage.setItem(`db_${key}`, JSON.stringify(data)) } catch {}

    // 异步写入文件系统
    if (isElectron()) {
      try {
        pendingWrites.delete(key)
        const ok = await window.electronAPI.saveData(key, data)
        if (!ok) console.warn(`[dataBridge] save returned false for "${key}"`)
      } catch (e) {
        console.warn(`[dataBridge] save failed for "${key}":`, e)
      }
    }

    return true
  },

  async clearAll() {
    // 清除 localStorage 中所有 db_ 前缀的 key
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('db_')) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    pendingWrites.clear()

    // 清除文件系统
    if (isElectron()) {
      try { await window.electronAPI.clearAllData() } catch {}
    }

    return true
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
      const res = await fetch('./up.json')
      return await res.json()
    } catch {
      return []
    }
  },

  async exportData() {
    if (isElectron()) {
      try { return await window.electronAPI.exportData() } catch {}
    }
    const allData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('db_')) {
        try { allData[key.replace('db_', '')] = JSON.parse(localStorage.getItem(key)) } catch {}
      }
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
          const text = await file.text()
          const data = JSON.parse(text)
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(`db_${key}`, JSON.stringify(value))
          }
          resolve({ success: true })
        } catch {
          resolve({ success: false, error: 'Parse error' })
        }
      }
      input.click()
    })
  }
}
