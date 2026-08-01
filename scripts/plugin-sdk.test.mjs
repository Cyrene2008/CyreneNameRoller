import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import vm from 'node:vm'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createTemplate, packDirectory, validateDirectory } from '../packages/cyrene-name-roller/bin/cnrp.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')

async function loadApplicationParser(directory) {
  const output = path.join(directory, 'application-plugin-parser.mjs')
  await build({
    entryPoints: [path.join(projectRoot, 'src/plugins/package.js')],
    bundle: true,
    write: true,
    outfile: output,
    platform: 'browser',
    format: 'esm',
    target: ['es2022'],
    legalComments: 'none'
  })
  return import(`${pathToFileURL(output).href}?v=${Date.now()}`)
}

async function loadPlatformBridge(directory) {
  const output = path.join(directory, 'application-plugin-platform.mjs')
  await build({
    entryPoints: [path.join(projectRoot, 'src/plugins/platform.js')],
    bundle: true,
    write: true,
    outfile: output,
    platform: 'browser',
    format: 'esm',
    target: ['es2022'],
    legalComments: 'none'
  })
  return import(`${pathToFileURL(output).href}?v=${Date.now()}`)
}

async function loadPluginRuntime(directory) {
  const output = path.join(directory, 'application-plugin-runtime.mjs')
  await build({
    entryPoints: [path.join(projectRoot, 'src/plugins/runtime.js')],
    bundle: true,
    write: true,
    outfile: output,
    platform: 'browser',
    format: 'esm',
    target: ['es2022'],
    legalComments: 'none'
  })
  return import(`${pathToFileURL(output).href}?v=${Date.now()}`)
}

async function loadPluginCatalog(directory) {
  const output = path.join(directory, 'application-plugin-catalog.mjs')
  await build({
    entryPoints: [path.join(projectRoot, 'src/plugins/catalog.js')],
    bundle: true,
    write: true,
    outfile: output,
    platform: 'browser',
    format: 'esm',
    target: ['es2022'],
    legalComments: 'none'
  })
  return import(`${pathToFileURL(output).href}?v=${Date.now()}`)
}

test('SDK creates, validates and packs a CNRP package accepted by the application parser', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-sdk-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const source = path.join(temporary, 'plugin')
  const output = path.join(temporary, 'example.cnrp')
  await createTemplate(source, 'basic')
  const validation = await validateDirectory(source)
  assert.equal(validation.manifest.schemaVersion, 1)
  const packed = await packDirectory(source, output)
  assert.equal((await fs.readFile(output)).subarray(0, 6).toString('utf8'), 'CNRP1\n')

  const parser = await loadApplicationParser(temporary)
  const parsed = await parser.parsePluginPackage(new Uint8Array(await fs.readFile(output)))
  assert.equal(parsed.manifest.id, packed.manifest.id)
  assert.equal(parsed.manifest.version, '1.0.0')
  assert.equal(parsed.publisherVerified, false)
  const worker = parser.decodePluginFile(parsed, parsed.manifest.entry)
  assert.ok(worker.length > 200)
  assert.doesNotMatch(worker, /from\s+['"]@cyrene2008\/cyrene-name-roller/)
  assert.doesNotMatch(worker, /Result received/)
  const context = {
    self: null,
    globalThis: null,
    console: { log() {}, warn() {}, error() {}, info() {}, debug() {}, table() {}, trace() {} },
    crypto: globalThis.crypto,
    TextEncoder,
    TextDecoder,
    atob,
    btoa,
    setTimeout,
    clearTimeout
  }
  context.self = context
  context.globalThis = context
  vm.runInNewContext(worker, context, { timeout: 5000 })
  assert.equal(typeof context.CyrenePluginModule?.activate, 'function')
  assert.equal(typeof context.CyrenePluginModule?.onEvent, 'function')
})

test('application parser rejects a tampered CNRP package', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-tamper-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const source = path.join(temporary, 'plugin')
  const output = path.join(temporary, 'example.cnrp')
  await createTemplate(source, 'basic')
  await packDirectory(source, output)
  const bytes = await fs.readFile(output)
  const magic = Buffer.from('CNRP1\n')
  const envelope = JSON.parse(bytes.subarray(magic.length).toString('utf8'))
  const replacement = envelope.data[0] === 'A' ? 'B' : 'A'
  envelope.data = replacement + envelope.data.slice(1)
  const tampered = Buffer.concat([magic, Buffer.from(JSON.stringify(envelope), 'utf8')])
  const parser = await loadApplicationParser(temporary)
  await assert.rejects(() => parser.parsePluginPackage(new Uint8Array(tampered)), /解密|认证|封装|篡改/)
})

