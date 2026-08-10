export const UI_TREE_SCHEMA_VERSION = 1

export const UI_TREE_LAYOUT_TYPES = Object.freeze([
  'page', 'section', 'card', 'group', 'row', 'column', 'form'
])

export const UI_TREE_CONTROL_TYPES = Object.freeze([
  'text', 'button', 'text-input', 'multiline-input', 'toggle', 'checkbox',
  'radio', 'select', 'slider', 'number-stepper', 'list', 'badge', 'icon', 'progress'
])

export const UI_TREE_NODE_TYPES = Object.freeze([...UI_TREE_LAYOUT_TYPES, ...UI_TREE_CONTROL_TYPES])

export const UI_TREE_BINDING_SOURCES = Object.freeze([
  'settings',
  'plugin',
  'ui.state',
  'core'
])

export const UI_TREE_CORE_READONLY_SOURCES = Object.freeze([
  'names', 'records', 'statistics', 'balance'
])

export const UI_TREE_BUTTON_VARIANTS = Object.freeze(['primary', 'secondary', 'subtle'])

export const UI_TREE_TONES = Object.freeze(['neutral', 'accent', 'success', 'warning', 'danger'])

export const UI_TREE_MAX_DEPTH = 16
export const UI_TREE_MAX_CHILDREN = 128
export const UI_TREE_MAX_NODES = 512
export const UI_TREE_MAX_OPTIONS = 16
export const UI_TREE_MAX_TEXT = 600

export const UI_TREE_DENIED_FEATURES = Object.freeze([
  '任意 DOM/VisualTree 操作',
  '动态注册组件',
  '注入自定义样式/CSS',
  '原生控件直通',
  '内联脚本执行',
  '未知控件类型'
])
