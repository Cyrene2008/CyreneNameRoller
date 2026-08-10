import { HOST_BRIDGE_METHODS } from './host-bridge.js'
import { SETTING_PATH_PATTERN, CONTRIBUTION_ID_PATTERN } from './plugin-contract.js'
import {
  UI_TREE_BINDING_SOURCES,
  UI_TREE_BUTTON_VARIANTS,
  UI_TREE_CONTROL_TYPES,
  UI_TREE_CORE_READONLY_SOURCES,
  UI_TREE_MAX_CHILDREN,
  UI_TREE_MAX_DEPTH,
  UI_TREE_MAX_NODES,
  UI_TREE_MAX_OPTIONS,
  UI_TREE_MAX_TEXT,
  UI_TREE_NODE_TYPES,
  UI_TREE_SCHEMA_VERSION,
  UI_TREE_TONES
} from './ui-tree-schema.js'

const KEY_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i
const ICON_PATTERN = /^[a-z0-9][a-z0-9:_-]{0,99}$/i
const ALLOWED_NODE_FIELDS = new Set([
  'type', 'id', 'title', 'titleEn', 'children', 'action', 'gap',
  'label', 'placeholder', 'rows', 'path', 'itemsPath', 'template',
  'options', 'value', 'text', 'variant', 'tone', 'icon',
  'min', 'max', 'step'
])

function uiTreeError(message) {
  return Object.assign(new Error(message), { code: 'UI_TREE_INVALID' })
}

function nodeLabel(node, path) {
  return `UI 声明树 ${path}（${node?.type || 'unknown'}）`
}

function validateBindingPath(raw, label, writable, { itemContext = false } = {}) {
  if (typeof raw !== 'string' || raw.length > 200) throw uiTreeError(`${label} 绑定路径无效`)
  if (itemContext && (raw === 'item' || raw.startsWith('item.'))) {
    const field = raw.slice('item.'.length)
    if (!field || !KEY_PATTERN.test(field)) throw uiTreeError(`${label} 列表项字段无效：${field}`)
    return { source: 'item', path: raw, writable: false }
  }
  const source = UI_TREE_BINDING_SOURCES
    .filter(candidate => raw === candidate || raw.startsWith(`${candidate}.`))
    .sort((left, right) => right.length - left.length)[0]
  if (!source) throw uiTreeError(`${label} 绑定源不受支持：${raw.split('.')[0]}`)
  const remainder = raw.slice(source.length + 1)
  if (source === 'core') {
    const resource = remainder.split('.')[0]
    if (!UI_TREE_CORE_READONLY_SOURCES.includes(resource)) throw uiTreeError(`${label} 核心快照只读源无效：${resource || '缺失'}`)
    if (remainder.split('.').length > 1 || writable) throw uiTreeError(`${label} 核心快照为只读`)
    return { source, path: raw, writable: false }
  }
  if (!remainder || !KEY_PATTERN.test(remainder)) throw uiTreeError(`${label} 绑定键无效：${remainder}`)
  if (source === 'settings' && !SETTING_PATH_PATTERN.test(remainder)) throw uiTreeError(`${label} 设置键无效：${remainder}`)
  return { source, path: raw, writable: true }
}

function validateAction(action, label) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) throw uiTreeError(`${label} action 无效`)
  const method = String(action.method || '')
  if (!HOST_BRIDGE_METHODS.some(item => item.id === method)) throw uiTreeError(`${label} action 方法不在 HostBridge 契约内：${method}`)
  const args = action.args && typeof action.args === 'object' && !Array.isArray(action.args)
    ? JSON.parse(JSON.stringify(action.args))
    : {}
  return { method, args }
}

function validateText(raw, label, max = UI_TREE_MAX_TEXT) {
  if (typeof raw !== 'string' || raw.length > max) throw uiTreeError(`${label} 文本无效或过长`)
  if (/[{};<>\\]/.test(raw)) throw uiTreeError(`${label} 文本包含不安全内容`)
  return raw
}

