import { normalizeHex } from './theme.js'

export const DEFAULT_FLOATING_WINDOW_TEXT = '点名'
export const DEFAULT_FLOATING_WINDOW_BACKGROUND_COLOR = '#ea5ec1'
export const DEFAULT_FLOATING_WINDOW_TEXT_COLOR = '#ffffff'
export const MAX_FLOATING_WINDOW_TEXT_LENGTH = 12

export function normalizeFloatingWindowText(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return DEFAULT_FLOATING_WINDOW_TEXT
  return Array.from(text).slice(0, MAX_FLOATING_WINDOW_TEXT_LENGTH).join('')
}

export function normalizeFloatingWindowBackgroundColor(value) {
  return normalizeHex(value, DEFAULT_FLOATING_WINDOW_BACKGROUND_COLOR)
}

export function normalizeFloatingWindowTextColor(value) {
  return normalizeHex(value, DEFAULT_FLOATING_WINDOW_TEXT_COLOR)
}
