import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { createCoreWorkerHandler } from '../src/core/web/core.worker.js'

class MemoryStorage {
  constructor(values) {
    this.values = new Map(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]))
    this.failRecordsOnce = false
  }

  get length() { return this.values.size }
  key(index) { return [...this.values.keys()][index] ?? null }
  getItem(key) { return this.values.get(key) ?? null }
  removeItem(key) { this.values.delete(key) }
  clear() { this.values.clear() }

  setItem(key, value) {
    if (key === 'records' && this.failRecordsOnce) {
      this.failRecordsOnce = false
      throw new Error('injected records write failure')
    }
    this.values.set(key, String(value))
  }

  json(key) { return JSON.parse(this.getItem(key)) }
}

class CoreWorkerHarness {
  constructor() {
    this.onmessage = null
    this.onerror = null
    this.handler = createCoreWorkerHandler(message => {
      queueMicrotask(() => this.onmessage?.({ data: structuredClone(message) }))
    })
  }

  postMessage(message) {
    queueMicrotask(() => {
      Promise.resolve(this.handler({ data: structuredClone(message) }))
        .catch(error => this.onerror?.({ message: error?.message || String(error) }))
    })
  }

  terminate() {}
}

test('Core Client only returns a Receipt after durable Web commit and rolls back failures', async () => {
  const originalStorage = globalThis.localStorage
  const originalWorker = globalThis.Worker
  const storage = new MemoryStorage({
    lists: {
      'list-1': {
        id: 'list-1',
        name: 'Test',
        groups: [],
        names: [{ id: 'person-1', cn: 'A', en: 'A', gender: 'male', groupId: '', isWhiteList: false }]
      }
    },
    currentListId: 'list-1',
    balance: { enabled: true },
    statistics: { counts: {}, totalCount: 0 },
    records: []
  })
  globalThis.localStorage = storage
  globalThis.Worker = CoreWorkerHarness
  setActivePinia(createPinia())

  try {
    const { getCoreClient } = await import(`../src/core/client.js?integration=${Date.now()}`)
    const client = getCoreClient()
    const input = { listId: 'list-1', target: 'people', count: 1, allowDuplicates: false, gender: 'all' }
    const caller = operationId => ({ kind: 'core-ui', pluginId: 'core', operationId, countStatistics: true })

    const first = await client.executeDraw({ caller: caller('draw-1'), input })
    assert.equal(first.operationId, 'draw-1')
    assert.equal(storage.json('statistics').totalCount, 1)
    assert.equal(storage.json('records').length, 1)

    storage.failRecordsOnce = true
    await assert.rejects(client.executeDraw({ caller: caller('draw-failed'), input }), error => error.code === 'CORE_TRANSACTION_ROLLED_BACK')
    assert.equal(storage.json('statistics').totalCount, 1)
    assert.equal(storage.json('records').length, 1)

    const third = await client.executeDraw({ caller: caller('draw-3'), input })
    assert.equal(third.operationId, 'draw-3')
    assert.equal(storage.json('statistics').totalCount, 2)
    assert.equal(storage.json('records').length, 2)
  } finally {
    globalThis.localStorage = originalStorage
    globalThis.Worker = originalWorker
  }
})
