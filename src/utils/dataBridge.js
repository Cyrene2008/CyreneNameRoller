export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI
}

export const dataBridge = {
  async load(key) {
    if (isElectron()) {
      try {
        const result = await window.electronAPI.loadData(key)
        if (result !== null && result !== undefined) {
          localStorage.setItem(`db_${key}`, JSON.stringify(result))
          return result
        }
      } catch {}
    }
    try {
      const raw = localStorage.getItem(`db_${key}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  async save(key, data) {
    try { localStorage.setItem(`db_${key}`, JSON.stringify(data)) } catch {}
    if (isElectron()) {
      try { await window.electronAPI.saveData(key, data) } catch {}
    }
    return true
  },

  async loadNames() {
    if (isElectron()) {
      try { return await window.electronAPI.loadNames() } catch {}
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
      try { return await window.electronAPI.loadChangelog() } catch {}
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
