export const DEFAULT_AUTO_STOP_DURATION = 3
export const MIN_AUTO_STOP_DURATION = 1
export const MAX_AUTO_STOP_DURATION = 60

export function normalizeAutoStopDuration(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_AUTO_STOP_DURATION
  return Math.min(MAX_AUTO_STOP_DURATION, Math.max(MIN_AUTO_STOP_DURATION, Math.round(parsed)))
}

export function getAutoStopProgress(remainingMs, durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 0
  if (!Number.isFinite(remainingMs)) return 0
  return Math.min(100, Math.max(0, (remainingMs / durationMs) * 100))
}
