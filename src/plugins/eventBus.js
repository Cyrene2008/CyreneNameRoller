const listeners = new Map()

export function onPluginEvent(type, listener) {
  if (!listeners.has(type)) listeners.set(type, new Set())
  listeners.get(type).add(listener)
  return () => listeners.get(type)?.delete(listener)
}

export function emitPluginEvent(type, payload = {}) {
  const event = { type, payload, time: Date.now() }
  for (const listener of listeners.get(type) || []) {
    try { listener(event) } catch (error) { console.warn(`[plugins] event ${type} failed`, error) }
  }
}
