export const PLUGIN_API_VERSION = '1.0.0'
export const PLUGIN_LIST_REPOSITORY = 'Cyrene2008/CyreneNameRoller'
export const PLUGIN_LIST_PATH = 'plugins/list.json'

export const PLUGIN_DOWNLOAD_SOURCES = [
  { value: 'cyrene', label: 'gh.昔涟.cn' },
  { value: 'ghproxy', label: 'gh-proxy.com' },
  { value: 'github', label: 'GitHub' }
]

export const PLUGIN_PERMISSIONS = new Set([
  'storage:read',
  'storage:write',
  'events:draw',
  'notifications:show',
  'audio:select',
  'audio:play',
  'names:read',
  'system:open-url',
  'system:select-file',
  'system:select-directory',
  'system:clipboard-read',
  'system:clipboard-write',
  'system:reveal-file',
  'system:execute'
])

export const PLUGIN_PLATFORM_CAPABILITIES = new Set([
  'notifications:show',
  'audio:select',
  'audio:play',
  'system:open-url',
  'system:select-file',
  'system:select-directory',
  'system:clipboard-read',
  'system:clipboard-write',
  'system:reveal-file',
  'system:execute'
])

export const PLUGIN_PLATFORM_IDS = new Set([
  'web', 'tauri', 'windows', 'macos', 'linux', 'android', 'ios'
])

export function pluginSourceUrl(originalUrl, source = 'cyrene') {
  if (!originalUrl || source === 'github') return originalUrl
  return `${source === 'ghproxy' ? 'https://gh-proxy.com/' : 'https://gh.昔涟.cn/'}${originalUrl}`
}

export function pluginListUrl(source = 'cyrene') {
  const raw = `https://raw.githubusercontent.com/${PLUGIN_LIST_REPOSITORY}/master/${PLUGIN_LIST_PATH}`
  return pluginSourceUrl(raw, source)
}
