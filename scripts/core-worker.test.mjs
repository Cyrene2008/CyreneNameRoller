import assert from 'node:assert/strict'
import test from 'node:test'
import { createCoreWorkerHandler } from '../src/core/web/core.worker.js'
import { executeCoreDrawRequest } from '../src/core/web/coreService.js'
import { normalizeCoreDrawInput } from '../src/core/protocol.js'
import { commitCoreStateTransaction } from '../src/plugins/coreDraw.js'

const state = {
  names: {
    currentListId: 'list-1',
    lists: {
      'list-1': {
        id: 'list-1',
        groups: [],
        names: [
          { id: 'person-1', cn: '甲', en: 'A', gender: 'male', isWhiteList: false },
          { id: 'person-2', cn: '乙', en: 'B', gender: 'female', isWhiteList: false }
        ]
      }
    }
  },
  records: [],
  statistics: { counts: {}, totalCount: 0 },
  balance: { enabled: true }
}

test('Core 输入拒绝未知字段并规范化宿主字段', () => {
  assert.throws(() => normalizeCoreDrawInput({ listId: 'list-1', results: ['person-1'] }), error => error.code === 'CORE_TRANSACTION_REJECTED')
  assert.deepEqual(normalizeCoreDrawInput({ listId: 'list-1', count: 0 }), {
    listId: 'list-1', target: 'people', count: 1, allowDuplicates: false, gender: 'all'
  })
})

test('Core 事务生成宿主绑定 Receipt 并只返回可提交状态', () => {
  const result = executeCoreDrawRequest({
    state,
    caller: { kind: 'plugin', pluginId: 'cn.example.plugin', operationId: 'op-1' },
    input: { listId: 'list-1', target: 'people', count: 1, allowDuplicates: false, gender: 'all' }
  })
  assert.equal(result.receipt.pluginId, 'cn.example.plugin')
  assert.equal(result.receipt.operationId, 'op-1')
  assert.equal(result.receipt.results.length, 1)
  assert.ok(result.nextStatistics.totalCount >= 0)
  assert.equal(result.nextRecords.length, 1)
  assert.deepEqual(Object.keys(result.receipt.results[0]).sort(), ['englishName', 'id', 'isGroup', 'isWhiteList', 'name'])
})

test('Core Worker 在同步后按请求顺序串行处理并保持状态', async () => {
  const replies = []
  const handler = createCoreWorkerHandler(message => replies.push(message))
  await Promise.all([
    handler({ data: { type: 'state.sync', requestId: 'sync-1', state } }),
    handler({ data: { type: 'draw.execute', requestId: 'draw-1', caller: { kind: 'core-ui', pluginId: 'core', operationId: 'op-1' }, input: { listId: 'list-1', count: 1 } } }),
    handler({ data: { type: 'draw.execute', requestId: 'draw-2', caller: { kind: 'core-ui', pluginId: 'core', operationId: 'op-2' }, input: { listId: 'list-1', count: 1 } } })
  ])
  assert.deepEqual(replies.map(reply => reply.requestId), ['sync-1', 'draw-1', 'draw-2'])
  assert.ok(replies.every(reply => reply.type === 'success'))
  assert.equal(replies[2].value.nextRecords.length, 2)
})

test('Core Worker 在未同步状态时拒绝抽签', async () => {
  const replies = []
  const handler = createCoreWorkerHandler(message => replies.push(message))
  await handler({ data: { type: 'draw.execute', requestId: 'draw-1', caller: { kind: 'core-ui', pluginId: 'core' }, input: { listId: 'list-1' } } })
  assert.equal(replies[0].type, 'error')
  assert.equal(replies[0].code, 'CORE_TRANSACTION_REJECTED')
})

test('Core 状态提交失败时回滚统计和记录', async () => {
  const statisticsStore = {
    state: { counts: { old: 1 }, totalCount: 1 },
    snapshotState() { return structuredClone(this.state) },
    restoreState(next) { this.state = structuredClone(next) },
    async save() { if (this.state.totalCount === 2) throw new Error('save failed') }
  }
  const recordsStore = {
    state: [{ operationId: 'old' }],
    snapshotState() { return structuredClone(this.state) },
    restoreState(next) { this.state = structuredClone(next) },
    async save() {}
  }
  await assert.rejects(commitCoreStateTransaction({
    statisticsStore,
    recordsStore,
    nextStatistics: { counts: { old: 1, next: 1 }, totalCount: 2 },
    nextRecords: [{ operationId: 'new' }, { operationId: 'old' }]
  }), error => error.code === 'CORE_TRANSACTION_ROLLED_BACK')
  assert.deepEqual(statisticsStore.state, { counts: { old: 1 }, totalCount: 1 })
  assert.deepEqual(recordsStore.state, [{ operationId: 'old' }])
})

test('插件 Store 不暴露 Worker、端口或内部请求 ID', async () => {
  const source = await import('node:fs/promises').then(fs => fs.readFile(new URL('../src/plugins/store.js', import.meta.url), 'utf8'))
  assert.doesNotMatch(source, /worker\s*:/)
  assert.doesNotMatch(source, /MessagePort/)
  assert.doesNotMatch(source, /requestId\s*:/)
})

test('Core Client 源码串行化主线程统计和记录提交', async () => {
  const source = await import('node:fs/promises').then(fs => fs.readFile(new URL('../src/core/client.js', import.meta.url), 'utf8'))
  assert.match(source, /this\.commitQueue\s*=\s*Promise\.resolve\(\)/)
  assert.match(source, /this\.commitQueue\.catch\(\(\)\s*=>\s*\{\}\)\.then\(/)
})
