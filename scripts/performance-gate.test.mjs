import { execFileSync } from 'node:child_process'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// 门禁阈值：以 10 倍余量捕获量级级回归（参考值来自本地基准基线）
const GATES = {
  'balance draw (500 people, 1 pick)': { meanMs: 10, p95Ms: 50 },
  'balance draw (500 people, 10 picks, dup)': { meanMs: 50, p95Ms: 250 },
  'settings migration': { meanMs: 1, p95Ms: 5 },
  'ui tree normalize (10 nodes)': { meanMs: 1, p95Ms: 5 },
  'render plan build (10 nodes)': { meanMs: 1, p95Ms: 5 },
  'manifest validate (v2 + ui)': { meanMs: 1, p95Ms: 5 }
}

test('共享核心性能门禁（量级级回归检测）', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'cyrene-bench-'))
  const outputFile = path.join(tempDir, 'bench.json')
  try {
    execFileSync(process.execPath, [path.join(root, 'scripts/benchmark-core.mjs')], {
      cwd: root,
      env: { ...process.env, CYRENE_BENCH_OUTPUT: outputFile, CYRENE_BENCH_ITERATIONS: '200' },
      stdio: 'pipe'
    })
    const results = JSON.parse(readFileSync(outputFile, 'utf8'))
    for (const result of results) {
      const gate = GATES[result.name]
      assert.ok(gate, `未配置门禁的基准项：${result.name}`)
      assert.ok(result.meanMs <= gate.meanMs, `${result.name} mean ${result.meanMs.toFixed(3)}ms 超过门禁 ${gate.meanMs}ms`)
      assert.ok(result.p95Ms <= gate.p95Ms, `${result.name} p95 ${result.p95Ms.toFixed(3)}ms 超过门禁 ${gate.p95Ms}ms`)
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})
