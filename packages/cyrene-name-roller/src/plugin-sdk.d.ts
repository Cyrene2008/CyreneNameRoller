export declare const PLUGIN_API_VERSION: '1.1.0'
export declare const PluginEvents: {
  readonly APP_READY: 'app:ready'
  readonly APP_ROUTE_CHANGED: 'app:route-changed'
  readonly APP_THEME_CHANGED: 'app:theme-changed'
  readonly APP_RESIZE: 'app:resize'
  readonly PLUGIN_STORAGE_CHANGED: 'plugin:storage-changed'
  readonly DRAW_ITEM_RESULT: 'draw:item-result'
  readonly DRAW_RESULT: 'draw:result'
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
  readonly RECORDS_READ: 'records:read'
  readonly STATISTICS_READ: 'statistics:read'
  readonly BALANCE_READ: 'balance:read'
  readonly EVENTS_LIFECYCLE: 'events:lifecycle'
  readonly DRAW_EXECUTE: 'draw:execute'
  readonly UI_ANIMATIONS: 'ui:animations'
  readonly UI_VISUAL_SURFACES: 'ui:visual-surfaces'
  readonly SYSTEM_OPEN_URL: 'system:open-url'
  readonly SYSTEM_SELECT_FILE: 'system:select-file'
  readonly SYSTEM_SELECT_DIRECTORY: 'system:select-directory'
  readonly SYSTEM_CLIPBOARD_READ: 'system:clipboard-read'
  readonly SYSTEM_CLIPBOARD_WRITE: 'system:clipboard-write'
  readonly SYSTEM_REVEAL_FILE: 'system:reveal-file'
  readonly SYSTEM_EXECUTE: 'system:execute'
}

export declare const AnimationTargets: {
  readonly PAGE_TRANSITION: 'page.transition'
  readonly ROLLER_FINISH: 'roller.finish'
  readonly CARD_DEAL: 'card.deal'
  readonly CARD_FLIP: 'card.flip'
  readonly LOTTERY_FINISH: 'lottery.finish'
  readonly GLOBAL_TRANSITION: 'global.transition'
}

export declare const PluginPageLocations: {
  readonly PLUGINS: 'plugins'
  readonly DOCK: 'dock'
}

export declare const PluginPlatforms: {
  readonly WEB: 'web'
  readonly TAURI: 'tauri'
  readonly WINDOWS: 'windows'
  readonly MACOS: 'macos'
  readonly LINUX: 'linux'
  readonly ANDROID: 'android'
  readonly IOS: 'ios'
}

export declare const PluginCapabilities: {
  readonly NOTIFICATIONS_SHOW: 'notifications:show'
  readonly AUDIO_SELECT: 'audio:select'
  readonly AUDIO_PLAY: 'audio:play'
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
  permissions: readonly PluginPermission[]
  platform: PluginPlatform
  capabilities: Record<string, CapabilityStatus>
  request(method: string, args?: Record<string, unknown>): Promise<any>
}

export interface PluginModule {
  activate(context: PluginContext): void | Promise<void>
  onEvent?(event: string, payload: unknown): void | Promise<void>
  deactivate?(): void | Promise<void>
}

export type AnimationTarget = typeof AnimationTargets[keyof typeof AnimationTargets]
export type PluginPermission = typeof PluginPermissions[keyof typeof PluginPermissions]
export type PluginPlatformId = PluginPlatform['runtime'] | Exclude<PluginPlatform['os'], 'unknown'>
export type PluginEvent = typeof PluginEvents[keyof typeof PluginEvents]

export type PluginAnimationProperty =
  | 'opacity' | 'transform' | 'filter' | 'clipPath' | 'borderRadius'
  | 'boxShadow' | 'textShadow' | 'color' | 'background' | 'backgroundColor'
  | 'letterSpacing' | 'offset' | 'easing' | 'composite'

export type PluginAnimationKeyframe =
  Partial<Record<Exclude<PluginAnimationProperty, 'offset' | 'composite'>, string | number>> & {
    offset?: number
    composite?: 'replace' | 'add' | 'accumulate'
  }

export interface PluginAnimationDefinition {
  keyframes: PluginAnimationKeyframe[]
  options: {
    duration: number
    delay?: number
    easing?: string
    iterations?: number
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  }
}

export interface PluginAnimationPreset {
  id: string
  target: AnimationTarget
  label: string
  description?: string
  tags?: string[]
  default?: boolean
  animation?: PluginAnimationDefinition
  variants?: Record<string, PluginAnimationDefinition>
}

export interface PluginAnimationPack {
  schemaVersion: 1
  title?: string
  description?: string
  presets: PluginAnimationPreset[]
}

export interface PluginAnimationPackContribution {
  id: string
  title: string
  description?: string
  source: string
}

export interface PluginNativeControlBase {
  id: string
  label: string
  description?: string
}

export interface PluginToggleControl extends PluginNativeControlBase {
  type: 'toggle'
  path: string
  default?: boolean
}

export interface PluginRangeControl extends PluginNativeControlBase {
  type: 'range'
  path: string
  min: number
  max: number
  step?: number
  default?: number
}

export interface PluginSelectControl extends PluginNativeControlBase {
  type: 'select'
  path: string
  options: Array<{ value: string; label: string }>
  default?: string
}

export interface PluginAudioControl extends PluginNativeControlBase {
  type: 'audio'
  path: string
  accept?: string
  default?: null
}

