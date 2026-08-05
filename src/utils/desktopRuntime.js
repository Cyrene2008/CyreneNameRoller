export function isTauriRuntime() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

function normalizePlatform(platform) {
  if (!platform) return 'unknown'
  const value = platform.toLowerCase()
  if (value.includes('win')) return 'windows'
  if (value.includes('mac')) return 'macos'
  if (value.includes('linux') || value.includes('x11') || (typeof navigator !== 'undefined' && (navigator.platform || '').toLowerCase().includes('linux'))) return 'linux'
  if (value.includes('android')) return 'android'
  if (value.includes('iphone') || value.includes('ipad') || value.includes('ios')) return 'ios'
  return 'unknown'
}

function detectWebPlatform() {
  if (typeof navigator === 'undefined') return 'unknown'
  const source = `${navigator.userAgentData?.platform || ''} ${navigator.platform || ''} ${navigator.userAgent || ''}`
  return normalizePlatform(source)
}

export function getDesktopPlatform() {
  const runtime = isTauriRuntime() ? 'tauri' : 'web'
  const os = detectWebPlatform()
  return Object.freeze({ runtime, os, desktop: runtime === 'tauri' })
}

export function isWindowsTauri(platform = getDesktopPlatform()) {
  return platform.runtime === 'tauri' && platform.os === 'windows'
}

export function isLinuxTauri(platform = getDesktopPlatform()) {
  return platform.runtime === 'tauri' && platform.os === 'linux'
}

export function isMacTauri(platform = getDesktopPlatform()) {
  return platform.runtime === 'tauri' && platform.os === 'macos'
}

export function getUpdatePlatformId(platform = getDesktopPlatform()) {
  if (platform.runtime !== 'tauri') return 'web'
  if (platform.os === 'linux') return 'tauri-linux-x64'
  if (platform.os === 'macos') return 'tauri-macos'
  return 'tauri-win64'
}

export function getUpdateAssetSignature(platformId = getUpdatePlatformId()) {
  if (platformId === 'tauri-linux-x64') {
    return { suffixes: ['.deb', '.appimage'], tag: 'linux' }
  }
  if (platformId === 'tauri-macos') {
    return { suffixes: ['.dmg'], tag: 'macos' }
  }
  return { suffixes: ['.exe'], tag: 'tauri' }
}

export function describePlatform(platform = getDesktopPlatform()) {
  return `${platform.runtime}/${platform.os}${platform.desktop ? ' (desktop)' : ''}`
}
