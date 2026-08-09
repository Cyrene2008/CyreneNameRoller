import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createPinia, setActivePinia } from 'pinia'

const root = path.resolve(import.meta.dirname, '..')
const outputRoot = path.join(root, 'build-output', 'safe-mode')

async function bundle(entry, name, options = {}) {
  await fs.mkdir(outputRoot, { recursive: true })
  const outfile = path.join(outputRoot, `${name}.mjs`)
  await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    write: true,
    outfile,
    platform: 'browser',
    format: 'esm',
    target: ['es2022'],
    legalComments: 'none',
    ...options
  })
  return import(`${pathToFileURL(outfile).href}?v=${Date.now()}-${name}`)
}

const safeMode = await bundle('src/plugins/safeMode.js', 'parser')

function jsonResponse(value, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return value } }
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) }
  }
}

test('safemode.json 使用 enable 字段并对损坏配置 fail closed', () => {
  assert.equal(safeMode.parseSafeModeConfig({ enable: false }).enabled, false)
  assert.equal(safeMode.parseSafeModeConfig({ enable: true }).enabled, true)
  for (const enable of ['true', 1, null]) {
    const status = safeMode.parseSafeModeConfig({ enable })
    assert.equal(status.enabled, true)
    assert.equal(status.errorCode, 'SAFE_MODE_CONFIG_INVALID')
  }
  for (const value of [null, [], '']) {
    assert.equal(safeMode.parseSafeModeConfig(value).enabled, true)
  }
  assert.equal(safeMode.parseSafeModeConfig({ enable: false, futureField: true }).enabled, false)
  assert.match(safeMode.parseSafeModeConfig({ enable: false, futureField: true }).diagnostic, /futureField/)
})

test('Web 缺失配置关闭安全模式，损坏 JSON 开启安全模式', async () => {
  const missing = await safeMode.loadSafeModeStatus({
    fetchImpl: async () => jsonResponse(null, 404),
    storage: memoryStorage(),
    baseUrl: '/classroom/'
  })
  assert.equal(missing.enabled, false)
  assert.equal(missing.source, 'missing')
  assert.equal(missing.path, 'http://localhost/classroom/safemode.json')

  const invalid = await safeMode.loadSafeModeStatus({
    fetchImpl: async () => ({ ok: true, status: 200, async json() { throw new SyntaxError('bad json') } }),
    storage: memoryStorage(),
    baseUrl: '/classroom/'
  })
  assert.equal(invalid.enabled, true)
  assert.equal(invalid.errorCode, 'SAFE_MODE_CONFIG_INVALID')
})

test('Web 仅对同一部署来源沿用最近成功状态并标记 stale', async () => {
  const storage = memoryStorage()
  const first = await safeMode.loadSafeModeStatus({ fetchImpl: async () => jsonResponse({ enable: true }), storage, baseUrl: '/one/' })
  assert.equal(first.enabled, true)

  const stale = await safeMode.loadSafeModeStatus({ fetchImpl: async () => { throw new Error('offline') }, storage, baseUrl: '/one/' })
  assert.equal(stale.enabled, true)
  assert.equal(stale.source, 'stale')
  assert.equal(stale.stale, true)

  const otherDeployment = await safeMode.loadSafeModeStatus({ fetchImpl: async () => { throw new Error('offline') }, storage, baseUrl: '/two/' })
  assert.equal(otherDeployment.enabled, false)
  assert.equal(otherDeployment.source, 'unavailable')
})

test('配置仅在重新加载时生效，当前状态对象不可变', async () => {
  let enable = false
  const fetchImpl = async () => jsonResponse({ enable })
  const current = await safeMode.loadSafeModeStatus({ fetchImpl, storage: memoryStorage() })
  enable = true
  assert.equal(current.enabled, false)
  assert.equal(Object.isFrozen(current), true)
  const restarted = await safeMode.loadSafeModeStatus({ fetchImpl, storage: memoryStorage() })
  assert.equal(restarted.enabled, true)
})

test('安全模式初始化不读取插件状态、不创建 Worker、不注册贡献', async () => {
  const originalStorage = globalThis.localStorage
  const originalWorker = globalThis.Worker
  let reads = 0
  let workers = 0
  globalThis.localStorage = {
    getItem() { reads += 1; return null },
    setItem() {},
    removeItem() {}
  }
  globalThis.Worker = class { constructor() { workers += 1 } }
  try {
    const storeModule = await bundle('src/plugins/store.js', 'store', { packages: 'external' })
    setActivePinia(createPinia())
    const store = storeModule.usePluginsStore()
    store.configureSafeMode({ enabled: true, source: 'file', stale: false })
    await store.initialize()
    assert.equal(await store.activateEnabled(), false)
    assert.equal(reads, 0)
    assert.equal(workers, 0)
    assert.deepEqual(store.enabledPlugins, [])
    assert.deepEqual(store.contributedPages, [])
    assert.deepEqual(store.contributedCommands, [])
    assert.deepEqual(store.contributedVisualSurfaces, [])
    assert.deepEqual(store.contributedComponentStylePacks, [])
    assert.deepEqual(store.contributedComponentOverridePacks, [])
    assert.deepEqual(store.contributedNativeViews, [])
    await assert.rejects(() => store.requestPlugin('cn.example.blocked', 'host.describe', {}), error => error.code === 'SAFE_MODE_PLUGIN_BLOCKED')
  } finally {
    globalThis.localStorage = originalStorage
    globalThis.Worker = originalWorker
  }
})

test('安全模式检查早于应用和插件初始化，Service Worker 不缓存配置', async () => {
  const [main, serviceWorker, config, pluginManager] = await Promise.all([
    fs.readFile(path.join(root, 'src/main.js'), 'utf8'),
    fs.readFile(path.join(root, 'public/sw.js'), 'utf8'),
    fs.readFile(path.join(root, 'public/safemode.json'), 'utf8'),
    fs.readFile(path.join(root, 'src/views/PluginManagerView.vue'), 'utf8')
  ])
  assert.ok(main.indexOf('await loadSafeModeStatus') < main.indexOf('createPinia()'))
  assert.match(serviceWorker, /safemode\.json/)
  assert.match(serviceWorker, /cache:\s*'no-store'/)
  assert.match(pluginManager, /:disabled="plugins\.safeModeStatus\.enabled" @click="importLocal"/)
  assert.match(pluginManager, /:disabled="loading \|\| plugins\.safeModeStatus\.enabled"/)
  assert.match(pluginManager, /function catalogInstallDisabled\(item\) \{ return plugins\.safeModeStatus\.enabled \|\|/)
  assert.deepEqual(JSON.parse(config), { enable: false })
})
