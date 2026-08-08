import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

const output = path.resolve(import.meta.dirname, '../build-output/plugin-component-style/policy.mjs')
await build({ entryPoints: [path.resolve(import.meta.dirname, '../src/plugins/ui/stylePolicy.js')], bundle: true, write: true, outfile: output, platform: 'browser', format: 'esm' })
const policy = await import(`${pathToFileURL(output).href}?v=${Date.now()}`)
const parserOutput = path.resolve(import.meta.dirname, '../build-output/plugin-component-style/parser.mjs')
await build({ entryPoints: [path.resolve(import.meta.dirname, '../src/plugins/package.js')], bundle: true, write: true, outfile: parserOutput, platform: 'browser', format: 'esm' })
const parser = await import(`${pathToFileURL(parserOutput).href}?v=${Date.now()}`)

test('组件注册表冻结 13 个目标并报告 Web 标题栏不可用', async () => {
  const registry = await import(`${pathToFileURL(path.resolve(import.meta.dirname, '../src/plugins/ui/componentRegistry.js')).href}?v=${Date.now()}`)
  assert.equal(registry.COMPONENT_TARGET_IDS.length, 13)
  assert.equal(registry.getComponentTarget('app.title-bar', 'web').available, false)
  assert.equal(registry.getComponentTarget('roller.filters', 'web').visibilityPolicy, 'optional')
  assert.deepEqual(registry.getComponentTarget('roller.filters', 'web').selector, ['.switches', '.multi-settings'])
})

test('组件样式包拒绝未知目标、选择器、变量和低对比度', () => {
  const permissions = ['ui:component-styles']
  assert.throws(() => policy.normalizeComponentStylePacks([{ id: 'x', targets: { 'unknown.target': { foreground: '#000' } } }], permissions, { pluginId: 'cn.example.x' }), error => error.code === 'PLUGIN_UI_UNKNOWN_TARGET')
  assert.throws(() => policy.normalizeComponentStylePacks([{ id: 'x', targets: { 'roller.filters': { css: '.x{}' } } }], permissions, { pluginId: 'cn.example.x' }), error => error.code === 'PLUGIN_UI_PROPERTY_NOT_ALLOWED')
  assert.throws(() => policy.normalizeComponentStylePacks([{ id: 'x', targets: { 'roller.filters': { background: 'var(--x)' } } }], permissions, { pluginId: 'cn.example.x' }), error => error.code === 'PLUGIN_UI_VALUE_OUT_OF_RANGE')
  assert.throws(() => policy.normalizeComponentStylePacks([{ id: 'x', targets: { 'roller.result': { foreground: '#777', background: '#888' } } }], permissions, { pluginId: 'cn.example.x' }), error => error.code === 'PLUGIN_UI_CONTRAST_TOO_LOW')
})

test('权威目标拒绝插件字体，辅助筛选目标允许同插件字体', () => {
  const permissions = ['ui:component-styles']
  assert.throws(() => policy.normalizeComponentStylePacks([{ id: 'x', targets: { 'roller.result': { fontFamily: 'plugin:cn.example.x/rounded' } } }], permissions, { pluginId: 'cn.example.x' }), error => error.code === 'PLUGIN_UI_FONT_NOT_ALLOWED_FOR_TARGET')
  const normalized = policy.normalizeComponentStylePacks([{ id: 'x', targets: { 'roller.filters': { fontFamily: 'plugin:cn.example.x/rounded', padding: 'comfortable' } } }], permissions, { pluginId: 'cn.example.x' })
  assert.equal(normalized[0].targets['roller.filters'].fontFamily, 'plugin:cn.example.x/rounded')
  assert.equal(policy.styleVarsForTarget('roller.filters', normalized[0].targets['roller.filters'])['--plugin-component-roller-filters-padding'], '16px')
})

test('宿主清单解析器接收组件样式包并保持旧权限拒绝路径', () => {
  const base = { schemaVersion: 1, id: 'cn.example.styles', name: 'Styles', version: '1.0.0', author: 'Test', engine: { min: '1.2.0', max: '1.3.0' }, entry: 'worker.js' }
  const manifest = { ...base, permissions: ['ui:component-styles'], contributes: { componentStylePacks: [{ id: 'large', title: 'Large', targets: { 'roller.primary-action': { fontFamily: 'host:ui', fontWeight: 700, foreground: '#ffffff', background: '#000000' } } }] } }
  const normalized = parser.normalizePluginManifest(manifest)
  assert.equal(normalized.contributes.componentStylePacks[0].targets['roller.primary-action'].fontFamily, 'host:ui')
  assert.throws(() => parser.normalizePluginManifest({ ...base, contributes: { componentStylePacks: manifest.contributes.componentStylePacks } }), error => error.code === 'PLUGIN_PERMISSION_DENIED')
})
