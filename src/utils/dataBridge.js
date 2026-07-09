export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

export const dataBridge = {
  async load(key) {
    let result = null

    // 1. 尝试从 Electron 文件系统加载
    if (isElectron()) {
      try {
        result = await window.electronAPI.loadData(key)
      } catch (e) {
        console.warn(`[dataBridge] Electron load failed for "${key}":`, e)
      }
    }

    // 2. 如果文件系统有数据，备份到 localStorage
    if (result !== null && result !== undefined) {
      try { localStorage.setItem(`db_${key}`, JSON.stringify(result)) } catch {}
      return result
    }

    // 3. 文件系统没有，从 localStorage 读取（首次运行或文件系统故障时的回退）
    try {
      const raw = localStorage.getItem(`db_${key}`)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        // 如果 localStorage 有数据但文件系统没有，写回文件系统
        if (isElectron() && parsed !== null) {
          try { await window.electronAPI.saveData(key, parsed) } catch {}
        }
        return parsed
      }
    } catch {}

    return null
  },

  async save(key, data) {
    // 同时写入 localStorage（即时生效）和 Electron 文件系统（持久化）
    try { localStorage.setItem(`db_${key}`, JSON.stringify(data)) } catch (e) {
      console.warn(`[dataBridge] localStorage save failed for "${key}":`, e)
    }

    if (isElectron()) {
      try {
        const ok = await window.electronAPI.saveData(key, data)
        if (!ok) {
          console.warn(`[dataBridge] Electron save returned false for "${key}"`)
        }
      } catch (e) {
        console.warn(`[dataBridge] Electron save failed for "${key}":`, e)
      }
    }

    return true
  },

  async loadNames() {
    if (isElectron()) {
      try {
        const result = await window.electronAPI.loadNames()
        if (result && result.names) return result
      } catch (e) {
        console.warn('[dataBridge] Electron loadNames failed:', e)
      }
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
    // 浏览器模式: 从 localStorage 导出
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
