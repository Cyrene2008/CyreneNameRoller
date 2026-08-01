/**
 * Public SDK for CyreneNameRoller plugins.
 * The host injects the request function into activate(context).
 */
export const PLUGIN_API_VERSION = '1.0.0'

export const PluginEvents = Object.freeze({
  ROLLER_START: 'roller:start',
  ROLLER_ITEM_RESULT: 'roller:item-result',
  ROLLER_RESULT: 'roller:result',
  CARD_ITEM_RESULT: 'card:item-result',
  CARD_RESULT: 'card:result',
  LOTTERY_RESULT: 'lottery:result',
  LOTTERY_ITEM_RESULT: 'lottery:item-result',
  LOTTERY_ASSIGN_RESULT: 'lottery:assign-result'
})

export const PluginPermissions = Object.freeze({
  STORAGE_READ: 'storage:read',
  STORAGE_WRITE: 'storage:write',
  EVENTS_DRAW: 'events:draw',
  NOTIFICATIONS_SHOW: 'notifications:show',
  AUDIO_SELECT: 'audio:select',
  AUDIO_PLAY: 'audio:play',
  NAMES_READ: 'names:read',
  SYSTEM_OPEN_URL: 'system:open-url',
  SYSTEM_SELECT_FILE: 'system:select-file',
  SYSTEM_SELECT_DIRECTORY: 'system:select-directory',
  SYSTEM_CLIPBOARD_READ: 'system:clipboard-read',
  SYSTEM_CLIPBOARD_WRITE: 'system:clipboard-write',
  SYSTEM_REVEAL_FILE: 'system:reveal-file',
  SYSTEM_EXECUTE: 'system:execute'
})

export const PluginPlatforms = Object.freeze({
  WEB: 'web',
  TAURI: 'tauri',
  WINDOWS: 'windows',
  MACOS: 'macos',
  LINUX: 'linux'
})

export const PluginCapabilities = Object.freeze({
  OPEN_URL: 'system:open-url',
  SELECT_FILE: 'system:select-file',
  SELECT_DIRECTORY: 'system:select-directory',
  CLIPBOARD_READ: 'system:clipboard-read',
  CLIPBOARD_WRITE: 'system:clipboard-write',
  REVEAL_FILE: 'system:reveal-file',
  EXECUTE: 'system:execute'
})

export function definePlugin(plugin) {
  if (!plugin || typeof plugin.activate !== 'function') {
    throw new TypeError('definePlugin() requires an object with activate(context)')
  }
  const target = globalThis
  target.CyrenePluginModule = plugin
  return plugin
}

export function createRequest(context) {
  if (!context || typeof context.request !== 'function') throw new Error('Plugin context is unavailable')
  return context.request
}

export async function getPlatform(context) {
  if (context?.platform?.runtime) return context.platform
  return createRequest(context)('runtime.platform')
}

export async function getCapabilities(context) {
  if (context?.capabilities) return context.capabilities
  return createRequest(context)('runtime.capabilities')
}

export async function isCapabilityAvailable(context, capability) {
  const capabilities = await getCapabilities(context)
  return capabilities?.[capability]?.available === true
}

export async function requestCapability(context, method, args = {}, options = {}) {
  const result = await createRequest(context)(method, args)
  if (!result || result.ok !== false) return result
  if (result.code === 'UNSUPPORTED_PLATFORM' && options.ignoreUnsupported !== false) return result
  const error = new Error(result.message || `${method} failed`)
  error.code = result.code
  error.result = result
  throw error
}

export async function withPlatform(context, handlers = {}) {
  const platform = await getPlatform(context)
  const handler = handlers[platform.os] || handlers[platform.runtime] || handlers.default
  return typeof handler === 'function' ? handler(platform) : undefined
}

export function eventIs(event, type) { return event === type }

export function isResultEvent(event) {
  return typeof event === 'string' && event.endsWith(':result')
}
