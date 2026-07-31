export const FLOATING_WINDOW_STYLES = ['text', 'image1', 'image2', 'image3']

export function normalizeFloatingWindowStyle(value) {
  return FLOATING_WINDOW_STYLES.includes(value) ? value : 'text'
}

export function floatingWindowImagePath(style) {
  const normalized = normalizeFloatingWindowStyle(style)
  return normalized === 'text' ? '' : `./cyrene${normalized.slice(-1)}.jpg`
}
