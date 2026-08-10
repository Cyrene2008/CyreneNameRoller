export function resolveBinding(binding, dataContext = {}) {
  if (!binding) return undefined
  const { source, path } = binding
  if (source === 'settings') return dataContext.settings?.[path.slice('settings.'.length)]
  if (source === 'plugin') return dataContext.pluginStorage?.[path.slice('plugin.storage.'.length)]
  if (source === 'ui.state') return dataContext.uiState?.[path.slice('ui.state.'.length)]
  if (source === 'core') return dataContext.core?.[path.slice('core.'.length)]
  if (source === 'item') return dataContext.item?.[path.slice('item.'.length)]
  return undefined
}

function planNode(node, dataContext, depth) {
  const plan = { kind: node.type }
  if (node.id) plan.id = node.id
  if (node.title) plan.title = node.title
  if (node.titleEn) plan.titleEn = node.titleEn
  if (node.gap !== undefined) plan.gap = node.gap
  if (node.label) plan.label = node.label
  if (node.variant) plan.variant = node.variant
  if (node.tone) plan.tone = node.tone
  if (node.icon) plan.icon = node.icon
  if (node.rows) plan.rows = node.rows
  if (node.placeholder) plan.placeholder = node.placeholder
  if (node.min !== undefined) plan.min = node.min
  if (node.max !== undefined) plan.max = node.max
  if (node.step !== undefined) plan.step = node.step
  if (node.options) plan.options = node.options
  if (node.value !== undefined) plan.value = node.value
  if (node.text !== undefined) plan.text = node.text
  if (node.action) plan.action = node.action
  if (node.binding) {
    plan.binding = { source: node.binding.source, path: node.binding.path, value: resolveBinding(node.binding, dataContext) }
  }
  if (node.children) plan.children = node.children.map(child => planNode(child, dataContext, depth + 1))
  return plan
}

export function buildRenderPlan(tree, dataContext = {}) {
  if (!tree?.root) throw Object.assign(new Error('UI 渲染计划需要已校验的声明树'), { code: 'UI_TREE_INVALID' })
  const root = planNode(tree.root, dataContext, 1)
  return { schemaVersion: tree.schemaVersion, nodeCount: tree.nodeCount, root }
}
