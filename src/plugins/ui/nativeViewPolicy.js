const NODE_TYPES = new Set(['Stack', 'Grid', 'Text', 'Icon', 'Badge', 'Button', 'Toggle', 'Select', 'Range', 'Progress', 'Divider', 'List', 'Table', 'Notice'])
const ICONS = new Set(['draw', 'info', 'warning', 'settings', 'filter', 'history', 'check', 'close', 'add', 'remove', 'refresh'])
const SLOTS = new Set(['slot:roller.side-panel', 'slot:roller.below-result', 'slot:records.toolbar'])
const ALL_SLOTS = new Set([...SLOTS, 'slot:app.command-palette', 'slot:roller.toolbar', 'slot:card.footer', 'slot:lottery.side-panel', 'slot:statistics.section', 'slot:settings.plugin-section'])
const BINDING = /^(\$(?:state|storage|resource|host|receipt))\.[A-Za-z][A-Za-z0-9._-]{0,127}$/
const FORMATTERS = new Set(['number', 'percent', 'date', 'time', 'truncate', 'localizedText'])
const MAX_NODES = 128
const MAX_DEPTH = 12

function fail(code, message) { throw Object.assign(new Error(message), { code }) }
function safeText(value, label, max = 500) {
  const text = String(value || '')
  if (text.length > max || /[<>]/.test(text)) fail('PLUGIN_UI_SCHEMA_INVALID', `${label} 文本无效`)
  return text
}

function normalizeBinding(value, label) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !BINDING.test(value) || /[(){};=]|\beval\b|window|document|globalThis/i.test(value) || value.startsWith('$receipt.')) fail('PLUGIN_UI_RESOURCE_BINDING_DENIED', `${label} 绑定无效`)
  return value
}

function normalizeNode(raw, state, depth, label) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('PLUGIN_UI_SCHEMA_INVALID', `${label} 节点无效`)
  if (depth > MAX_DEPTH) fail('PLUGIN_UI_SCHEMA_INVALID', '原生视图嵌套深度超过 12')
  if (!NODE_TYPES.has(raw.type) || raw.type === 'VerifiedResult') fail('PLUGIN_UI_SCHEMA_INVALID', `${label} 节点类型不允许`)
  state.count += 1
  if (state.count > MAX_NODES) fail('PLUGIN_UI_SCHEMA_INVALID', '原生视图节点超过 128')
  const props = raw.props && typeof raw.props === 'object' && !Array.isArray(raw.props) ? raw.props : {}
  const bindings = raw.bindings && typeof raw.bindings === 'object' && !Array.isArray(raw.bindings) ? raw.bindings : {}
  if (Object.keys(props).some(key => ['class', 'className', 'style', 'html', 'innerHTML', 'onClick', 'handler'].includes(key))) fail('PLUGIN_UI_SCHEMA_INVALID', `${label} 包含禁止属性`)
  const normalized = { type: raw.type, props: {}, bindings: {}, children: [] }
  if (raw.type === 'Icon') {
    const icon = String(props.icon || '')
    if (!ICONS.has(icon)) fail('PLUGIN_UI_ICON_NOT_ALLOWED', `${label} 图标不允许：${icon}`)
    normalized.props.icon = icon
  }
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text' || key === 'label' || key === 'description') normalized.props[key] = safeText(value, `${label}.${key}`, key === 'description' ? 2000 : 500)
    else if (key === 'variant') normalized.props.variant = safeText(value, `${label}.variant`)
    else if (['gap', 'padding', 'density', 'align', 'columns', 'min', 'max', 'step', 'value'].includes(key)) {
      if (typeof value === 'object' || typeof value === 'function') fail('PLUGIN_UI_SCHEMA_INVALID', `${label}.${key} 无效`)
      normalized.props[key] = value
    } else if (key === 'options') {
      if (!Array.isArray(value) || value.length > 32) fail('PLUGIN_UI_SCHEMA_INVALID', `${label}.options 无效`)
      normalized.props.options = value.map(option => ({ value: String(option?.value ?? ''), label: safeText(option?.label || option?.value || '', `${label}.options.label`) }))
    } else if (key !== 'icon') fail('PLUGIN_UI_SCHEMA_INVALID', `${label}.${key} 不允许`)
  }
  for (const [key, value] of Object.entries(bindings)) normalized.bindings[key] = normalizeBinding(value, `${label}.bindings.${key}`)
  if (raw.action !== undefined) {
    if (!raw.action || typeof raw.action !== 'object' || Array.isArray(raw.action) || !/^[a-z][a-z0-9._-]{0,63}$/.test(raw.action.command || '')) fail('PLUGIN_UI_SCHEMA_INVALID', `${label}.action 无效`)
    normalized.action = { command: String(raw.action.command), args: raw.action.args && typeof raw.action.args === 'object' && !Array.isArray(raw.action.args) ? raw.action.args : {} }
  }
  if (Array.isArray(raw.children)) normalized.children = raw.children.map((child, index) => normalizeNode(child, state, depth + 1, `${label}.children[${index}]`))
  return normalized
}

export function normalizeNativeViewDocument(value, label = 'nativeView') {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1 || !value.root) fail('PLUGIN_UI_SCHEMA_INVALID', `${label} Schema 无效`)
  const state = { count: 0 }
  return { schemaVersion: 1, root: normalizeNode(value.root, state, 1, `${label}.root`), nodeCount: state.count }
}

export function normalizeNativeViews(value, permissions, { platform = 'web' } = {}) {
  if (value === undefined) return []
  if (!permissions.includes('ui:native-views')) fail('PLUGIN_PERMISSION_DENIED', 'nativeViews 需要 ui:native-views 权限')
  if (!Array.isArray(value) || value.length > 16) fail('PLUGIN_UI_SCHEMA_INVALID', 'nativeViews 最多 16 项')
  const ids = new Set()
  return value.map((raw, index) => {
    const id = String(raw?.id || '')
    if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id)) fail('PLUGIN_UI_SCHEMA_INVALID', `nativeViews[${index}] ID 无效或重复`)
    ids.add(id)
    const slot = String(raw.slot || '')
    if (!ALL_SLOTS.has(slot)) fail('PLUGIN_UI_SCHEMA_INVALID', `nativeViews[${index}] slot 无效`)
    if (!SLOTS.has(slot)) fail('PLUGIN_UI_SCHEMA_INVALID', `${slot} 当前不可用`)
    const uses = [...new Set(Array.isArray(raw.uses) ? raw.uses.map(String) : [])]
    for (const permission of uses) if (!permissions.includes(permission)) fail('PLUGIN_PERMISSION_DENIED', `${id} 使用了未声明权限：${permission}`)
    const order = raw.order === undefined ? 500 : Number(raw.order)
    if (!Number.isInteger(order) || order < 0 || order > 999) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${id}.order 无效`)
    const source = String(raw.source || '').replace(/\\/g, '/')
    if (!source || !source.toLowerCase().endsWith('.json') || source.startsWith('/') || source.includes('../') || source.includes('/..')) fail('PLUGIN_UI_SCHEMA_INVALID', `${id}.source 无效`)
    return { id, title: safeText(raw.title || id, `${id}.title`), titleEn: safeText(raw.titleEn || '', `${id}.titleEn`), description: safeText(raw.description || '', `${id}.description`, 300), slot, source, uses, order, platform, available: true }
  })
}

export const NATIVE_VIEW_NODE_TYPES = Object.freeze([...NODE_TYPES])
export const NATIVE_VIEW_ICON_ALIASES = Object.freeze([...ICONS])
export const NATIVE_VIEW_SLOTS = Object.freeze([...SLOTS])
