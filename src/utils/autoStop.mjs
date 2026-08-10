import {
  DEFAULT_AUTO_STOP_DURATION,
  MAX_AUTO_STOP_DURATION,
  MIN_AUTO_STOP_DURATION,
  normalizeAutoStopDuration
} from '../../packages/cyrene-core/src/storage.js'

export {
  DEFAULT_AUTO_STOP_DURATION,
  MAX_AUTO_STOP_DURATION,
  MIN_AUTO_STOP_DURATION,
  normalizeAutoStopDuration
}

export function getAutoStopProgress(remainingMs, durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 0
  if (!Number.isFinite(remainingMs)) return 0
  return Math.min(100, Math.max(0, (remainingMs / durationMs) * 100))
}
