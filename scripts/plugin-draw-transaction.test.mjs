import assert from 'node:assert/strict'
import test from 'node:test'
import { commitCoreDrawTransaction, createCoreDrawQueue, validateCoreDrawArgs } from '../src/plugins/coreDraw.js'

function fakeStores({ failRecordsSave = false } = {}) {
  const statisticsStore = {
    counts: {},
    totalCount: 0,
    snapshotState() { return { counts: { ...this.counts }, totalCount: this.totalCount } },
    restoreState(snapshot) { this.counts = { ...snapshot.counts }; this.totalCount = snapshot.totalCount },
    incrementCounts(people) {
      for (const person of people) {
        this.counts[person.id] = (this.counts[person.id] || 0) + 1
        this.totalCount += 1
      }
    },
    async save() {}
  }
  let shouldFail = failRecordsSave
  const recordsStore = {
    records: [],
    snapshotState() { return this.records.map(record => ({ ...record })) },
    restoreState(snapshot) { this.records = snapshot.map(record => ({ ...record })) },
    appendRecords(records) { this.records.unshift(...records.map(record => ({ ...record }))) },
    async save() {
      if (shouldFail) {
        shouldFail = false
        throw new Error('simulated records failure')
      }
    }
  }
  return { statisticsStore, recordsStore }
}

test('the core draw queue serializes work across different plugins', async () => {
  const queue = createCoreDrawQueue()
  const order = []
  let active = 0
  let maximumActive = 0
  const run = id => queue(async () => {
    active += 1
    maximumActive = Math.max(maximumActive, active)
    order.push(`${id}:start`)
    await new Promise(resolve => setTimeout(resolve, 8))
    order.push(`${id}:end`)
    active -= 1
  })
  await Promise.all([run('a'), run('b'), run('c')])
  assert.equal(maximumActive, 1)
  assert.deepEqual(order, ['a:start', 'a:end', 'b:start', 'b:end', 'c:start', 'c:end'])
})

test('draw.execute only accepts host-owned filter parameters', () => {
  assert.deepEqual(validateCoreDrawArgs({ listId: 'list', target: 'people', count: 2, allowDuplicates: false, gender: 'all' }), {
    listId: 'list', target: 'people', count: 2, allowDuplicates: false, gender: 'all'
  })
  for (const args of [{ results: ['person-0001'] }, { weights: { 'person-0001': 999 } }, { history: [] }]) {
    assert.throws(() => validateCoreDrawArgs(args), /draw\.execute 不允许插件指定参数/)
  }
})

test('the host transaction appends statistics and records together', async () => {
  const { statisticsStore, recordsStore } = fakeStores()
  const person = { id: 'person-0001', isWhiteList: false }
  await commitCoreDrawTransaction({
    statisticsStore,
    recordsStore,
    picks: [person],
    records: [{ personId: person.id, operationId: 'operation-1', pluginId: 'cn.example.plugin' }],
    countStatistics: true
  })
  assert.equal(statisticsStore.counts[person.id], 1)
  assert.equal(statisticsStore.totalCount, 1)
  assert.equal(recordsStore.records.length, 1)
})

test('the host transaction rolls back both stores when persistence fails', async () => {
  const { statisticsStore, recordsStore } = fakeStores({ failRecordsSave: true })
  const person = { id: 'person-0001', isWhiteList: false }
  await assert.rejects(commitCoreDrawTransaction({
    statisticsStore,
    recordsStore,
    picks: [person],
    records: [{ personId: person.id, operationId: 'operation-1', pluginId: 'cn.example.plugin' }],
    countStatistics: true
  }), /simulated records failure/)
  assert.deepEqual(statisticsStore.counts, {})
  assert.equal(statisticsStore.totalCount, 0)
  assert.deepEqual(recordsStore.records, [])
})

test('rollback waits for every original persistence write before restoring durable state', async () => {
  let statisticsSaveCalls = 0
  let recordsSaveCalls = 0
  const durable = { statistics: null, records: null }
  const statisticsStore = {
    counts: {},
    totalCount: 0,
    snapshotState() { return { counts: { ...this.counts }, totalCount: this.totalCount } },
    restoreState(snapshot) { this.counts = { ...snapshot.counts }; this.totalCount = snapshot.totalCount },
    incrementCounts(people) {
      for (const person of people) {
        this.counts[person.id] = (this.counts[person.id] || 0) + 1
        this.totalCount += 1
      }
    },
    async save() {
      statisticsSaveCalls += 1
      const snapshot = this.snapshotState()
      if (statisticsSaveCalls === 1) await new Promise(resolve => setTimeout(resolve, 20))
      durable.statistics = snapshot
    }
  }
  const recordsStore = {
    records: [],
    snapshotState() { return this.records.map(record => ({ ...record })) },
    restoreState(snapshot) { this.records = snapshot.map(record => ({ ...record })) },
    appendRecords(records) { this.records.unshift(...records.map(record => ({ ...record }))) },
    async save() {
      recordsSaveCalls += 1
      if (recordsSaveCalls === 1) throw new Error('simulated immediate records failure')
      durable.records = this.snapshotState()
    }
  }
  const person = { id: 'person-0001', isWhiteList: false }

  await assert.rejects(commitCoreDrawTransaction({
    statisticsStore,
    recordsStore,
    picks: [person],
    records: [{ personId: person.id, operationId: 'operation-1', pluginId: 'cn.example.plugin' }],
    countStatistics: true
  }), /simulated immediate records failure/)

  assert.deepEqual(durable.statistics, { counts: {}, totalCount: 0 })
  assert.deepEqual(durable.records, [])
})
