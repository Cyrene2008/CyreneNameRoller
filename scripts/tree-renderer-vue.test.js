const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const root = path.resolve(__dirname, '..')
const plan = JSON.parse(fs.readFileSync(path.join(root, 'packages/cyrene-core/test/fixtures/sample-render-plan.json'), 'utf8'))

test('Vue 映射器：渲染计划生成组件描述符', async () => {
  const { vueTreeDescriptors } = await import(pathToFileURL(path.join(root, 'src/plugins/ui/treeRenderer.js')))
  const descriptor = vueTreeDescriptors(plan)
  assert.equal(descriptor.component, 'div')
  assert.equal(descriptor.props.title, '示例页面')

  const flat = []
  const walk = node => {
    flat.push(node)
    for (const child of node.children || []) walk(child)
  }
  walk(descriptor)

  const button = flat.find(node => node.props.id === 'btn')
  assert.equal(button.component, 'FluentButton')
  assert.equal(button.props.variant, 'primary')
  assert.deepEqual(button.action, { method: 'draw.execute', args: { count: 1 } })

  const toggle = flat.find(node => node.props.id === 't1')
  assert.equal(toggle.component, 'FluentToggle')
  assert.equal(toggle.props.modelValue, true)

  const progress = flat.find(node => node.props.id === 'p1')
  assert.equal(progress.component, 'FluentProgressBar')
  assert.equal(progress.props.modelValue, 42)
})
