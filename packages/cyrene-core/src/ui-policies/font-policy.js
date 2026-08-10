const FONT_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/

export function normalizeFonts(value, permissions, { pluginId = '' } = {}) {
  if (value === undefined) return []
  if (!permissions.includes('ui:fonts')) {
    const error = new Error('fonts 需要 ui:fonts 权限')
    error.code = 'PLUGIN_PERMISSION_DENIED'
    throw error
  }
  if (!Array.isArray(value) || value.length > 8) throw Object.assign(new Error('fonts 最多 8 项'), { code: 'PLUGIN_UI_SCHEMA_INVALID' })
  const ids = new Set()
  return value.map((raw, index) => {
    const id = String(raw?.id || '')
    if (!FONT_ID_PATTERN.test(id) || ids.has(id)) throw Object.assign(new Error(`fonts[${index}] ID 无效或重复`), { code: 'PLUGIN_UI_SCHEMA_INVALID' })
    ids.add(id)
    const source = String(raw.source || '').replace(/\\/g, '/')
    if (!source.toLowerCase().endsWith('.woff2') || !source || source.startsWith('/') || source.includes('../') || source.includes('/..')) throw Object.assign(new Error(`fonts[${index}] 仅允许包内 .woff2`), { code: 'PLUGIN_UI_FONT_NOT_ALLOWED' })
    const weight = raw.weight === undefined ? 400 : Number(raw.weight)
    if (![400, 500, 600, 700, 800].includes(weight)) throw Object.assign(new Error(`fonts[${index}].weight 无效`), { code: 'PLUGIN_UI_VALUE_OUT_OF_RANGE' })
    const style = raw.style === 'italic' ? 'italic' : 'normal'
    return { id, source, weight, style, family: pluginId ? `plugin:${pluginId}/${id}` : '' }
  })
}

function fontAssetUrl(plugin, source) {
  const encoded = plugin?.files?.[source]
  return encoded ? `data:font/woff2;base64,${encoded}` : ''
}

export function validateFontFiles(fonts, files) {
  let total = 0
  for (const font of fonts) {
    const encoded = files?.[font.source]
    if (!encoded) throw Object.assign(new Error(`插件字体不存在：${font.source}`), { code: 'PLUGIN_UI_SCHEMA_INVALID' })
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
    if (bytes.byteLength > 2 * 1024 * 1024) throw Object.assign(new Error(`插件字体超过 2 MiB：${font.source}`), { code: 'PLUGIN_UI_VALUE_OUT_OF_RANGE' })
    if (bytes.length < 4 || bytes[0] !== 0x77 || bytes[1] !== 0x4f || bytes[2] !== 0x46 || bytes[3] !== 0x32) throw Object.assign(new Error(`插件字体文件头无效：${font.source}`), { code: 'PLUGIN_UI_SCHEMA_INVALID' })
    total += bytes.byteLength
  }
  if (total > 8 * 1024 * 1024) throw Object.assign(new Error('插件字体总大小超过 8 MiB'), { code: 'PLUGIN_UI_VALUE_OUT_OF_RANGE' })
  return true
}


