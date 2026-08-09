import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import { executeCoreCardRequest, executeCoreMaintenanceRequest } from '../src/core/web/coreService.js'
import { normalizeCoreCardInput, normalizeCoreMaintenanceInput } from '../src/core/protocol.js'

const state = {
  names: {
    currentListId: 'list-1',
    lists: {
      'list-1': {
        id: 'list-1',
        groups: [],
        names: [
          { id: 'person-1', cn: 'A', en: 'A', isWhiteList: false },
          { id: 'person-2', cn: 'B', en: 'B', isWhiteList: true },
          { id: 'person-3', cn: 'C', en: 'C', isWhiteList: false }
        ]
      }
    }
  },
  records: [],
  statistics: { counts: {}, totalCount: 0 },
  balance: { enabled: true }
}

test('Card uses an independent host transaction and CardReceipt', () => {
  assert.throws(() => normalizeCoreCardInput({ listId: 'list-1', personIds: ['person-1'], results: [] }), error => error.code === 'CORE_TRANSACTION_REJECTED')
  assert.throws(() => executeCoreCardRequest({
    state,
    caller: { kind: 'plugin', pluginId: 'cn.example.plugin', operationId: 'card-op' },
    input: { listId: 'list-1', personIds: ['person-1'] }
  }), error => error.code === 'PLUGIN_PERMISSION_DENIED')
  assert.throws(() => executeCoreCardRequest({
    state,
    caller: { kind: 'core-ui', pluginId: 'core', operationId: 'card-op' },
    input: { listId: 'list-1', personIds: ['person-2'] }
  }), error => error.code === 'CORE_TRANSACTION_REJECTED')

  const value = executeCoreCardRequest({
    state,
    caller: { kind: 'core-ui', pluginId: 'core', operationId: 'card-op' },
    input: { listId: 'list-1', personIds: ['person-1'] }
  })
  assert.equal(value.receipt.kind, 'card')
  assert.equal(value.receipt.operationId, 'card-op')
  assert.equal(value.receipt.results[0].id, 'person-1')
  assert.equal(value.nextRecords[0].source, 'card')
  assert.equal(value.nextStatistics.totalCount, 0)

  const batch = executeCoreCardRequest({
    state,
    caller: { kind: 'core-ui', pluginId: 'core', operationId: 'card-batch' },
    input: { listId: 'list-1', personIds: ['person-1', 'person-3'] }
  })
  assert.equal(batch.receipt.operationId, 'card-batch')
  assert.deepEqual(batch.receipt.results.map(result => result.id), ['person-1', 'person-3'])
  assert.equal(batch.nextRecords.length, 2)
})

test('CardView does not write the Records Store directly', async () => {
  const source = await fs.readFile(new URL('../src/views/CardView.vue', import.meta.url), 'utf8')
  assert.match(source, /coreClient\.commitCard/)
  assert.match(source, /personIds: chosen\.map\(person => person\.id\)/)
  assert.match(source, /const operation = \{ id: receipt\.operationId/)
  assert.doesNotMatch(source, /recordsStore\.addRecord|recordsStore\.appendRecords/)
})

test('record clearing uses a host-only maintenance transaction', () => {
  assert.throws(() => normalizeCoreMaintenanceInput({ action: 'clear-records', records: [] }), error => error.code === 'CORE_TRANSACTION_REJECTED')
  assert.throws(() => executeCoreMaintenanceRequest({
    state: { ...state, records: [{ operationId: 'old' }] },
    caller: { kind: 'plugin', pluginId: 'cn.example.plugin' },
    input: { action: 'clear-records' }
  }), error => error.code === 'PLUGIN_PERMISSION_DENIED')
  const value = executeCoreMaintenanceRequest({
    state: { ...state, records: [{ operationId: 'old' }] },
    caller: { kind: 'core-ui', pluginId: 'core', operationId: 'clear-1' },
    input: { action: 'clear-records' }
  })
  assert.equal(value.receipt.kind, 'maintenance')
  assert.equal(value.receipt.action, 'clear-records')
  assert.deepEqual(value.nextRecords, [])
  assert.deepEqual(value.nextStatistics, state.statistics)
})

test('new-person statistics are computed inside the maintenance transaction', () => {
  const sourceState = {
    ...state,
    records: [{ operationId: 'old' }],
    statistics: { counts: { 'person-1': 2 }, totalCount: 2 }
  }
  const value = executeCoreMaintenanceRequest({
    state: sourceState,
    caller: { kind: 'core-ui', pluginId: 'core', operationId: 'initialize-person-person-3' },
    input: { action: 'initialize-person-count', listId: 'list-1', personId: 'person-3', mode: 'midpoint' }
  })
  assert.equal(value.nextStatistics.counts['person-3'], 2)
  assert.equal(value.nextStatistics.totalCount, 4)
  assert.deepEqual(value.nextRecords, sourceState.records)
  assert.throws(() => executeCoreMaintenanceRequest({
    state: sourceState,
    caller: { kind: 'core-ui', pluginId: 'core' },
    input: { action: 'initialize-person-count', listId: 'list-1', personId: 'person-2', mode: 'zero' }
  }), error => error.code === 'CORE_TRANSACTION_REJECTED')
})

test('Settings routes record clearing and Tauri reset through core maintenance', async () => {
  const [settings, lists, statistics, bridge, tauri] = await Promise.all([
    fs.readFile(new URL('../src/views/SettingsView.vue', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/views/ListsView.vue', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/stores/statistics.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/utils/dataBridge.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/utils/tauriAPI.js', import.meta.url), 'utf8')
  ])
  assert.match(settings, /coreClient\.clearRecords/)
  assert.doesNotMatch(settings, /recordsStore\.clearAll/)
  assert.match(bridge, /coreMaintenanceExecute\('reset-all'\)/)
  assert.match(tauri, /core_maintenance_execute/)
  assert.match(lists, /coreClient\.initializePersonCount/)
  assert.doesNotMatch(lists, /statisticsStore\.initializePersonCount/)
  assert.doesNotMatch(statistics, /initializePersonCount,|clearAll,/)
})
