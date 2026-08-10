import { FLOATING_WINDOW_STYLES, normalizeFloatingWindowStyle } from '../../packages/cyrene-core/src/storage.js'

export { FLOATING_WINDOW_STYLES, normalizeFloatingWindowStyle }

export function floatingWindowImagePath(style) {
  const normalized = normalizeFloatingWindowStyle(style)
  return normalized === 'text' ? '' : `./cyrene${normalized.slice(-1)}.jpg`
}
