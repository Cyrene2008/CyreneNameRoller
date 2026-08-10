const TARGETS = new Set(['roller.result'])
const LAYOUTS = new Set(['single', 'list', 'grid', 'spotlight'])
const SIZES = new Set(['small', 'medium', 'large'])
const ALIGNMENTS = new Set(['start', 'center', 'end'])

function fail(code, message) { throw Object.assign(new Error(message), { code }) }

export function normalizeResultPresentations(value, permissions) {
  if (value === undefined) return []
  if (!permissions.includes('ui:result-presentations')) fail('PLUGIN_PERMISSION_DENIED', 'resultPresentations 需要 ui:result-presentations 权限')
  if (!Array.isArray(value) || value.length > 16) fail('PLUGIN_UI_SCHEMA_INVALID', 'resultPresentations 最多 16 项')
  const ids = new Set()
  return value.map((raw, index) => {
    const id = String(raw?.id || '')
    if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id)) fail('PLUGIN_UI_SCHEMA_INVALID', `resultPresentations[${index}] ID 无效或重复`)
    ids.add(id)
    const targets = [...new Set(Array.isArray(raw.targets) ? raw.targets.map(String) : [])]
    if (!targets.length || targets.some(target => !TARGETS.has(target))) fail('PLUGIN_UI_UNKNOWN_TARGET', `${id} 结果呈现目标不允许`)
    const layout = String(raw.layout || 'single')
    if (!LAYOUTS.has(layout)) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${id}.layout 无效`)
    const style = raw.style && typeof raw.style === 'object' && !Array.isArray(raw.style) ? raw.style : {}
    const normalizedStyle = {}
    if (style.size !== undefined) {
      if (!SIZES.has(String(style.size))) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${id}.style.size 无效`)
      normalizedStyle.size = String(style.size)
    }
    if (style.alignment !== undefined) {
      if (!ALIGNMENTS.has(String(style.alignment))) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${id}.style.alignment 无效`)
      normalizedStyle.alignment = String(style.alignment)
    }
    for (const key of ['showAlgorithm', 'showOperationId', 'showEnglishName']) {
      if (style[key] !== undefined) {
        if (typeof style[key] !== 'boolean') fail('PLUGIN_UI_SCHEMA_INVALID', `${id}.style.${key} 必须是布尔值`)
        normalizedStyle[key] = style[key]
      }
    }
    const unknownStyle = Object.keys(style).find(key => !['size', 'alignment', 'showAlgorithm', 'showOperationId', 'showEnglishName'].includes(key))
    if (unknownStyle) fail('PLUGIN_UI_PROPERTY_NOT_ALLOWED', `${id}.style.${unknownStyle} 不允许`)
    return { id, title: String(raw.title || id).slice(0, 120), titleEn: String(raw.titleEn || '').slice(0, 120), description: String(raw.description || '').slice(0, 300), targets, layout, style: normalizedStyle }
  })
}

export const RESULT_PRESENTATION_TARGETS = Object.freeze([...TARGETS])
export const RESULT_PRESENTATION_LAYOUTS = Object.freeze([...LAYOUTS])
