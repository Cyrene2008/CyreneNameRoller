import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import { executeCoreCardRequest } from '../src/core/web/coreService.js'
import { normalizeCoreCardInput } from '../src/core/protocol.js'

const state = {
  names: {
    currentListId: 'list-1',
    lists: {
      'list-1': {
        id: 'list-1',
        groups: [],
        names: [
          { id: 'person-1', cn: 'A', en: 'A', isWhiteList: false },
          { id: 'person-2', cn: 'B', en: 'B', isWhiteList: true }
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
})

test('CardView does not write the Records Store directly', async () => {
  const source = await fs.readFile(new URL('../src/views/CardView.vue', import.meta.url), 'utf8')
  assert.match(source, /coreClient\.commitCard/)
  assert.doesNotMatch(source, /recordsStore\.addRecord|recordsStore\.appendRecords/)
})
