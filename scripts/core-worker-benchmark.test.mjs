import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const root = path.resolve(import.meta.dirname, '..')

test('Core Worker benchmark completes the durable commit handshake', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['scripts/core-worker-benchmark.mjs'], {
    cwd: root,
    env: { ...process.env, CORE_BENCH_ITERATIONS: '2', CORE_BENCH_SIZES: '2' }
  })
  const result = JSON.parse(stdout)
  assert.equal(result.iterations, 2)
  assert.equal(result.cases.length, 2)
  assert.ok(result.cases.every(item => Number.isFinite(item.p95Ms)))
})