test('native Fluent settings pages validate and pack without an iframe entry', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-native-page-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const source = path.join(temporary, 'plugin')
  const output = path.join(temporary, 'sound-effects.cnrp')
  await createTemplate(source, 'sound-effects')

  const validation = await validateDirectory(source)
  const nativePage = validation.manifest.contributes.pages[0]
  assert.equal(nativePage.entry, undefined)
  assert.equal(nativePage.native.type, 'settings')
  assert.ok(nativePage.native.controls.some(control => control.type === 'audio'))

  await packDirectory(source, output)
  const parser = await loadApplicationParser(temporary)
  const parsed = await parser.parsePluginPackage(new Uint8Array(await fs.readFile(output)))
  assert.equal(parsed.manifest.contributes.pages[0].native.type, 'settings')
  assert.equal(parsed.manifest.contributes.pages[0].entry, undefined)
})

test('core plugin data exposes read-only snapshots and no write RPCs', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-readonly-core-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const { PluginRuntime } = await loadPluginRuntime(temporary)
  const plugin = {
    manifest: {
      id: 'cn.example.readonly',
      version: '1.0.0',
      permissions: ['names:read', 'records:read', 'statistics:read', 'balance:read'],
      contributes: { pages: [] }
    }
  }
  const snapshots = {
    names: { currentListId: 'list-a', lists: { 'list-a': { names: [] } } },
    records: [{ personId: 'person-a', listId: 'list-a' }],
    statistics: { counts: { 'person-a': 3 }, totalCount: 3 },
    balance: { enabled: true, algorithm: 'Cyrene Balance' }
  }
  const runtime = new PluginRuntime({
    getPlugin: id => id === plugin.manifest.id ? plugin : null,
    savePluginData: async () => true,
    loadPluginData: async () => null,
    showBanner: () => {},
    getCoreSnapshot: async kind => structuredClone(snapshots[kind]),
    selectFile: async () => null,
    playAudio: async () => true,
    platformBridge: {
      info: () => ({ runtime: 'web', os: 'unknown', desktop: false }),
      capabilities: () => ({}),
      request: async () => ({ ok: false })
    },
    onFault: () => {}
  })

  const namesSnapshot = await runtime.handleRpc(plugin.manifest.id, 'names.read', {})
  assert.deepEqual(namesSnapshot, snapshots.names)
  namesSnapshot.lists['list-a'].names.push({ id: 'local-only' })
  assert.deepEqual(await runtime.handleRpc(plugin.manifest.id, 'names.read', {}), snapshots.names)
  assert.deepEqual(await runtime.handleRpc(plugin.manifest.id, 'records.read', {}), snapshots.records)
  assert.deepEqual(await runtime.handleRpc(plugin.manifest.id, 'statistics.read', {}), snapshots.statistics)
  assert.deepEqual(await runtime.handleRpc(plugin.manifest.id, 'balance.read', {}), snapshots.balance)
  for (const method of ['names.write', 'records.write', 'statistics.write', 'balance.write']) {
    await assert.rejects(() => runtime.handleRpc(plugin.manifest.id, method, {}), /不支持的插件请求/)
  }
})

test('plugin catalog resolves the latest GitHub Release asset and digest dynamically', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-catalog-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const { resolveCatalogRelease } = await loadPluginCatalog(temporary)
  const catalogItem = {
    id: 'cn.example.sound',
    name: 'Sound',
    repository: 'example/sound-plugin',
    release: { provider: 'github', channel: 'latest', assetPattern: 'sound-*.cnrp' }
  }
  const resolved = await resolveCatalogRelease(catalogItem, {
    source: 'github',
    fetchImpl: async url => {
      assert.equal(url, 'https://api.github.com/repos/example/sound-plugin/releases/latest')
      return {
        ok: true,
        async json() {
          return {
            tag_name: 'v2.3.4',
            name: '2.3.4',
            draft: false,
            prerelease: false,
            html_url: 'https://github.com/example/sound-plugin/releases/tag/v2.3.4',
            published_at: '2026-08-01T00:00:00Z',
            assets: [{
              name: 'sound-2.3.4.cnrp',
              state: 'uploaded',
              digest: `sha256:${'ab'.repeat(32)}`,
              browser_download_url: 'https://github.com/example/sound-plugin/releases/download/v2.3.4/sound-2.3.4.cnrp'
            }]
          }
        }
      }
    }
  })
  assert.equal(resolved.version, '2.3.4')
  assert.equal(resolved.release.assetName, 'sound-2.3.4.cnrp')
  assert.equal(resolved.sha256, 'ab'.repeat(32))
  assert.match(resolved.downloadUrl, /releases\/download\/v2\.3\.4/)
})

