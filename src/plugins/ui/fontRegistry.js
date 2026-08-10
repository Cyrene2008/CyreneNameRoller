import { normalizeFonts, validateFontFiles } from '../../../packages/cyrene-core/src/ui-policies/font-policy.js'

export { normalizeFonts, validateFontFiles }

export function fontAssetUrl(plugin, source) {
  const encoded = plugin?.files?.[source]
  return encoded ? `data:font/woff2;base64,${encoded}` : ''
}

export class PluginFontRegistry {
  constructor({ FontFaceImpl = globalThis.FontFace, documentImpl = globalThis.document } = {}) {
    this.FontFaceImpl = FontFaceImpl
    this.document = documentImpl
    this.entries = new Map()
  }

  async register(plugin, declarations = []) {
    this.unregister(plugin?.manifest?.id)
    if (!this.FontFaceImpl || !this.document?.fonts) return []
    const registered = []
    for (const declaration of declarations) {
      const family = `plugin:${plugin.manifest.id}/${declaration.id}`
      const url = fontAssetUrl(plugin, declaration.source)
      if (!url) continue
      try {
        const face = new this.FontFaceImpl(family, `url(${url})`, { weight: String(declaration.weight), style: declaration.style })
        await face.load()
        this.document.fonts.add(face)
        this.entries.set(`${plugin.manifest.id}:${declaration.id}`, { family, face })
        registered.push(family)
      } catch { /* 字体失败时保留宿主回退 */ }
    }
    return registered
  }

  unregister(pluginId) {
    const prefix = `${pluginId}:`
    for (const [key, entry] of this.entries) {
      if (!key.startsWith(prefix)) continue
      try { this.document?.fonts?.delete(entry.face) } catch {}
      this.entries.delete(key)
    }
  }

  clear() {
    for (const key of [...this.entries.keys()]) this.unregister(key.split(':')[0])
  }
}
