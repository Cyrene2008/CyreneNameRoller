import {
  DEFAULT_FLOATING_WINDOW_SIZE,
  MAX_FLOATING_WINDOW_SIZE,
  MIN_FLOATING_WINDOW_SIZE,
  FLOATING_WINDOW_SIZE_STEP,
  normalizeFloatingWindowSize
} from '../../packages/cyrene-core/src/storage.js'

export {
  DEFAULT_FLOATING_WINDOW_SIZE,
  MAX_FLOATING_WINDOW_SIZE,
  MIN_FLOATING_WINDOW_SIZE,
  FLOATING_WINDOW_SIZE_STEP,
  normalizeFloatingWindowSize
}

export function floatingWindowTextSize(value) {
  const size = normalizeFloatingWindowSize(value)
  return Math.round(Math.min(28, Math.max(11, size * 14 / 64)))
}
