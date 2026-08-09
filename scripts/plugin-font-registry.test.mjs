import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

const output = path.resolve(import.meta.dirname, '../build-output/plugin-font-registry/fonts.mjs')
await build({ entryPoints: [path.resolve(import.meta.dirname, '../src/plugins/ui/fontRegistry.js')], bundle: true, write: true, outfile: output, platform: 'browser', format: 'esm' })
const fonts = await import(`${pathToFileURL(output).href}?v=${Date.now()}`)

test('字体声明要求 ui:fonts、包内 woff2 和稳定权重', () => {
  assert.throws(() => fonts.normalizeFonts([{ id: 'rounded', source: 'rounded.woff2' }], []), error => error.code === 'PLUGIN_PERMISSION_DENIED')
  assert.throws(() => fonts.normalizeFonts([{ id: 'rounded', source: '../rounded.woff2' }], ['ui:fonts']), error => error.code === 'PLUGIN_UI_FONT_NOT_ALLOWED')
  assert.throws(() => fonts.normalizeFonts([{ id: 'rounded', source: 'rounded.ttf', weight: 300 }], ['ui:fonts']), error => error.code === 'PLUGIN_UI_FONT_NOT_ALLOWED')
  assert.deepEqual(fonts.normalizeFonts([{ id: 'rounded', source: 'rounded.woff2', weight: 600, style: 'italic' }], ['ui:fonts']), [{ id: 'rounded', source: 'rounded.woff2', weight: 600, style: 'italic', family: '' }])
})

test('字体文件检查 wOFF2 文件头和大小上限', () => {
  const bytes = Uint8Array.from([0x77, 0x4f, 0x46, 0x32, 1, 2])
  const encoded = Buffer.from(bytes).toString('base64')
  assert.equal(fonts.validateFontFiles([{ id: 'rounded', source: 'rounded.woff2' }], { 'rounded.woff2': encoded }), true)
  assert.throws(() => fonts.validateFontFiles([{ id: 'rounded', source: 'rounded.woff2' }], { 'rounded.woff2': Buffer.from('bad').toString('base64') }), error => error.code === 'PLUGIN_UI_SCHEMA_INVALID')
})

test('插件禁用或卸载时移除 FontFace', async () => {
  const added = new Set()
  class MockFontFace {
    constructor(family) { this.family = family }
    async load() { return this }
  }
  const documentImpl = { fonts: { add(face) { added.add(face) }, delete(face) { added.delete(face) } } }
  const registry = new fonts.PluginFontRegistry({ FontFaceImpl: MockFontFace, documentImpl })
  const plugin = { manifest: { id: 'cn.example.fonts' }, files: { 'rounded.woff2': Buffer.from([1, 2, 3]).toString('base64') } }
  await registry.register(plugin, [{ id: 'rounded', source: 'rounded.woff2', weight: 400, style: 'normal' }])
  assert.equal(added.size, 1)
  registry.unregister('cn.example.fonts')
  assert.equal(added.size, 0)
})
