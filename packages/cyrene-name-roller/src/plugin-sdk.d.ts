export declare const PLUGIN_API_VERSION: '1.0.0'
export declare const PluginEvents: {
  readonly ROLLER_START: 'roller:start'
  readonly ROLLER_ITEM_RESULT: 'roller:item-result'
  readonly ROLLER_RESULT: 'roller:result'
  readonly CARD_ITEM_RESULT: 'card:item-result'
  readonly CARD_RESULT: 'card:result'
  readonly LOTTERY_RESULT: 'lottery:result'
  readonly LOTTERY_ITEM_RESULT: 'lottery:item-result'
  readonly LOTTERY_ASSIGN_RESULT: 'lottery:assign-result'
}
export declare const PluginPermissions: {
  readonly STORAGE_READ: 'storage:read'
  readonly STORAGE_WRITE: 'storage:write'
  readonly EVENTS_DRAW: 'events:draw'
  readonly NOTIFICATIONS_SHOW: 'notifications:show'
  readonly AUDIO_SELECT: 'audio:select'
  readonly AUDIO_PLAY: 'audio:play'
  readonly NAMES_READ: 'names:read'
  readonly SYSTEM_OPEN_URL: 'system:open-url'
  readonly SYSTEM_SELECT_FILE: 'system:select-file'
  readonly SYSTEM_SELECT_DIRECTORY: 'system:select-directory'
  readonly SYSTEM_CLIPBOARD_READ: 'system:clipboard-read'
  readonly SYSTEM_CLIPBOARD_WRITE: 'system:clipboard-write'
  readonly SYSTEM_REVEAL_FILE: 'system:reveal-file'
  readonly SYSTEM_EXECUTE: 'system:execute'
}

export declare const PluginPlatforms: {
  readonly WEB: 'web'
  readonly TAURI: 'tauri'
  readonly WINDOWS: 'windows'
  readonly MACOS: 'macos'
  readonly LINUX: 'linux'
}

export declare const PluginCapabilities: {
  readonly OPEN_URL: 'system:open-url'
  readonly SELECT_FILE: 'system:select-file'
  readonly SELECT_DIRECTORY: 'system:select-directory'
  readonly CLIPBOARD_READ: 'system:clipboard-read'
  readonly CLIPBOARD_WRITE: 'system:clipboard-write'
  readonly REVEAL_FILE: 'system:reveal-file'
  readonly EXECUTE: 'system:execute'
}

export interface PluginPlatform {
  runtime: 'web' | 'tauri'
  os: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown'
  desktop: boolean
}

export interface CapabilityStatus {
  id: string
  label: string
  available: boolean
  code: string
  platform: 'web' | 'tauri'
  os: PluginPlatform['os']
}

export interface CapabilityResult<T = unknown> {
  ok: boolean
  capability: string
  platform: 'web' | 'tauri'
  os: PluginPlatform['os']
  value: T | null
  code?: string
  message?: string
  cancelled?: boolean
}

export interface PluginContext {
  plugin: { id: string; version: string }
  permissions: string[]
  platform: PluginPlatform
  capabilities: Record<string, CapabilityStatus>
  request(method: string, args?: Record<string, unknown>): Promise<any>
}

export interface PluginModule {
  activate(context: PluginContext): void | Promise<void>
  onEvent?(event: string, payload: unknown): void | Promise<void>
  deactivate?(): void | Promise<void>
}

export declare function definePlugin<T extends PluginModule>(plugin: T): T
export declare function createRequest(context: PluginContext): PluginContext['request']
export declare function getPlatform(context: PluginContext): Promise<PluginPlatform>
export declare function getCapabilities(context: PluginContext): Promise<Record<string, CapabilityStatus>>
export declare function isCapabilityAvailable(context: PluginContext, capability: string): Promise<boolean>
export declare function requestCapability<T = unknown>(context: PluginContext, method: string, args?: Record<string, unknown>, options?: { ignoreUnsupported?: boolean }): Promise<CapabilityResult<T>>
export declare function withPlatform<T = unknown>(context: PluginContext, handlers: Partial<Record<PluginPlatform['runtime'] | PluginPlatform['os'] | 'default', (platform: PluginPlatform) => T | Promise<T>>>): Promise<T | undefined>
export declare function eventIs(event: string, type: string): boolean
export declare function isResultEvent(event: string): boolean