export interface PluginAnimationSelectControl extends PluginNativeControlBase {
  type: 'animation-select'
  target: AnimationTarget
  packId?: string
}

export type PluginNativeControl =
  | PluginToggleControl | PluginRangeControl | PluginSelectControl
  | PluginAudioControl | PluginAnimationSelectControl

export interface PluginNativeSettingsPage {
  type: 'settings'
  settingsKey?: string
  controls: PluginNativeControl[]
}

export interface PluginPageContribution {
  id: string
  title: string
  titleEn?: string
  icon?: string
  location?: 'plugins' | 'dock'
  order?: number
  entry?: string
  platformEntries?: Partial<Record<PluginPlatformId, string>>
  native?: PluginNativeSettingsPage
}

export interface PluginVisualSurfaceContribution {
  id: string
  title?: string
  entry?: string
  platformEntries?: Partial<Record<PluginPlatformId, string>>
  placement?: 'background'
  events?: string[]
  defaultEnabled?: boolean
}

export interface PluginDependency {
  id: string
  range?: string
  version?: string
  dataAccess?: boolean
}

export interface PluginCapabilityDeclaration {
  required?: boolean
  platforms?: PluginPlatformId[]
}

export interface PluginSystemOperation {
  id: string
  label: string
  platforms?: PluginPlatformId[]
  command: { program: string; args?: string[] }
  timeoutMs?: number
}

export interface PluginManifest {
  schemaVersion: 1
  id: string
  name: string
  version: string
  author: string
  description?: string
  engine: { min: string; max?: string }
  entry?: string
  platformEntries?: Partial<Record<PluginPlatformId, string>>
  supportedPlatforms?: PluginPlatformId[]
  icon?: string
  readme?: string
  permissions?: PluginPermission[]
  capabilities?: Partial<Record<string, PluginCapabilityDeclaration>>
  systemOperations?: PluginSystemOperation[]
  dependencies?: PluginDependency[]
  shareData?: boolean
  contributes?: {
    pages?: PluginPageContribution[]
    animationPacks?: PluginAnimationPackContribution[]
    visualSurfaces?: PluginVisualSurfaceContribution[]
  }
}

export interface DrawRequest {
  listId?: string
  target?: 'people' | 'groups'
  count?: number
  gender?: 'all' | 'male' | 'female'
  allowDuplicates?: boolean
}

export interface DrawResultItem {
  readonly id: string
  readonly name: string
  readonly englishName: string
  readonly isGroup: boolean
  readonly isWhiteList: boolean
}

export interface DrawReceipt {
  readonly operationId: string
  readonly pluginId: string
  readonly listId: string
  readonly target: 'people' | 'groups'
  readonly count: number
  readonly allowDuplicates: boolean
  readonly gender: 'all' | 'male' | 'female'
  readonly algorithm: string
  readonly algorithmVersion: string
  readonly committedAt: number
  readonly results: readonly DrawResultItem[]
}

export interface VisualSurfaceContext extends PluginContext {
  canvas: OffscreenCanvas
  surface: Readonly<{ id: string; placement: 'background' }>
}

export interface VisualSurfaceModule {
  activate(context: VisualSurfaceContext): void | Promise<void>
  onResize?(viewport: Readonly<{ width: number; height: number; dpr: number; pixelWidth: number; pixelHeight: number }>): void | Promise<void>
  onEvent?(event: string, payload: unknown): void | Promise<void>
  deactivate?(): void | Promise<void>
}

export interface ReadonlyNamesSnapshot {
  readonly currentListId: string
  readonly lists: Readonly<Record<string, unknown>>
}

export type ReadonlyRecordsSnapshot = ReadonlyArray<Readonly<{
  personId: string | null
  listId: string | null
  groupId?: string | null
  source?: string
  operationId?: string
  pluginId?: string
  time?: number
}>>

export interface ReadonlyStatisticsSnapshot {
  readonly counts: Readonly<Record<string, number>>
  readonly totalCount: number
}

export interface ReadonlyBalanceSnapshot {
  readonly enabled: boolean
  readonly algorithm: string
  readonly version: string
  readonly targetGap: number
  readonly defaults: Readonly<Record<string, unknown>>
}

export declare function definePlugin<T extends PluginModule>(plugin: T): T
export declare function defineVisualSurface<T extends VisualSurfaceModule>(surface: T): T
export declare function createRequest(context: PluginContext): PluginContext['request']
export declare function getPlatform(context: PluginContext): Promise<PluginPlatform>
export declare function getCapabilities(context: PluginContext): Promise<Record<string, CapabilityStatus>>
export declare function isCapabilityAvailable(context: PluginContext, capability: string): Promise<boolean>
export declare function requestCapability<T = unknown>(context: PluginContext, method: string, args?: Record<string, unknown>, options?: { ignoreUnsupported?: boolean }): Promise<CapabilityResult<T>>
export declare function executeDraw(context: PluginContext, options?: DrawRequest): Promise<DrawReceipt>
export declare function readDependencyStorage<T = unknown>(context: PluginContext, pluginId: string, key: string): Promise<T>
export declare function withPlatform<T = unknown>(context: PluginContext, handlers: Partial<Record<PluginPlatform['runtime'] | PluginPlatform['os'] | 'default', (platform: PluginPlatform) => T | Promise<T>>>): Promise<T | undefined>
export declare function eventIs(event: string, type: string): boolean
export declare function isResultEvent(event: string): boolean
