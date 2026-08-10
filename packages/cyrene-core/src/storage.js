export const DEFAULT_SETTINGS = {
  recordCounts: true,
  rainbowNames: true,
  englishMode: false,
  language: 'zh',
  groupMode: false,
  multiMode: false,
  peopleCount: 2,
  allowDuplicates: false,
  forbidDuplicates: false,
  multiStepStop: true,
  autoStop: false,
  autoStopDuration: 3,
  finishAnimation: 'spotlight',
  stepStopInterval: 0.15,
  theme: 'default',
  colorTheme: 'peach',
  customThemeColor: '#0078d4',
  downloadSource: 'ghproxy',
  particles: true,
  blur: true,
  animSpeed: 1,
  uiScale: 100,
  uiScaleVersion: 2,
  nameFontSize: 1.0,
  fontFamily: 'MiSans',
  darkMode: false,
  nameColorMode: 'gradient',
  customNameColorLight: '#d04a9d',
  customNameColorDark: '#f09bd7',
  perfBlur: true,
  perfShadows: true,
  perfAnimations: true,
  dockCollapsed: false,
  disableSplash: false,
  floatingWindowEnabled: false,
  floatingWindowStyle: 'text',
  floatingWindowSize: 64,
  floatingCompassHintDismissed: false,
  autoStart: false,
  autoStartMode: 'registry',
  autoStartToTray: false,
  uriSchemeEnabled: false,
  newMemberCountMode: 'midpoint'
}

export const FLOATING_WINDOW_STYLES = ['text', 'image1', 'image2', 'image3']

export const MIN_FLOATING_WINDOW_SIZE = 40
export const MAX_FLOATING_WINDOW_SIZE = 256
export const FLOATING_WINDOW_SIZE_STEP = 4
export const DEFAULT_FLOATING_WINDOW_SIZE = 64

export const DEFAULT_AUTO_STOP_DURATION = 3
export const MIN_AUTO_STOP_DURATION = 1
export const MAX_AUTO_STOP_DURATION = 60

export function normalizeFloatingWindowStyle(value) {
  return FLOATING_WINDOW_STYLES.includes(value) ? value : 'text'
}

export function normalizeFloatingWindowSize(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return DEFAULT_FLOATING_WINDOW_SIZE
  const rounded = Math.round(number / FLOATING_WINDOW_SIZE_STEP) * FLOATING_WINDOW_SIZE_STEP
  return Math.min(MAX_FLOATING_WINDOW_SIZE, Math.max(MIN_FLOATING_WINDOW_SIZE, rounded))
}

export function normalizeAutoStopDuration(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_AUTO_STOP_DURATION
  return Math.min(MAX_AUTO_STOP_DURATION, Math.max(MIN_AUTO_STOP_DURATION, Math.round(parsed)))
}

export function normalizeStoredSettings(raw) {
  const hasSaved = raw && typeof raw === 'object' && !Array.isArray(raw)
  const saved = hasSaved ? raw : {}
  const settings = { ...DEFAULT_SETTINGS, ...saved }
  if (hasSaved && (!saved.uiScaleVersion || saved.uiScaleVersion < 2)) {
    settings.uiScale = Math.round((saved.uiScale || 100) * 0.8)
    settings.uiScaleVersion = 2
  }
  settings.newMemberCountMode = settings.newMemberCountMode === 'zero' ? 'zero' : 'midpoint'
  settings.floatingWindowStyle = normalizeFloatingWindowStyle(settings.floatingWindowStyle)
  settings.floatingWindowSize = normalizeFloatingWindowSize(settings.floatingWindowSize)
  settings.autoStopDuration = normalizeAutoStopDuration(settings.autoStopDuration)
  return settings
}
