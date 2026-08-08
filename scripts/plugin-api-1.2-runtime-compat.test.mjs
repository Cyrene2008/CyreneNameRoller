import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const tempRoot = path.join(root, 'build-output', 'plugin-api-1.2-runtime')
const fixtureRoot = path.join(root, 'scripts', 'fixtures', 'plugin-api-1.2')

async function bundle(entry, name) {
  const outfile = path.join(tempRoot, name)
  await fs.mkdir(tempRoot, { recursive: true })
  await build({ entryPoints: [path.join(root, entry)], bundle: true, write: true, outfile, platform: 'browser', format: 'esm', target: ['es2022'], legalComments: 'none' })
  return import(`${pathToFileURL(outfile).href}?v=${Date.now()}-${Math.random()}`)
}

const parser = await bundle('src/plugins/package.js', 'parser.mjs')
const runtimeModule = await bundle('src/plugins/runtime.js', 'runtime.mjs')
const platformModule = await bundle('src/plugins/platform.js', 'platform.mjs')

const blobSources = new Map()
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL
const originalWorker = globalThis.Worker

URL.createObjectURL = blob => {
  const id = `blob:compat-${crypto.randomUUID()}`
  blobSources.set(id, blob)
  return id
}
URL.revokeObjectURL = id => { blobSources.delete(id) }

class CompatibilityWorker {
  constructor(url) {
    this.onmessage = null
    this.onerror = null
    this.terminated = false
    this.ready = blobSources.get(url)?.text().then(source => {
      const worker = this
      const context = {
        self: {
          postMessage(message) {
            queueMicrotask(() => worker.onmessage?.({ data: message }))
          },
          onmessage: null
        },
        console: { log() {}, warn() {}, error() {}, info() {}, debug() {}, table() {}, trace() {} },
        crypto: globalThis.crypto,
        TextEncoder,
        TextDecoder,
        atob,
        btoa,
        setTimeout,
        clearTimeout,
        clearInterval,
        setInterval,
        structuredClone,
        URL,
        Blob,
        Function,
        Object,
        Array,
        Math,
        JSON,
        Date,
        RegExp,
        Map,
        Set,
        Promise
      }
      context.globalThis = context.self
      vm.createContext(context)
      this.context = context
      try {
        vm.runInContext(source, context, { timeout: 5000 })
      } catch (error) {
        this.onerror?.({ message: error.message })
        throw error
      }
    })
  }

  postMessage(message) {
    this.ready.then(() => {
      if (!this.terminated) this.context.self.onmessage?.({ data: structuredClone(message) })
    }).catch(error => this.onerror?.({ message: error.message }))
  }

  terminate() { this.terminated = true }
}

globalThis.Worker = CompatibilityWorker

test.after(() => {
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
  globalThis.Worker = originalWorker
})

async function loadFixture(name, expectedHash) {
  const bytes = await fs.readFile(path.join(fixtureRoot, name))
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expectedHash)
  const plugin = await parser.parsePluginPackage(new Uint8Array(bytes))
  assert.equal(plugin.manifest.engine.min, '1.2.0')
  assert.equal(plugin.manifest.engine.max, '1.2.0')
  plugin.enabled = true
  return plugin
}

function createRuntime(plugin, calls) {
  const platformBridge = new platformModule.PluginPlatformBridge()
  return new runtimeModule.PluginRuntime({
    getPlugin: id => id === plugin.manifest.id ? plugin : null,
    savePluginData: async (pluginId, key, value) => { calls.storage.push({ pluginId, key, value }); return true },
    loadPluginData: async (pluginId, key) => { calls.storageReads.push({ pluginId, key }); return { fixture: true } },
    showBanner: payload => { calls.banners.push(payload); return true },
    getCoreSnapshot: async kind => ({ kind, totalCount: 1 }),
    executeCoreDraw: async (targetPlugin, args) => {
      calls.draws.push({ pluginId: targetPlugin.manifest.id, args })
      return {
        operationId: 'compat-operation', pluginId: targetPlugin.manifest.id, listId: 'compat-list', target: 'people',
        count: 1, allowDuplicates: false, gender: 'all', algorithm: 'CAF', algorithmVersion: '3.1.1',
        committedAt: '2026-08-08T00:00:00.000Z', results: ['Alice']
      }
    },
    selectFile: async () => null,
    playAudio: async () => true,
    platformBridge,
    onFault: (pluginId, error) => { calls.faults.push({ pluginId, error }) }
  })
}

test('unrepacked API 1.2 basic plugin activates, receives events and cleans principals', async () => {
  const plugin = await loadFixture('basic-1.0.0.cnrp', '927376ccaa59ba4ca46c26597f13582ff8a96db52e6b9f9051b963e6df8be778')
  const calls = { storage: [], storageReads: [], banners: [], draws: [], faults: [] }
  const runtime = createRuntime(plugin, calls)

  await runtime.activate(plugin)
  assert.ok(runtime.workers.has(plugin.manifest.id))
  assert.equal(runtime.legacyPrincipals.has(plugin.manifest.id), false)

  const legacySnapshot = await runtime.handleRpc(plugin.manifest.id, 'storage.read', { key: 'settings' })
  assert.deepEqual(legacySnapshot, { fixture: true })
  const legacyPrincipal = runtime.legacyPrincipals.get(plugin.manifest.id)
  assert.equal(legacyPrincipal?.legacyPrincipal, true)

  await runtime.dispatch('draw:result', { operationId: 'compat-operation', results: ['Alice'] })
  await runtime.invokeCommand(plugin.manifest.id, 'refresh')
  assert.equal(calls.faults.length, 0)

  await runtime.deactivate(plugin.manifest.id)
  assert.equal(runtime.workers.has(plugin.manifest.id), false)
  assert.equal([...runtime.principals].some(([, principal]) => principal.pluginId === plugin.manifest.id), false)
  await assert.rejects(() => runtime.handleRpc(legacyPrincipal, 'storage.read', { key: 'settings' }), error => error.code === 'PLUGIN_INSTANCE_REVOKED')
})

test('unrepacked API 1.2 sound-effects native page remains installable on Web', async () => {
  const plugin = await loadFixture('sound-effects-1.1.1.cnrp', '8e48702b19442606beb1fba3795a943292642c3e6beee32b4bad41d52b742d2a')
  const calls = { storage: [], storageReads: [], banners: [], draws: [], faults: [] }
  const runtime = createRuntime(plugin, calls)

  await runtime.activate(plugin)
  assert.equal(runtime.workers.has(plugin.manifest.id), true)
  assert.equal(runtime.pages.get(`${plugin.manifest.id}:sound-settings`).native.type, 'settings')
  await runtime.deactivate(plugin.manifest.id)
  assert.equal(runtime.pages.has(`${plugin.manifest.id}:sound-settings`), false)
})
