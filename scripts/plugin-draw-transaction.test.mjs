import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import { validateCoreDrawArgs } from '../src/plugins/coreDraw.js'

test('draw.execute only accepts host-owned filter parameters', () => {
  assert.deepEqual(validateCoreDrawArgs({ listId: 'list', target: 'people', count: 2, allowDuplicates: false, gender: 'all' }), {
    listId: 'list', target: 'people', count: 2, allowDuplicates: false, gender: 'all'
  })
  for (const args of [{ results: ['person-0001'] }, { weights: { 'person-0001': 999 } }, { history: [] }]) {
    assert.throws(() => validateCoreDrawArgs(args), /draw\.execute 不允许插件指定参数/)
  }
})

test('legacy main-thread draw commit helpers and unused storage fallback are removed', async () => {
  const [pluginStore, coreDraw, statisticsStore, recordsStore] = await Promise.all([
    fs.readFile(new URL('../src/plugins/store.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/plugins/coreDraw.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/stores/statistics.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/stores/records.js', import.meta.url), 'utf8')
  ])
  assert.match(pluginStore, /coreClient\.executeDraw/)
  assert.match(coreDraw, /commitCoreStateTransaction/)
  assert.doesNotMatch(coreDraw, /commitCoreDrawTransaction|createCoreDrawQueue/)
  assert.doesNotMatch(statisticsStore, /incrementCounts|initializePersonCount|function clearAll/)
  assert.doesNotMatch(recordsStore, /appendRecords|addRecord|function clearAll/)
  await assert.rejects(fs.access(new URL('../src/utils/safeStorage.js', import.meta.url)))
})
