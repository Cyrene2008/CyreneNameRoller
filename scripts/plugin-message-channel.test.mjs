import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

async function loadRuntime() {
  const output = path.resolve(import.meta.dirname, '../build-output/plugin-message-channel/runtime.mjs')
  await fs.mkdir(path.dirname(output), { recursive: true })
  await build({ entryPoints: [path.resolve(import.meta.dirname, '../src/plugins/runtime.js')], bundle: true, platform: 'browser', format: 'esm', outfile: output })
  return import(`${pathToFileURL(output).href}?v=${Date.now()}`)
}

test('API 1.3 iframe RPC is bound to a MessagePort principal', async () => {
  const { PluginRuntime } = await loadRuntime()
  const plugin = { enabled: true, manifest: { id: 'cn.example.page', permissions: ['storage:read'], contributes: {}, engine: { min: '1.3.0' } } }
  const reads = []
  const runtime = new PluginRuntime({
    getPlugin: id => id === plugin.manifest.id ? plugin : null,
    savePluginData: async () => true,
    loadPluginData: async id => { reads.push(id); return { owner: id } },
    showBanner: () => {}, getCoreSnapshot: async () => null, executeCoreDraw: async () => null,
    selectFile: async () => null, playAudio: async () => true,
    platformBridge: { info: () => ({ runtime: 'web' }), capabilities: () => ({}), request: async () => ({ ok: false }) },
    onFault: () => {}
  })
  let pluginPort
  const frame = { contentWindow: { postMessage(message, target, ports) { assert.equal(message.type, 'cyrene-plugin-connect'); pluginPort = ports[0] } } }
  runtime.mountFrame(frame, plugin.manifest.id, 'settings')
  const principal = runtime.principalForFrame(plugin.manifest.id, 'settings')
  assert.equal(principal.kind, 'page')
  assert.equal(runtime.connectFrame(frame, plugin.manifest.id, 'settings'), true)

  const response = new Promise(resolve => { pluginPort.onmessage = event => resolve(event.data); pluginPort.start?.() })
  pluginPort.postMessage({ type: 'rpc-request', id: 'request-1', pluginId: 'cn.example.forged', method: 'storage.read', args: { key: 'settings' } })
  assert.deepEqual(await response, { type: 'rpc-response', id: 'request-1', result: { owner: plugin.manifest.id } })
  assert.deepEqual(reads, [plugin.manifest.id])

  runtime.unmountFrame(plugin.manifest.id, 'settings')
  assert.equal(principal.active, false)
})

test('API 1.2 iframe remains on the source-checked window.message path', async () => {
  const { PluginRuntime } = await loadRuntime()
  const plugin = { enabled: true, manifest: { id: 'cn.example.old-page', permissions: [], contributes: {}, engine: { min: '1.2.0', max: '1.2.0' } } }
  const source = {}
  const runtime = new PluginRuntime({
    getPlugin: id => id === plugin.manifest.id ? plugin : null,
    savePluginData: async () => true, loadPluginData: async () => null,
    showBanner: () => {}, getCoreSnapshot: async () => null, executeCoreDraw: async () => null,
    selectFile: async () => null, playAudio: async () => true,
    platformBridge: { info: () => ({ runtime: 'web' }), capabilities: () => ({}), request: async () => ({ ok: false }) },
    onFault: () => {}
  })
  const frame = { contentWindow: source }
  runtime.mountFrame(frame, plugin.manifest.id, 'legacy')
  assert.equal(runtime.connectFrame(frame, plugin.manifest.id, 'legacy'), false)
  assert.equal(runtime.ownsFrameSource(source, plugin.manifest.id), true)
})

test('PluginPageView connects ports while AppLayout keeps the legacy listener', async () => {
  const page = await fs.readFile(new URL('../src/views/PluginPageView.vue', import.meta.url), 'utf8')
  const layout = await fs.readFile(new URL('../src/components/layout/AppLayout.vue', import.meta.url), 'utf8')
  assert.match(page, /plugins\.connectPageFrame\(frameRef\.value/)
  assert.match(layout, /window\.addEventListener\('message', onPluginMessage\)/)
})
