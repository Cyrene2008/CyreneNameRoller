export function isTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}
