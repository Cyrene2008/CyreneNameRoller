const SAFE_MODE_STORAGE_KEY = 'cyrene:safemode:last'

function frozenStatus(value) {
  return Object.freeze({
    enabled: value.enabled === true,
    source: value.source || 'default',
    stale: value.stale === true,
    errorCode: value.errorCode || '',
    diagnostic: value.diagnostic || '',
    path: value.path || ''
  })
}

export function parseSafeModeConfig(raw, path = '') {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || typeof raw.enabled !== 'boolean') {
    return frozenStatus({ enabled: true, source: 'invalid', errorCode: 'SAFE_MODE_CONFIG_INVALID', diagnostic: 'safemode.json 必须包含布尔值 enabled', path })
  }
  const unknown = Object.keys(raw).find(key => key !== 'enabled' && key !== 'schemaVersion')
  if (unknown || (raw.schemaVersion !== undefined && raw.schemaVersion !== 1)) {
    return frozenStatus({ enabled: true, source: 'invalid', errorCode: 'SAFE_MODE_CONFIG_INVALID', diagnostic: `safemode.json 包含未知字段：${unknown || 'schemaVersion'}`, path })
  }
  return frozenStatus({ enabled: raw.enabled, source: 'file', path })
}

function readHistory(storage) {
  try {
    const value = JSON.parse(storage?.getItem(SAFE_MODE_STORAGE_KEY) || '')
    return value && typeof value.enabled === 'boolean' ? value : null
  } catch { return null }
}

function writeHistory(storage, status) {
  try { storage?.setItem(SAFE_MODE_STORAGE_KEY, JSON.stringify({ enabled: status.enabled, source: 'history' })) } catch {}
}

export async function loadSafeModeStatus({ platform = 'web', fetchImpl = globalThis.fetch, storage = globalThis.localStorage, baseUrl = './', tauriStatus = null } = {}) {
  const path = platform === 'tauri' ? '<appConfigDir>/safemode.json' : new URL('safemode.json', new URL(baseUrl || './', globalThis.location?.href || 'http://localhost/')).href
  if (platform === 'tauri' && typeof tauriStatus === 'function') {
    try {
      const status = await tauriStatus()
      if (status && typeof status.enabled === 'boolean') return frozenStatus({ ...status, path: status.path || path })
    } catch {}
  }
  try {
    const response = await fetchImpl(path, { cache: 'no-store' })
    if (!response?.ok) throw new Error(`HTTP ${response?.status || 0}`)
    const status = parseSafeModeConfig(await response.json(), path)
    if (status.source === 'invalid') return status
    writeHistory(storage, status)
    return status
  } catch (error) {
    const history = readHistory(storage)
    if (history) return frozenStatus({ ...history, source: 'history', stale: true, errorCode: 'SAFE_MODE_CONFIG_UNAVAILABLE', diagnostic: `safemode.json 不可访问：${error.message || error}`, path })
    return frozenStatus({ enabled: false, source: 'default', stale: true, errorCode: 'SAFE_MODE_CONFIG_UNAVAILABLE', diagnostic: `safemode.json 不可访问：${error.message || error}`, path })
  }
}

export function safeModeStorageKey() { return SAFE_MODE_STORAGE_KEY }
