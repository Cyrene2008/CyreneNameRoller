import { decodePluginFile, MAX_PLUGIN_ANIMATION_ACTIVE_MS, normalizeAnimationPack } from './package'

const VALUE_SEPARATOR = '::'

function selectionValue(pluginId, packId, presetId) {
  return [pluginId, packId, presetId].join(VALUE_SEPARATOR)
}

function parseSelection(value) {
  const [pluginId = '', packId = '', presetId = ''] = String(value || '').split(VALUE_SEPARATOR)
  return { pluginId, packId, presetId }
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function animationEnabled() {
  if (typeof document !== 'undefined' && document.querySelector('.app-layout')?.classList.contains('perf-no-anim')) return false
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return true
}

export class PluginAnimationRegistry {
  constructor() {
    this.packs = new Map()
    this.surfaces = new Map()
    this.running = new Map()
    this.elementAnimations = new WeakMap()
  }

  registerPlugin(plugin, selections = {}) {
    this.unregisterPlugin(plugin.manifest.id)
    const parsedPacks = plugin.animationPacks?.length
      ? plugin.animationPacks
      : (plugin.manifest.contributes?.animationPacks || []).map(declaration => {
          const raw = JSON.parse(decodePluginFile(plugin, declaration.source))
          return normalizeAnimationPack(raw, declaration)
        })
    for (const pack of parsedPacks) {
      const key = `${plugin.manifest.id}:${pack.id}`
      this.packs.set(key, { pluginId: plugin.manifest.id, pluginName: plugin.manifest.name, ...clone(pack) })
      for (const preset of pack.presets) {
        if (preset.default && !Object.hasOwn(selections, preset.target)) {
          selections[preset.target] = selectionValue(plugin.manifest.id, pack.id, preset.id)
        }
      }
    }
    return selections
  }

  unregisterPlugin(pluginId) {
    for (const [key, pack] of this.packs) if (pack.pluginId === pluginId) this.packs.delete(key)
    const active = this.running.get(pluginId)
    if (active) {
      for (const animation of active) {
        try { animation.cancel() } catch {}
      }
      this.running.delete(pluginId)
    }
  }

  removeSelectionsForPlugin(pluginId, selections = {}) {
    for (const [target, value] of Object.entries(selections)) {
      if (parseSelection(value).pluginId === pluginId) delete selections[target]
    }
  }

  registerSurface(target, element) {
    if (element) this.surfaces.set(target, element)
  }

  unregisterSurface(target, element) {
    if (!element || this.surfaces.get(target) === element) this.surfaces.delete(target)
    if (element) {
      for (const animation of this.elementAnimations.get(element)?.values() || []) {
        try { animation.cancel() } catch {}
      }
      this.elementAnimations.delete(element)
    }
  }

  optionsFor(target, { pluginId = '', packId = '', includeDefault = true, language = 'zh' } = {}) {
    const options = includeDefault
      ? [{ value: '', label: language === 'en' ? 'Application default' : '程序默认动画' }]
      : []
    for (const pack of this.packs.values()) {
      if (pluginId && pack.pluginId !== pluginId) continue
      if (packId && pack.id !== packId) continue
      for (const preset of pack.presets) {
        if (preset.target !== target) continue
        options.push({
          value: selectionValue(pack.pluginId, pack.id, preset.id),
          label: preset.label,
          description: preset.description,
          pluginId: pack.pluginId,
          packId: pack.id,
          presetId: preset.id,
          tags: preset.tags || []
        })
      }
    }
    return options
  }

  resolve(target, selections = {}, explicitValue = undefined) {
    const value = explicitValue === undefined ? selections[target] : explicitValue
    if (!value) return null
    const { pluginId, packId, presetId } = parseSelection(value)
    const pack = this.packs.get(`${pluginId}:${packId}`)
    const preset = pack?.presets.find(item => item.id === presetId && item.target === target)
    return pack && preset ? { value, pack, preset } : null
  }

  has(target, selections = {}) {
    return !!this.resolve(target, selections)
  }

  start(target, element, selections = {}, { variant = 'main', selection = undefined } = {}) {
    if (!animationEnabled() || typeof Element === 'undefined') return null
    const resolved = this.resolve(target, selections, selection)
    const targetElement = element || this.surfaces.get(target)
    if (!resolved || !(targetElement instanceof Element) || typeof targetElement.animate !== 'function') return null
    const definition = resolved.preset.variants?.[variant] || resolved.preset.animation
    if (!definition) return null
    let animation
    try {
      const current = this.elementAnimations.get(targetElement)?.get(target)
      current?.cancel()
      animation = targetElement.animate(clone(definition.keyframes), clone(definition.options))
    } catch (error) {
      console.warn('[plugins] animation failed to start', error)
      return null
    }
    const pluginId = resolved.pack.pluginId
    if (!this.running.has(pluginId)) this.running.set(pluginId, new Set())
    this.running.get(pluginId).add(animation)
    if (!this.elementAnimations.has(targetElement)) this.elementAnimations.set(targetElement, new Map())
    this.elementAnimations.get(targetElement).set(target, animation)
    const timeoutMs = Math.min(
      MAX_PLUGIN_ANIMATION_ACTIVE_MS,
      Math.ceil((definition.options.delay || 0) + (definition.options.duration || 0) * (definition.options.iterations || 1) + 500)
    )
    let timeoutId
    let settled = false
    const finished = new Promise(resolve => {
      const settle = () => {
        if (settled) return
        settled = true
        if (timeoutId) clearTimeout(timeoutId)
        resolve()
      }
      Promise.resolve(animation.finished).catch(() => undefined).then(settle)
      timeoutId = setTimeout(() => {
        if (settled) return
        try { animation.cancel() } catch {}
        settle()
      }, timeoutMs)
    }).finally(() => {
      this.running.get(pluginId)?.delete(animation)
      if (this.elementAnimations.get(targetElement)?.get(target) === animation) this.elementAnimations.get(targetElement).delete(target)
    })
    return {
      pluginId,
      packId: resolved.pack.id,
      presetId: resolved.preset.id,
      animation,
      finished,
      cancel() { try { animation.cancel() } catch {} }
    }
  }
}

export { parseSelection as parseAnimationSelection, selectionValue as createAnimationSelection }
