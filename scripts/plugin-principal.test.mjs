import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import {
  assertActivePrincipal,
  createLegacyPrincipal,
  createPluginPrincipal,
  revokePrincipal
} from '../src/plugins/ui/principal.js'

async function loadRuntime() {
  const output = path.resolve(import.meta.dirname, '../build-output/plugin-principal/runtime.mjs')
  await fs.mkdir(path.dirname(output), { recursive: true })
  await build({ entryPoints: [path.resolve(import.meta.dirname, '../src/plugins/runtime.js')], bundle: true, platform: 'browser', format: 'esm', outfile: output })
  return import(`${pathToFileURL(output).href}?v=${Date.now()}`)
}

test('PluginPrincipal freezes identity and grants while allowing revocation', () => {
  const principal = createPluginPrincipal({
    pluginId: 'cn.example.plugin', instanceId: 'page:1', kind: 'page', contributionId: 'settings',
    grants: ['storage:read'], platform: 'web'
  })
  assert.equal(principal.grants.has('storage:read'), true)
  assert.equal(principal.grants.add, undefined)
  assert.deepEqual([...principal.grants], ['storage:read'])
  assert.equal(assertActivePrincipal(principal), principal)
  revokePrincipal(principal)
  assert.throws(() => assertActivePrincipal(principal), error => error.code === 'PLUGIN_INSTANCE_REVOKED' && error.message === '插件实例已撤销')
})

test('legacy handleRpc adapts to the principal-aware authorization kernel', async () => {
  const { PluginRuntime } = await loadRuntime()
  const plugin = { enabled: true, manifest: { id: 'cn.example.legacy', permissions: ['storage:read'], contributes: {}, engine: { min: '1.2.0', max: '1.2.0' } } }
  const runtime = new PluginRuntime({
    getPlugin: id => id === plugin.manifest.id ? plugin : null,
    savePluginData: async () => true,
    loadPluginData: async id => ({ id }),
    showBanner: () => {}, getCoreSnapshot: async () => null, executeCoreDraw: async () => null,
    selectFile: async () => null, playAudio: async () => true,
    platformBridge: { info: () => ({ runtime: 'web' }), capabilities: () => ({}), request: async () => ({ ok: false }) },
    onFault: () => {}
  })
  assert.deepEqual(await runtime.handleRpc(plugin.manifest.id, 'storage.read', { key: 'settings' }), { id: plugin.manifest.id })
  const legacy = runtime.legacyPrincipals.get(plugin.manifest.id)
  assert.equal(legacy.legacyPrincipal, true)
  assert.equal(legacy.kind, 'worker')

  const restricted = createPluginPrincipal({
    pluginId: plugin.manifest.id, instanceId: 'page:restricted', kind: 'page', contributionId: 'restricted', grants: [], platform: 'web'
  })
  await assert.rejects(() => runtime.handleRpc(restricted, 'storage.read', { key: 'settings' }), error => {
    assert.equal(error.code, 'PLUGIN_PERMISSION_DENIED')
    assert.equal(error.message, '插件未获授权：storage:read')
    return true
  })
  revokePrincipal(restricted)
  await assert.rejects(() => runtime.handleRpc(restricted, 'host.describe'), error => error.code === 'PLUGIN_INSTANCE_REVOKED')
})

test('legacy principal keeps API 1.2 plugin-wide grants', () => {
  const principal = createLegacyPrincipal({ manifest: { id: 'cn.example.old', permissions: ['names:read', 'draw:execute'] } }, 'tauri')
  assert.equal(principal.instanceId, 'legacy:cn.example.old')
  assert.equal(principal.platform, 'tauri')
  assert.deepEqual([...principal.grants], ['names:read', 'draw:execute'])
})
