import { uiTreeControlMapping, uiTreeLayoutMapping } from '../../../packages/cyrene-core/src/ui-tree-mappings.js'

function resolveComponent(kind) {
  return uiTreeControlMapping(kind)?.vue || uiTreeLayoutMapping(kind)?.vue
}

function nodeProps(node) {
  const props = {}
  if (node.id) props.id = node.id
  if (node.title) props.title = node.title
  if (node.titleEn) props.titleEn = node.titleEn
  if (node.label) props.label = node.label
  if (node.variant) props.variant = node.variant
  if (node.tone) props.tone = node.tone
  if (node.icon) props.icon = node.icon
  if (node.rows) props.rows = node.rows
  if (node.placeholder) props.placeholder = node.placeholder
  if (node.min !== undefined) props.min = node.min
  if (node.max !== undefined) props.max = node.max
  if (node.step !== undefined) props.step = node.step
  if (node.options) props.options = node.options
  if (node.text !== undefined) props.text = node.text
  if (node.value !== undefined) props.modelValue = node.value
  if (node.binding) props.modelValue = node.binding.value
  return props
}

function toDescriptor(node) {
  const component = resolveComponent(node.kind)
  if (!component) throw new Error(`渲染计划包含未映射的节点类型：${node.kind}`)
  const descriptor = {
    component,
    key: node.id || `${node.kind}-${Math.random().toString(36).slice(2)}`,
    props: nodeProps(node),
    action: node.action || null
  }
  if (node.children) descriptor.children = node.children.map(toDescriptor)
  return descriptor
}

export function vueTreeDescriptors(plan) {
  if (!plan?.root) throw new Error('渲染计划无效')
  return toDescriptor(plan.root)
}