test('repository catalog uses dynamic GitHub Release metadata instead of pinned asset URLs', async () => {
  const catalog = JSON.parse(await fs.readFile(path.join(projectRoot, 'plugins/list.json'), 'utf8'))
  for (const plugin of catalog.plugins) {
    assert.ok(plugin.repository)
    assert.equal(plugin.downloadUrl, undefined)
    assert.equal(plugin.sha256, undefined)
    assert.equal(plugin.version, undefined)
    assert.equal(plugin.release?.provider, 'github')
    assert.match(plugin.release?.assetPattern || '', /\.cnrp$/)
  }
})

test('catalog packages can bind an Ed25519 publisher key', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-signature-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const source = path.join(temporary, 'plugin')
  const output = path.join(temporary, 'signed.cnrp')
  const keyPath = path.join(temporary, 'publisher-private.pem')
  const { privateKey } = crypto.generateKeyPairSync('ed25519')
  await fs.writeFile(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }))
  await createTemplate(source, 'basic')
  const packed = await packDirectory(source, output, { privateKey: keyPath })
  const parser = await loadApplicationParser(temporary)
  const parsed = await parser.parsePluginPackage(new Uint8Array(await fs.readFile(output)), { expectedPublisherKey: packed.envelope.publisherKey })
  assert.equal(parsed.publisherVerified, true)
  await assert.rejects(
    () => parser.parsePluginPackage(new Uint8Array(packed.output), { expectedPublisherKey: Buffer.alloc(44, 1).toString('base64') }),
    /公钥.*不一致/
  )
})

test('platform bridge exposes Web capability status and safely marks native-only operations unavailable', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-bridge-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const { getManifestCompatibility, getCapabilityMap, getCurrentPlatform } = await loadPlatformBridge(temporary)
  const platform = { runtime: 'web', os: 'unknown', desktop: false }
  const capabilities = getCapabilityMap(platform)
  assert.equal(capabilities['system:open-url'].available, true)
  assert.equal(capabilities['system:select-file'].available, true)
  assert.equal(capabilities['system:select-directory'].available, false)
  assert.equal(capabilities['system:reveal-file'].available, false)

  const optional = getManifestCompatibility({
    entry: 'worker.js',
    permissions: ['system:select-directory'],
    capabilities: { 'system:select-directory': { required: false } }
  }, platform)
  assert.equal(optional.compatible, true)
  assert.equal(optional.missing.length, 0)
  assert.equal(optional.degraded, true)

  const required = getManifestCompatibility({
    entry: 'worker.js',
    permissions: ['system:select-directory'],
    capabilities: { 'system:select-directory': { required: true } }
  }, platform)
  assert.equal(required.compatible, false)
  assert.match(required.reason, /选择本地目录/)

  const nativeOnly = getManifestCompatibility({
    platformEntries: { windows: 'worker.windows.js' },
    contributes: { pages: [] },
    permissions: [],
    capabilities: {}
  }, platform)
  assert.equal(nativeOnly.compatible, false)
  assert.match(nativeOnly.reason, /没有适用于当前平台/)
  assert.equal(getCurrentPlatform().runtime, 'web')
})

test('SDK manifest rejects combined command strings instead of fixed program declarations', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cyrene-plugin-platform-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const source = path.join(temporary, 'plugin')
  await createTemplate(source, 'basic')
  const manifestPath = path.join(source, 'manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  manifest.permissions = [...manifest.permissions, 'system:execute']
  manifest.capabilities = {}
  manifest.capabilities['system:execute'] = { required: false, platforms: ['tauri'] }
  manifest.systemOperations = [{
    id: 'bad-shell',
    label: 'Bad shell',
    platforms: ['tauri'],
    command: { program: 'pwsh -Command', args: ['Get-Process'] }
  }]
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  await assert.rejects(() => validateDirectory(source), /system operation|系统操作/)
})