function validateOptions(raw, label) {
  if (!Array.isArray(raw) || !raw.length || raw.length > UI_TREE_MAX_OPTIONS) throw uiTreeError(`${label} options 必须包含 1-${UI_TREE_MAX_OPTIONS} 项`)
  const values = new Set()
  return raw.map((option, index) => {
    if (!option || typeof option !== 'object' || Array.isArray(option)) throw uiTreeError(`${label}.options[${index}] 无效`)
    const value = String(option.value || '')
    if (!value || value.length > 200 || values.has(value)) throw uiTreeError(`${label}.options[${index}] value 无效或重复`)
    values.add(value)
    return { value, label: validateText(String(option.label || value), `${label}.options[${index}].label`) }
  })
}

function normalizeControl(node, label, writable, itemContext) {
  const type = node.type
  if (!UI_TREE_CONTROL_TYPES.includes(type)) throw uiTreeError(`${label} 控件类型不受支持：${type}`)
  const result = { type }
  if (type === 'text') {
    if (node.path) result.binding = validateBindingPath(node.path, label, false, { itemContext })
    else result.value = validateText(String(node.value ?? ''), `${label}.value`)
  }
  if (type === 'button') {
    result.label = validateText(String(node.label || ''), `${label}.label`, 120)
    if (node.variant !== undefined) {
      if (!UI_TREE_BUTTON_VARIANTS.includes(node.variant)) throw uiTreeError(`${label} button variant 无效`)
      result.variant = node.variant
    }
    result.action = validateAction(node.action, label)
  }
  if (['text-input', 'multiline-input', 'toggle', 'checkbox', 'slider', 'number-stepper', 'progress'].includes(type)) {
    if (type === 'text-input' || type === 'multiline-input') {
      if (node.label !== undefined) result.label = validateText(String(node.label), `${label}.label`, 120)
      if (node.placeholder !== undefined) result.placeholder = validateText(String(node.placeholder), `${label}.placeholder`, 120)
      if (type === 'multiline-input' && node.rows !== undefined) {
        const rows = Number(node.rows)
        if (!Number.isInteger(rows) || rows < 1 || rows > 16) throw uiTreeError(`${label}.rows 无效`)
        result.rows = rows
      }
    }
    if (['toggle', 'checkbox'].includes(type)) result.label = validateText(String(node.label || ''), `${label}.label`, 120)
    if (type === 'slider' || type === 'number-stepper') {
      if (type === 'slider') {
        if (node.label !== undefined) result.label = validateText(String(node.label), `${label}.label`, 120)
        const min = Number(node.min)
        const max = Number(node.max)
        if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw uiTreeError(`${label} 范围无效`)
        result.min = min
        result.max = max
        if (node.step !== undefined) {
          const step = Number(node.step)
          if (!Number.isFinite(step) || step <= 0) throw uiTreeError(`${label}.step 无效`)
          result.step = step
        }
      }
      if (type === 'number-stepper') {
        if (node.min !== undefined || node.max !== undefined) {
          const min = Number(node.min)
          const max = Number(node.max)
          if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw uiTreeError(`${label} 范围无效`)
          result.min = min
          result.max = max
        }
      }
    }
    if (node.path) result.binding = validateBindingPath(node.path, label, writable, { itemContext })
  }
  if (['radio', 'select'].includes(type)) {
    result.label = validateText(String(node.label || ''), `${label}.label`, 120)
    result.options = validateOptions(node.options, label)
    if (node.path) result.binding = validateBindingPath(node.path, label, writable, { itemContext })
  }
  if (type === 'list') {
    result.itemsPath = validateBindingPath(node.itemsPath, `${label}.itemsPath`, false)
    if (result.itemsPath.writable) throw uiTreeError(`${label} 列表数据源必须为只读`)
    if (!node.template || typeof node.template !== 'object' || Array.isArray(node.template)) throw uiTreeError(`${label}.template 无效`)
    result.template = normalizeNode(node.template, `${label}.template`, writable, 1, true)
  }
  if (type === 'badge') {
    if (node.text !== undefined) result.text = validateText(String(node.text), `${label}.text`, 120)
    else if (node.path) result.binding = validateBindingPath(node.path, label, false, { itemContext })
    else throw uiTreeError(`${label} badge 需要 text 或 path`)
    if (node.tone !== undefined) {
      if (!UI_TREE_TONES.includes(node.tone)) throw uiTreeError(`${label} badge tone 无效`)
      result.tone = node.tone
    }
  }
  if (type === 'icon') {
    const icon = String(node.icon || '')
    if (!ICON_PATTERN.test(icon)) throw uiTreeError(`${label} icon 无效`)
    result.icon = icon
  }
  if (node.action !== undefined) result.action = validateAction(node.action, label)
  return result
}

