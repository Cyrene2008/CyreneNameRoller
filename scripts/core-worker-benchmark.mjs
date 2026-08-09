import fs from 'node:fs/promises'
import os from 'node:os'
import { performance } from 'node:perf_hooks'
import { createCoreWorkerHandler } from '../src/core/web/core.worker.js'

const iterations = Math.max(1, Number(process.env.CORE_BENCH_ITERATIONS || 1000))
const sizes = String(process.env.CORE_BENCH_SIZES || '100,10000,100000').split(',').map(Number).filter(Number.isFinite)
const makeState = size => ({
  names: { currentListId: 'list', lists: { list: { id: 'list', groups: [], names: Array.from({ length: size }, (_, index) => ({ id: `person-${index}`, cn: `姓名${index}`, en: `Name ${index}`, gender: 'male', isWhiteList: false })) } } },
  records: [], statistics: { counts: {}, totalCount: 0 }, balance: { enabled: true }
})

async function runCase(candidates, count, allowDuplicates) {
  const replies = new Map()
  let handler
  handler = createCoreWorkerHandler(message => {
    if (message.type === 'commit.request') {
      handler({ data: { type: 'commit.resolve', requestId: message.requestId } })
      return
    }
    replies.get(message.requestId)?.(message)
  })
  let sequence = 0
  const send = message => new Promise((resolve, reject) => {
    const requestId = `bench-${++sequence}`
    replies.set(requestId, response => {
      replies.delete(requestId)
      response.type === 'success' ? resolve(response.value) : reject(new Error(response.message))
    })
    handler({ data: { ...message, requestId } })
  })
  await send({ type: 'state.sync', state: makeState(candidates) })
  const started = performance.now()
  const samples = []
  for (let index = 0; index < iterations; index += 1) {
    const sampleStarted = performance.now()
    await send({ type: 'draw.execute', caller: { kind: 'core-ui', pluginId: 'core', operationId: `bench-op-${index}` }, input: { listId: 'list', count, allowDuplicates } })
    samples.push(performance.now() - sampleStarted)
  }
  const totalMs = performance.now() - started
  samples.sort((left, right) => left - right)
  return {
    totalMs,
    meanMs: totalMs / iterations,
    p50Ms: samples[Math.floor(samples.length * 0.5)],
    p95Ms: samples[Math.min(samples.length - 1, Math.ceil(samples.length * 0.95) - 1)]
  }
}

const result = {
  recordedAt: new Date().toISOString(),
  runtime: `node ${process.version}`,
  platform: `${os.platform()} ${os.arch()}`,
  iterations,
  notes: ['Core Worker 协议处理器基线：包含 state.sync、请求 ID、串行队列、宿主持久化确认握手和结果回传；不包含真实浏览器跨线程调度、持久化 I/O 或 Worker 创建成本。'],
  cases: []
}
for (const candidates of sizes) {
  for (const [count, allowDuplicates, label] of [[1, true, 'single-repeat'], [2, false, 'batch-no-repeat']]) {
    const timing = await runCase(candidates, count, allowDuplicates)
    result.cases.push({ label, candidates, count, allowDuplicates, ...Object.fromEntries(Object.entries(timing).map(([key, value]) => [key, Number(value.toFixed(3))])) })
  }
}
const output = process.argv[2]
if (output) await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
