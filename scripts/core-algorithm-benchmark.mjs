import fs from 'node:fs/promises'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { pickCyreneBatch } from '../src/utils/cyrene-balance.js'

const iterations = Math.max(1, Number(process.env.CAF_BENCH_ITERATIONS || 1000))
const warmup = Math.max(1, Number(process.env.CAF_BENCH_WARMUP || 25))
const sizes = String(process.env.CAF_BENCH_SIZES || '100,10000,100000').split(',').map(Number).filter(Number.isFinite)
const makeNames = size => Array.from({ length: size }, (_, index) => ({ id: `person-${index}`, cn: `姓名${index}`, en: `Name ${index}` }))
const runCase = (names, drawCount, allowDuplicates) => {
  let randomIndex = 0
  const random = () => ((randomIndex++ * 2654435761) >>> 0) / 0x100000000
  const samples = []
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now()
    pickCyreneBatch(names, [], {}, { enabled: true }, drawCount, allowDuplicates, random)
    samples.push(performance.now() - started)
  }
  samples.sort((left, right) => left - right)
  const totalMs = samples.reduce((sum, value) => sum + value, 0)
  return {
    totalMs,
    meanMs: totalMs / samples.length,
    p50Ms: samples[Math.floor(samples.length * 0.5)],
    p95Ms: samples[Math.min(samples.length - 1, Math.ceil(samples.length * 0.95) - 1)]
  }
}

function runChild(size, drawCount, allowDuplicates) {
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--case', String(size), String(drawCount), String(allowDuplicates)], {
    env: { ...process.env },
    encoding: 'utf8',
    timeout: Math.max(1000, Number(process.env.CAF_BENCH_CASE_TIMEOUT_MS || 120000))
  })
  if (child.error) return { status: child.error.code === 'ETIMEDOUT' ? 'timeout' : 'error', error: child.error.message }
  if (child.status !== 0) return { status: 'error', error: child.stderr || `child exited ${child.status}` }
  try { return { status: 'ok', ...JSON.parse(child.stdout) } } catch { return { status: 'error', error: 'invalid child output' } }
}

if (process.argv[2] === '--case') {
  const size = Number(process.argv[3])
  const drawCount = Number(process.argv[4])
  const allowDuplicates = process.argv[5] === 'true'
  const names = makeNames(size)
  for (let index = 0; index < warmup; index += 1) {
    let random = 0
    pickCyreneBatch(names, [], {}, { enabled: true }, drawCount, allowDuplicates, () => (random++ % 997) / 997)
  }
  const timing = runCase(names, drawCount, allowDuplicates)
  process.stdout.write(JSON.stringify({ totalMs: timing.totalMs, meanMs: timing.meanMs, p50Ms: timing.p50Ms, p95Ms: timing.p95Ms }))
  process.exit(0)
}

const result = {
  recordedAt: new Date().toISOString(),
  runtime: `node ${process.version}`,
  platform: `${os.platform()} ${os.arch()}`,
  iterations,
  warmup,
  algorithm: 'cyrenenameroller-balance/v3',
  algorithmVersion: '3.1.1',
  notes: ['纯 JS 算法路径基线；不包含 Worker 创建或 RPC。', '阶段 6 需要在同一浏览器与构建模式下补充 Core Client 到 Worker 的端到端基线。'],
  cases: []
}

for (const size of sizes) {
  for (const [drawCount, allowDuplicates, label] of [[1, true, 'single-repeat'], [2, false, 'batch-no-repeat']]) {
    const timing = runChild(size, drawCount, allowDuplicates)
    result.cases.push({ label, candidates: size, drawCount, allowDuplicates, ...Object.fromEntries(Object.entries(timing).map(([key, value]) => [key, typeof value === 'number' ? Number(value.toFixed(3)) : value])) })
  }
}

const output = process.argv[2]
if (output) await fs.writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
