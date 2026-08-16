export const MIN_FLOATING_WINDOW_SIZE = 40
export const MAX_FLOATING_WINDOW_SIZE = 256
export const FLOATING_WINDOW_SIZE_STEP = 4
export const DEFAULT_FLOATING_WINDOW_SIZE = 64
export const MIN_FLOATING_WINDOW_TEXT_SIZE = 7
export const MAX_FLOATING_WINDOW_TEXT_SIZE = 64

export function normalizeFloatingWindowSize(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return DEFAULT_FLOATING_WINDOW_SIZE
  const rounded = Math.round(number / FLOATING_WINDOW_SIZE_STEP) * FLOATING_WINDOW_SIZE_STEP
  return Math.min(MAX_FLOATING_WINDOW_SIZE, Math.max(MIN_FLOATING_WINDOW_SIZE, rounded))
}

export function normalizeFloatingWindowTextSize(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.min(MAX_FLOATING_WINDOW_TEXT_SIZE, Math.max(MIN_FLOATING_WINDOW_TEXT_SIZE, Math.round(number)))
}

export function floatingWindowTextSize(value, text = '点名', customSize = null) {
  const size = normalizeFloatingWindowSize(value)
  const automaticSize = Math.min(28, Math.max(11, size * 14 / 64))
  const preferredSize = normalizeFloatingWindowTextSize(customSize) ?? automaticSize
  const length = Math.max(1, Array.from(String(text || '')).length)
  const charactersPerLine = Math.ceil(Math.sqrt(length))
  const lineCount = Math.ceil(length / charactersPerLine)
  const availableSize = size * 0.72
  const fittedSize = Math.min(
    preferredSize,
    availableSize / charactersPerLine,
    availableSize / (lineCount * 1.1)
  )
  return Math.max(MIN_FLOATING_WINDOW_TEXT_SIZE, Math.floor(fittedSize))
}
