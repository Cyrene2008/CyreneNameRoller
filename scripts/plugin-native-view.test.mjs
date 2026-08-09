import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

const output = path.resolve(import.meta.dirname, '../build-output/plugin-stage4/native.mjs')
await build({ entryPoints: [path.resolve(import.meta.dirname, '../src/plugins/ui/nativeViewPolicy.js')], bundle: true, write: true, outfile: output, platform: 'browser', format: 'esm' })
const native = await import(`${pathToFileURL(output).href}?v=${Date.now()}`)

test('原生视图 Schema 限制节点、图标、表达式和 Receipt 绑定', () => {
  const valid = native.normalizeNativeViewDocument({ schemaVersion: 1, root: { type: 'Stack', props: { gap: 'normal' }, children: [
    { type: 'Text', bindings: { text: '$resource.statistics.totalCount' } },
    { type: 'Button', props: { label: 'Draw', icon: 'draw' }, action: { command: 'draw-one', args: { count: 1 } } }
  ] } })
  assert.equal(valid.nodeCount, 3)
  assert.throws(() => native.normalizeNativeViewDocument({ schemaVersion: 1, root: { type: 'Icon', props: { icon: 'fluent:evil' } } }), error => error.code === 'PLUGIN_UI_ICON_NOT_ALLOWED')
  assert.throws(() => native.normalizeNativeViewDocument({ schemaVersion: 1, root: { type: 'Text', bindings: { text: '$receipt.results' } } }), error => error.code === 'PLUGIN_UI_RESOURCE_BINDING_DENIED')
  assert.throws(() => native.normalizeNativeViewDocument({ schemaVersion: 1, root: { type: 'Text', props: { html: '<b>x</b>' } } }), error => error.code === 'PLUGIN_UI_SCHEMA_INVALID')
})

test('原生视图只开放首批三个 slot，uses 权限必须显式声明', () => {
  const declaration = [{ id: 'assistant', title: 'Assistant', slot: 'slot:roller.side-panel', source: 'ui/assistant.json', uses: ['statistics:read'] }]
  assert.deepEqual(native.normalizeNativeViews(declaration, ['ui:native-views', 'statistics:read'])[0].slot, 'slot:roller.side-panel')
  assert.throws(() => native.normalizeNativeViews([{ ...declaration[0], slot: 'slot:app.command-palette' }], ['ui:native-views']), error => error.code === 'PLUGIN_UI_SCHEMA_INVALID')
  assert.throws(() => native.normalizeNativeViews(declaration, ['ui:native-views']), error => error.code === 'PLUGIN_PERMISSION_DENIED')
})
