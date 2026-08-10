import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeUiTree } from '../src/ui-tree.js'
import { buildRenderPlan } from '../src/ui-tree-render-plan.js'
import { uiTreeControlMapping, uiTreeLayoutMapping } from '../src/ui-tree-mappings.js'
import { UI_TREE_CONTROL_TYPES, UI_TREE_LAYOUT_TYPES } from '../src/ui-tree-schema.js'

const fixtureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

const tree = normalizeUiTree({
  schemaVersion: 1,
  root: {
    type: 'page',
    id: 'demo',
    title: '示例页面',
    children: [
      { type: 'section', title: '设置', children: [
        { type: 'row', children: [
          { type: 'toggle', id: 't1', label: '启用', path: 'settings.darkMode' },
          { type: 'slider', id: 's1', label: '比例', path: 'settings.uiScale', min: 50, max: 200, step: 10 }
        ] },
        { type: 'select', id: 'sel', label: '模式', path: 'plugin.storage.mode', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }
      ] },
      { type: 'card', title: '操作', children: [
        { type: 'button', id: 'btn', label: '执行抽取', variant: 'primary', action: { method: 'draw.execute', args: { count: 1 } } },
        { type: 'badge', id: 'b1', text: '已连接', tone: 'success' },
        { type: 'progress', id: 'p1', path: 'ui.state.progress' }
      ] },
      { type: 'list', id: 'list', itemsPath: 'core.records', template: { type: 'row', children: [
        { type: 'text', path: 'item.time' }
      ] } }
    ]
  }
}, { pluginId: 'demo' })

const dataContext = {
  settings: { darkMode: true, uiScale: 100 },
  pluginStorage: { mode: 'b' },
  uiState: { progress: 42 },
  core: { records: [{ time: 1700000000000 }, { time: 1700000001000 }] }
}

test('渲染计划：绑定值解析与结构确定性', () => {
  const plan = buildRenderPlan(tree, dataContext)
  assert.equal(plan.schemaVersion, 1)
  assert.equal(plan.nodeCount, 13)
  const toggle = plan.root.children[0].children[0].children[0]
  assert.equal(toggle.binding.value, true)
  const progress = plan.root.children[1].children[2]
  assert.equal(progress.binding.value, 42)
  const button = plan.root.children[1].children[0]
  assert.equal(button.action.method, 'draw.execute')
})

test('渲染计划：golden 快照（双端一致的基准产物）', () => {
  const plan = buildRenderPlan(tree, dataContext)
  const goldenPath = path.join(fixtureRoot, 'sample-render-plan.json')
  const serialized = JSON.stringify(plan, null, 2)
  if (!fs.existsSync(goldenPath)) fs.writeFileSync(goldenPath, serialized)
  assert.equal(serialized, fs.readFileSync(goldenPath, 'utf8'))
})

test('控件映射：交集清单覆盖全部语义类型', () => {
  for (const kind of UI_TREE_CONTROL_TYPES) {
    const mapping = uiTreeControlMapping(kind)
    assert.ok(mapping, `${kind} 缺少双端映射`)
    assert.ok(mapping.vue)
    assert.ok(mapping.avalonia)
  }
  for (const kind of UI_TREE_LAYOUT_TYPES) {
    const mapping = uiTreeLayoutMapping(kind)
    assert.ok(mapping, `${kind} 缺少双端映射`)
    assert.ok(mapping.vue)
    assert.ok(mapping.avalonia)
  }
  assert.equal(uiTreeControlMapping('iframe'), null)
})
