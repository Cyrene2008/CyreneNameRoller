export const FLOATING_WINDOW_STYLES = ['text', 'image1', 'image2', 'image3', 'custom']
export const MIN_FLOATING_WINDOW_RADIUS = 0
export const MAX_FLOATING_WINDOW_RADIUS = 50

export function normalizeFloatingWindowStyle(value) {
  return FLOATING_WINDOW_STYLES.includes(value) ? value : 'text'
}

export function floatingWindowImagePath(style, customImage = '') {
  const normalized = normalizeFloatingWindowStyle(style)
  if (normalized === 'text') return ''
  if (normalized === 'custom') return typeof customImage === 'string' ? customImage : ''
  return `./cyrene${normalized.slice(-1)}.jpg`
}

export function normalizeFloatingWindowRadius(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return MIN_FLOATING_WINDOW_RADIUS
  return Math.min(MAX_FLOATING_WINDOW_RADIUS, Math.max(MIN_FLOATING_WINDOW_RADIUS, Math.round(number)))
}

export function resolveFloatingWindowRadius(value, style) {
  const normalizedStyle = normalizeFloatingWindowStyle(style)
  if (normalizedStyle !== 'text' && normalizedStyle !== 'custom') return MIN_FLOATING_WINDOW_RADIUS
  if (value === null || value === undefined || value === '') {
    return normalizedStyle === 'text' ? MAX_FLOATING_WINDOW_RADIUS : MIN_FLOATING_WINDOW_RADIUS
  }
  return normalizeFloatingWindowRadius(value)
}
