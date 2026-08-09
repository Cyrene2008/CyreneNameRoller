import { COMPONENT_STYLE_PROPERTIES, getComponentTarget } from './componentRegistry'

const HOST_FONTS = new Set(['host:ui', 'host:display', 'host:numeric'])
const FONT_ALIAS_PATTERN = /^plugin:([a-z0-9]+(?:[._-][a-z0-9]+)+)\/([a-z][a-z0-9._-]{0,63})$/
const COLOR_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_PATTERN = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i
const FORBIDDEN_VALUE = /url\s*\(|var\s*\(|calc\s*\(|env\s*\(|image-set\s*\(|@import|[{};<>\\]/i
const FORBIDDEN_PROPERTIES = new Set(['selector', 'css', 'cssFile', 'display', 'visibility', 'content', 'position', 'inset', 'top', 'left', 'right', 'bottom', 'zIndex', 'z-index', 'pointerEvents', 'pointer-events', 'overflow', 'transform', 'opacity'])

export function policyError(code, message, details = {}) {
  const error = new Error(message)
  error.code = code
  Object.assign(error, details)
  return error
}

function fail(code, message, details) { throw policyError(code, message, details) }

function normalizeColor(value, label) {
  const source = String(value || '').trim()
  if (COLOR_PATTERN.test(source)) return source.toLowerCase()
  const rgb = source.match(RGB_PATTERN)
  if (!rgb || rgb.slice(1, 4).some(channel => Number(channel) > 255)) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${label} 颜色值无效`)
  if (source.toLowerCase().startsWith('rgba') && rgb[4] === undefined) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${label} rgba 缺少透明度`)
  return source.replace(/\s+/g, ' ')
}

function rgb(value) {
  const source = String(value || '')
  const hex = source.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const raw = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1]
    return [0, 2, 4].map(index => parseInt(raw.slice(index, index + 2), 16))
  }
  const match = source.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i)
  return match ? match.slice(1).map(Number) : null
}

function contrastRatio(foreground, background) {
  const channel = value => {
    const normalized = value / 255
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  }
  const luminance = color => color.map(channel).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

const RANGE = {
  scale: [0.8, 1.5], lineHeight: [1.1, 1.8], radius: [0, 16], borderWidth: [0, 3],
  fontSize: [8, 120], fontWeight: [400, 800]
}
const ENUMS = {
  size: new Set(['small', 'medium', 'large']), padding: new Set(['compact', 'normal', 'comfortable']),
  gap: new Set(['compact', 'normal', 'comfortable']), shadow: new Set(['none', 'small', 'medium', 'large']),
  alignment: new Set(['start', 'center', 'end']), density: new Set(['compact', 'normal', 'comfortable'])
}

const TARGET_SIZE_VALUES = Object.freeze({
  'navigation.dock': { small: '200px', medium: '240px', large: '280px' },
  'roller.current-list': { small: '280px', medium: '360px', large: '480px' },
  'roller.filters': { small: '240px', medium: '280px', large: '340px' },
  'roller.primary-action': { small: '240px', medium: '280px', large: '340px' },
  'roller.result': { small: '44px', medium: '64px', large: '88px' },
  'card.controls': { small: '64px', medium: '80px', large: '96px' },
  'card.deck': { small: '120px', medium: '140px', large: '170px' },
  'card.item': { small: '120px', medium: '140px', large: '170px' },
  'lottery.result': { small: '32px', medium: '48px', large: '72px' },
  'statistics.summary': { small: '64px', medium: '80px', large: '96px' }
})

const TARGET_DENSITY_VALUES = Object.freeze({
  'app.title-bar': { compact: '34px', normal: '40px', comfortable: '48px' },
  'navigation.dock': { compact: '6px', normal: '8px', comfortable: '12px' }
})

function normalizeProperty(property, value, descriptor, label, pluginId = '') {
  if (FORBIDDEN_PROPERTIES.has(property) || !COMPONENT_STYLE_PROPERTIES.includes(property)) fail('PLUGIN_UI_PROPERTY_NOT_ALLOWED', `${label}.${property} 不允许`)
  if (!descriptor.allowedStyles.includes(property)) fail(descriptor.visibilityPolicy === 'protected' ? 'PLUGIN_UI_PROTECTED_TARGET' : 'PLUGIN_UI_PROPERTY_NOT_ALLOWED', `${label}.${property} 不允许用于目标 ${descriptor.id}`)
  if (['foreground', 'background', 'accent', 'borderColor'].includes(property)) return normalizeColor(value, `${label}.${property}`)
  if (property === 'fontFamily') {
    const font = String(value || '')
    if (HOST_FONTS.has(font)) return font
    const match = font.match(FONT_ALIAS_PATTERN)
    if (!match || (pluginId && match[1] !== pluginId) || descriptor.allowPluginFonts !== true) fail(descriptor.allowPluginFonts !== true ? 'PLUGIN_UI_FONT_NOT_ALLOWED_FOR_TARGET' : 'PLUGIN_UI_VALUE_OUT_OF_RANGE', `${label}.fontFamily 不允许`)
    return font
  }
  if (RANGE[property]) {
    const number = Number(value)
    if (!Number.isFinite(number) || number < RANGE[property][0] || number > RANGE[property][1] || (property === 'fontWeight' && ![400, 500, 600, 700, 800].includes(number))) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${label}.${property} 超出允许范围`)
    return number
  }
  if (ENUMS[property]) {
    const normalized = String(value)
    if (!ENUMS[property].has(normalized)) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${label}.${property} 值无效`)
    return normalized
  }
  if (typeof value === 'string' && FORBIDDEN_VALUE.test(value)) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${label}.${property} 包含不安全值`)
  return value
}

export function normalizeComponentStylePack(value, declaration = {}, { platform = 'web', pluginId = '' } = {}) {
  const id = String(declaration.id || value?.id || '')
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('PLUGIN_UI_SCHEMA_INVALID', `组件样式包 ${id} 无效`)
  if (!id || !/^[a-z][a-z0-9._-]{0,63}$/.test(id)) fail('PLUGIN_UI_SCHEMA_INVALID', `组件样式包 ${id || 'unknown'} ID 无效`)
  const targets = value.targets
  if (!targets || typeof targets !== 'object' || Array.isArray(targets)) fail('PLUGIN_UI_SCHEMA_INVALID', `组件样式包 ${id} 缺少 targets`)
  const normalizedTargets = {}
  for (const [targetId, rawStyles] of Object.entries(targets)) {
    const descriptor = getComponentTarget(targetId, platform)
    if (!descriptor) fail('PLUGIN_UI_UNKNOWN_TARGET', `未知组件目标：${targetId}`)
    if (!descriptor.available) continue
    if (!rawStyles || typeof rawStyles !== 'object' || Array.isArray(rawStyles)) fail('PLUGIN_UI_SCHEMA_INVALID', `${targetId} 样式无效`)
    const styles = {}
    for (const [property, raw] of Object.entries(rawStyles)) styles[property] = normalizeProperty(property, raw, descriptor, `${id}.${targetId}`, pluginId)
    const foreground = rgb(styles.foreground)
    const background = rgb(styles.background)
    if (descriptor.visibilityPolicy === 'protected' || descriptor.visibilityPolicy === 'required') {
      if ((styles.foreground && !foreground) || (styles.background && !background)) fail('PLUGIN_UI_CONTRAST_TOO_LOW', `${targetId} 权威目标颜色必须是不透明颜色`)
      const combinations = foreground && background
        ? [[foreground, background]]
        : foreground
          ? [[foreground, [255, 247, 252]], [foreground, [31, 23, 29]]]
          : background
            ? [[[42, 23, 35], background], [[245, 238, 243], background]]
            : []
      if (combinations.some(([fg, bg]) => contrastRatio(fg, bg) < 4.5)) fail('PLUGIN_UI_CONTRAST_TOO_LOW', `${targetId} 前景与背景对比度低于 4.5:1`)
    }
    normalizedTargets[targetId] = styles
  }
  return { id, title: String(value.title || declaration.title || id).slice(0, 120), description: String(value.description || '').slice(0, 300), targets: normalizedTargets }
}

export function normalizeComponentStylePacks(value, permissions, options = {}) {
  if (value === undefined) return []
  if (!permissions.includes('ui:component-styles')) fail('PLUGIN_PERMISSION_DENIED', 'componentStylePacks 需要 ui:component-styles 权限')
  if (!Array.isArray(value) || value.length > 16) fail('PLUGIN_UI_SCHEMA_INVALID', 'componentStylePacks 最多 16 项')
  const ids = new Set()
  return value.map((declaration, index) => {
    if (!declaration || typeof declaration !== 'object' || !/^[a-z][a-z0-9._-]{0,63}$/.test(declaration.id || '') || ids.has(declaration.id)) fail('PLUGIN_UI_SCHEMA_INVALID', `componentStylePacks[${index}] ID 无效或重复`)
    ids.add(declaration.id)
    return normalizeComponentStylePack(declaration.data || declaration, declaration, options)
  })
}

export function styleVarsForTarget(targetId, styles = {}) {
  const slug = String(targetId).replace(/[^a-z0-9]+/gi, '-')
  const vars = {}
  const map = { foreground: 'foreground', background: 'background', accent: 'accent', fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', lineHeight: 'line-height', radius: 'radius', borderColor: 'border-color', borderWidth: 'border-width', shadow: 'shadow', alignment: 'alignment', scale: 'scale', padding: 'padding', gap: 'gap', density: 'density', size: 'size' }
  const semantic = { compact: '6px', normal: '10px', comfortable: '16px' }
  const shadows = { none: 'none', small: '0 1px 4px rgba(0,0,0,.12)', medium: '0 2px 10px rgba(0,0,0,.16)', large: '0 6px 24px rgba(0,0,0,.2)' }
  for (const [key, value] of Object.entries(styles)) {
    if (!map[key]) continue
    let normalized = value
    if (['padding', 'gap'].includes(key)) normalized = semantic[value] || value
    if (key === 'size') normalized = TARGET_SIZE_VALUES[targetId]?.[value] || value
    if (key === 'density') normalized = TARGET_DENSITY_VALUES[targetId]?.[value] || semantic[value] || value
    if (key === 'shadow') normalized = shadows[value] || 'none'
    if (key === 'fontFamily') normalized = value === 'host:ui' ? 'var(--font-ui)' : value === 'host:display' ? 'var(--font-display)' : value === 'host:numeric' ? 'var(--font-num)' : `'${String(value).replace(/'/g, '')}'`
    if (key === 'scale') normalized = String(value)
    if (['fontSize', 'radius', 'borderWidth'].includes(key) && typeof value === 'number') normalized = `${value}px`
    vars[`--plugin-component-${slug}-${map[key]}`] = normalized
  }
  return vars
}

export const HOST_FONT_ALIASES = HOST_FONTS
