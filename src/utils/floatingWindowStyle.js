export const FLOATING_WINDOW_STYLES = ['text', 'image1', 'image2', 'image3', 'custom']
export const MIN_FLOATING_WINDOW_RADIUS = 0
export const MAX_FLOATING_WINDOW_RADIUS = 50
export const MIN_FLOATING_WINDOW_OPACITY = 20
export const MAX_FLOATING_WINDOW_OPACITY = 100
export const DEFAULT_FLOATING_WINDOW_OPACITY = 100

export function normalizeFloatingWindowStyle(value) {
  return FLOATING_WINDOW_STYLES.includes(value) ? value : 'text'
}

export function floatingWindowImagePath(style, customImage = '') {
  const normalized = normalizeFloatingWindowStyle(style)
  if (normalized === 'text') return ''
  if (normalized === 'custom') return typeof customImage === 'string' ? customImage : ''
  if (normalized === 'image1') return './cyrene.png'
  if (normalized === 'image3') return './icon.png'
  return `./cyrene${normalized.slice(-1)}.jpg`
}

export function normalizeFloatingWindowRadius(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return MIN_FLOATING_WINDOW_RADIUS
  return Math.min(MAX_FLOATING_WINDOW_RADIUS, Math.max(MIN_FLOATING_WINDOW_RADIUS, Math.round(number)))
}

export function normalizeFloatingWindowOpacity(value) {
  if (value === null || value === undefined || value === '') return DEFAULT_FLOATING_WINDOW_OPACITY
  const number = Number(value)
  if (!Number.isFinite(number)) return DEFAULT_FLOATING_WINDOW_OPACITY
  return Math.min(MAX_FLOATING_WINDOW_OPACITY, Math.max(MIN_FLOATING_WINDOW_OPACITY, Math.round(number)))
}

export function resolveFloatingWindowRadius(value, style) {
  const normalizedStyle = normalizeFloatingWindowStyle(style)
  if (normalizedStyle !== 'text' && normalizedStyle !== 'custom') return MIN_FLOATING_WINDOW_RADIUS
  if (value === null || value === undefined || value === '') {
    return normalizedStyle === 'text' ? MAX_FLOATING_WINDOW_RADIUS : MIN_FLOATING_WINDOW_RADIUS
  }
  return normalizeFloatingWindowRadius(value)
}
