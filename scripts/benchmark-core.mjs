import { performance } from 'node:perf_hooks'
import { pickCyreneBatch, normalizeCyreneBalanceSettings } from '../packages/cyrene-core/src/balance.js'
import { normalizeStoredSettings } from '../packages/cyrene-core/src/storage.js'
import { normalizeUiTree } from '../packages/cyrene-core/src/ui-tree.js'
import { buildRenderPlan } from '../packages/cyrene-core/src/ui-tree-render-plan.js'
import { normalizePluginManifest } from '../packages/cyrene-core/src/plugin-contract.js'

const iterations = Math.max(1, Number(process.env.CYRENE_BENCH_ITERATIONS || 200))

function bench(name, fn, count = iterations) {
  for (let index = 0; index < Math.min(10, count); index += 1) fn()
  const samples = []
  for (let index = 0; index < count; index += 1) {
    const started = performance.now()
    fn()
    samples.push(performance.now() - started)
  }
  samples.sort((left, right) => left - right)
  const meanMs = samples.reduce((sum, value) => sum + value, 0) / samples.length
  const p95Ms = samples[Math.min(samples.length - 1, Math.ceil(samples.length * 0.95) - 1)]
  console.log(`${name.padEnd(46)} mean ${meanMs.toFixed(3).padStart(9)}ms  p95 ${p95Ms.toFixed(3).padStart(9)}ms  (n=${count})`)
  return { name, meanMs, p95Ms }
}

const people500 = Array.from({ length: 500 }, (_, index) => ({ id: `p-${index}`, cn: `姓名${index}`, en: `Name ${index}`, gender: index % 2 ? 'male' : 'female' }))
const counts = Object.fromEntries(people500.map((person, index) => [person.id, index % 20]))
const settings = { enabled: true }

const rawTree = {
  schemaVersion: 1,
  root: {
    type: 'page',
    id: 'demo',
    children: [
      { type: 'section', children: [
        { type: 'row', children: [
          { type: 'toggle', label: 'A', path: 'settings.darkMode' },
          { type: 'slider', label: 'B', path: 'settings.uiScale', min: 50, max: 200 }
        ] },
        { type: 'select', label: 'C', path: 'plugin.storage.mode', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }
      ] },
      { type: 'card', children: [
        { type: 'button', label: '保存', variant: 'primary', action: { method: 'storage.write', args: {} } },
        { type: 'badge', text: '就绪', tone: 'success' },
        { type: 'list', itemsPath: 'core.records', template: { type: 'row', children: [{ type: 'text', path: 'item.time' }] } }
      ] }
    ]
  }
}
const sampleTree = normalizeUiTree(rawTree, { pluginId: 'demo' })
const freshRawTree = () => JSON.parse(JSON.stringify(rawTree))

const sampleManifest = {
  schemaVersion: 1,
  sdkVersion: 2,
  id: 'cn.example.perf',
  name: 'Perf',
  version: '1.0.0',
  author: 'bench',
  engine: { min: '1.3.0' },
  permissions: ['ui:pages', 'storage:read'],
  entry: 'worker.js',
  ui: { schemaVersion: 1, pages: [{ id: 'perf.main', title: 'Perf', source: 'ui/main.json' }] }
}

const results = []
results.push(bench('balance draw (500 people, 1 pick)', () => pickCyreneBatch(people500, [], counts, normalizeCyreneBalanceSettings(settings), 1, false)))
results.push(bench('balance draw (500 people, 10 picks, dup)', () => pickCyreneBatch(people500, [], counts, normalizeCyreneBalanceSettings(settings), 10, true)))
results.push(bench('settings migration', () => normalizeStoredSettings({ uiScale: 100, language: 'en' })))
results.push(bench('ui tree normalize (10 nodes)', () => normalizeUiTree(freshRawTree(), { pluginId: 'demo' })))
results.push(bench('render plan build (10 nodes)', () => buildRenderPlan(sampleTree, { settings: { darkMode: true }, pluginStorage: { mode: 'a' }, core: { records: [{ time: 1 }] } })))
results.push(bench('manifest validate (v2 + ui)', () => normalizePluginManifest(sampleManifest)))

const envPath = process.env.CYRENE_BENCH_OUTPUT
if (envPath) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(envPath, JSON.stringify(results, null, 2))
}
