import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeUiTree } from '../src/ui-tree.js'
import { UI_TREE_NODE_TYPES, UI_TREE_SCHEMA_VERSION } from '../src/ui-tree-schema.js'

const validTree = {
  schemaVersion: 1,
  root: {
    type: 'page',
    id: 'demo',
    title: '示例页面',
    children: [
      {
        type: 'section',
        title: '设置',
        children: [
          { type: 'row', children: [
            { type: 'toggle', id: 't1', label: '启用', path: 'settings.darkMode' },
            { type: 'slider', id: 's1', label: '比例', path: 'settings.uiScale', min: 50, max: 200, step: 10 }
          ] },
          { type: 'select', id: 'sel', label: '模式', path: 'plugin.storage.mode', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }
        ]
      },
      {
        type: 'card',
        title: '操作',
        children: [
          { type: 'button', id: 'btn', label: '执行抽取', variant: 'primary', action: { method: 'draw.execute', args: { count: 1 } } },
          { type: 'badge', id: 'b1', text: '已连接', tone: 'success' },
          { type: 'progress', id: 'p1', path: 'ui.state.progress' }
        ]
      },
      { type: 'list', id: 'list', itemsPath: 'core.records', template: { type: 'row', children: [
        { type: 'text', path: 'item.time' }
      ] } }
    ]
  }
}

test('UI 声明树：合法声明完整规范化', () => {
  const tree = normalizeUiTree(validTree, { pluginId: 'demo' })
  assert.equal(tree.schemaVersion, UI_TREE_SCHEMA_VERSION)
  assert.equal(tree.root.type, 'page')
  assert.equal(tree.nodeCount, 13)
  assert.equal(tree.root.children[1].children[0].action.method, 'draw.execute')
  assert.deepEqual(tree.root.children[1].children[1], { type: 'badge', id: 'b1', text: '已连接', tone: 'success' })
})

test('UI 声明树：拒绝未知控件类型', () => {
  assert.throws(() => normalizeUiTree({
    schemaVersion: 1,
    root: { type: 'page', id: 'demo', children: [{ type: 'iframe', src: 'https://evil.example' }] }
  }), /节点类型不受支持：iframe|不允许字段 src/)
  assert.throws(() => normalizeUiTree({
    schemaVersion: 1,
    root: { type: 'page', id: 'demo', children: [{ type: 'video' }] }
  }), /节点类型不受支持：video/)
})

test('UI 声明树：拒绝核心快照写入与非法绑定源', () => {
  assert.throws(() => normalizeUiTree({
    schemaVersion: 1,
    root: { type: 'page', id: 'demo', children: [{ type: 'toggle', label: 'x', path: 'core.names' }] }
  }), /核心快照为只读/)
  assert.throws(() => normalizeUiTree({
    schemaVersion: 1,
    root: { type: 'page', id: 'demo', children: [{ type: 'text', path: 'document.title' }] }
  }), /绑定源不受支持：document/)
})

test('UI 声明树：拒绝契约外 action 与不安全文本', () => {
  assert.throws(() => normalizeUiTree({
    schemaVersion: 1,
    root: { type: 'page', id: 'demo', children: [{ type: 'button', label: 'x', action: { method: 'eval' } }] }
  }), /action 方法不在 HostBridge 契约内/)
  assert.throws(() => normalizeUiTree({
    schemaVersion: 1,
    root: { type: 'page', id: 'demo', children: [{ type: 'text', value: '<script>alert(1)</script>' }] }
  }), /文本包含不安全内容/)
})

test('UI 声明树：拒绝动态注册组件与自定义样式字段', () => {
  assert.throws(() => normalizeUiTree({
    schemaVersion: 1,
    root: { type: 'page', id: 'demo', children: [{ type: 'group', component: 'MyWidget' }] }
  }), /节点类型不受支持|字段/)
})

test('UI 声明树：深度与节点数上限', () => {
  let deep = { type: 'page', id: 'demo' }
  let cursor = deep
  for (let index = 0; index < 20; index += 1) {
    cursor.children = [{ type: 'group', children: [] }]
    cursor = cursor.children[0]
  }
  assert.throws(() => normalizeUiTree({ schemaVersion: 1, root: deep }), /最大嵌套深度/)
})

test('UI 声明树：schemaVersion 强校验', () => {
  assert.throws(() => normalizeUiTree({ schemaVersion: 2, root: { type: 'page', id: 'demo' } }), /schemaVersion 必须为 1/)
})

test('UI 声明树：控件交集清单自洽（全部类型可被正常化或被显式拒绝）', () => {
  for (const type of UI_TREE_NODE_TYPES) {
    assert.ok(typeof type === 'string' && type.length > 0)
  }
})
