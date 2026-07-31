export const MIN_FLOATING_WINDOW_SIZE = 40
export const MAX_FLOATING_WINDOW_SIZE = 256
export const FLOATING_WINDOW_SIZE_STEP = 4
export const DEFAULT_FLOATING_WINDOW_SIZE = 64

export function normalizeFloatingWindowSize(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return DEFAULT_FLOATING_WINDOW_SIZE
  const rounded = Math.round(number / FLOATING_WINDOW_SIZE_STEP) * FLOATING_WINDOW_SIZE_STEP
  return Math.min(MAX_FLOATING_WINDOW_SIZE, Math.max(MIN_FLOATING_WINDOW_SIZE, rounded))
}

export function floatingWindowTextSize(value) {
  const size = normalizeFloatingWindowSize(value)
  return Math.round(Math.min(28, Math.max(11, size * 14 / 64)))
}
