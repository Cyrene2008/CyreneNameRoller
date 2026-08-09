import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

async function bundle(entry, name) {
  const outfile = path.resolve(import.meta.dirname, `../build-output/plugin-stage3/${name}.mjs`)
  await build({ entryPoints: [path.resolve(import.meta.dirname, '..', entry)], bundle: true, write: true, outfile, platform: 'browser', format: 'esm' })
  return import(`${pathToFileURL(outfile).href}?v=${Date.now()}-${name}`)
}

const [override, safeMode] = await Promise.all([
  bundle('src/plugins/ui/overridePolicy.js', 'override'),
  bundle('src/plugins/safeMode.js', 'safe-mode')
])

test('覆盖包完整预检拒绝 protected/required，并支持 optional 三种布局', () => {
  const permissions = ['ui:component-overrides']
  assert.throws(() => override.normalizeComponentOverridePacks([{ id: 'bad', targets: { 'roller.result': { visibility: 'hidden' } } }], permissions), error => error.code === 'PLUGIN_UI_PROTECTED_TARGET')
  assert.throws(() => override.normalizeComponentOverridePacks([{ id: 'bad', targets: { 'navigation.dock': { visibility: 'hidden' } } }], permissions), error => error.code === 'PLUGIN_UI_REQUIRED_TARGET')
  assert.throws(() => override.normalizeComponentOverridePacks([{ id: 'bad', targets: { 'roller.filters': { visibility: 'replaced' } } }], permissions), error => error.code === 'PLUGIN_UI_REPLACEMENT_UNAVAILABLE')
  const packs = override.normalizeComponentOverridePacks([{ id: 'focus', title: 'Focus', targets: { 'roller.filters': { visibility: 'hidden', layout: 'compact' } } }], permissions)
  assert.deepEqual(packs[0].targets['roller.filters'], { visibility: 'hidden', layout: 'compact' })
})

test('覆盖包应用是原子且撤销后恢复默认', () => {
  const pack = { id: 'focus', targets: { 'roller.filters': { visibility: 'hidden', layout: 'collapse' } } }
  const applied = override.applyOverridePack({}, pack)
  assert.equal(applied['roller.filters'].visibility, 'hidden')
  assert.deepEqual(override.applyOverridePack(applied, pack, { enabled: false }), {})
})

test('Safe Mode 配置损坏强制启用，离线沿用历史并标记 stale', async () => {
  assert.equal(safeMode.parseSafeModeConfig({ enable: true }).enabled, true)
  assert.equal(safeMode.parseSafeModeConfig({ enable: 'yes' }).errorCode, 'SAFE_MODE_CONFIG_INVALID')
  const values = new Map()
  const storage = { getItem(key) { return values.get(key) }, setItem(key, value) { values.set(key, value) } }
  await safeMode.loadSafeModeStatus({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ enable: true }) }), storage, baseUrl: './' })
  const status = await safeMode.loadSafeModeStatus({ fetchImpl: async () => { throw new Error('offline') }, storage, baseUrl: './' })
  assert.equal(status.enabled, true)
  assert.equal(status.stale, true)
  assert.equal(status.errorCode, 'SAFE_MODE_CONFIG_UNAVAILABLE')
})

test('Safe Mode 无历史时默认关闭但保留诊断', async () => {
  const status = await safeMode.loadSafeModeStatus({ fetchImpl: async () => { throw new Error('offline') }, storage: { getItem() { return null } }, baseUrl: './' })
  assert.equal(status.enabled, false)
  assert.equal(status.errorCode, 'SAFE_MODE_CONFIG_UNAVAILABLE')
})