function normalizeNode(raw, label, writable, depth, itemContext = false) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw uiTreeError(`${label} 节点无效`)
  if (depth > UI_TREE_MAX_DEPTH) throw uiTreeError(`${label} 超过最大嵌套深度 ${UI_TREE_MAX_DEPTH}`)
  const unknownField = Object.keys(raw).find(key => !ALLOWED_NODE_FIELDS.has(key))
  if (unknownField) throw uiTreeError(`${label} 不允许字段 ${unknownField}`)
  const type = String(raw.type || '')
  if (!UI_TREE_NODE_TYPES.includes(type)) throw uiTreeError(`${label} 节点类型不受支持：${type}`)
  if (raw.id !== undefined && !CONTRIBUTION_ID_PATTERN.test(String(raw.id || ''))) throw uiTreeError(`${label} 节点 ID 无效`)
  const result = { type }
  if (raw.id) result.id = String(raw.id)
  if (['page', 'section', 'card'].includes(type)) {
    if (raw.title !== undefined) result.title = validateText(String(raw.title), `${label}.title`, 120)
    if (raw.titleEn !== undefined) result.titleEn = validateText(String(raw.titleEn), `${label}.titleEn`, 120)
  }
  if (type === 'row' || type === 'column') {
    if (raw.gap !== undefined) {
      const gap = Number(raw.gap)
      if (!Number.isFinite(gap) || gap < 0 || gap > 64) throw uiTreeError(`${label}.gap 无效`)
      result.gap = gap
    }
  }
  if (type === 'list') {
    return normalizeControl(raw, label, writable, itemContext)
  }
  if (UI_TREE_CONTROL_TYPES.includes(type)) {
    return normalizeControl(raw, label, writable, itemContext)
  }
  if (raw.children !== undefined) {
    if (!Array.isArray(raw.children) || !raw.children.length || raw.children.length > UI_TREE_MAX_CHILDREN) {
      throw uiTreeError(`${label} children 必须包含 1-${UI_TREE_MAX_CHILDREN} 项`)
    }
    result.children = raw.children.map((child, index) => normalizeNode(child, `${label}.children[${index}]`, writable, depth + 1, itemContext))
  }
  if (raw.action !== undefined) result.action = validateAction(raw.action, label)
  return result
}

export function normalizeUiTree(raw, { pluginId = '' } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw uiTreeError('UI 声明树无效')
  if (raw.schemaVersion !== UI_TREE_SCHEMA_VERSION) throw uiTreeError(`UI 声明树 schemaVersion 必须为 ${UI_TREE_SCHEMA_VERSION}`)
  if (!raw.root || typeof raw.root !== 'object' || Array.isArray(raw.root)) throw uiTreeError('UI 声明树缺少 root')
  if (pluginId && raw.root.type === 'page' && raw.root.id && String(raw.root.id) !== `${pluginId}.main`) {
    if (raw.root.id !== pluginId) throw uiTreeError(`UI 声明树 root.id 与插件 ID 不一致：${raw.root.id}`)
  }
  let nodeCount = 0
  const countNodes = node => {
    nodeCount += 1
    if (nodeCount > UI_TREE_MAX_NODES) throw uiTreeError(`UI 声明树超过最大节点数 ${UI_TREE_MAX_NODES}`)
    for (const child of node.children || []) countNodes(child)
    if (node.template) countNodes(node.template)
  }
  countNodes(raw.root)
  const root = normalizeNode(raw.root, 'root', true, 1)
  return { schemaVersion: UI_TREE_SCHEMA_VERSION, root, nodeCount }
}
