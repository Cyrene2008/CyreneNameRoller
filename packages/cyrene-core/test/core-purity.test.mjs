import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const modules = fs.readdirSync(path.join(packageRoot, 'src'))
  .filter(name => name.endsWith('.js') || name.endsWith('.mjs'))
  .map(name => `src/${name}`)
  .sort()
const forbiddenGlobals = [
  { pattern: /\bdocument\./, label: 'document.' },
  { pattern: /\bwindow\./, label: 'window.' },
  { pattern: /\blocalStorage\b/, label: 'localStorage' },
  { pattern: /\bsessionStorage\b/, label: 'sessionStorage' },
  { pattern: /\bnavigator\./, label: 'navigator.' },
  { pattern: /\bHTMLElement\b/, label: 'HTMLElement' },
  { pattern: /\bnew Worker\b|\bWorker\(|Worker\.prototype/, label: 'Worker' }
]

test('共享核心模块源码不含浏览器/DOM 全局依赖', () => {
  assert.ok(modules.length >= 5, `共享核心应包含至少 5 个模块，当前 ${modules.length}`)
  for (const relative of modules) {
    const source = fs.readFileSync(path.join(packageRoot, relative), 'utf8')
    for (const forbidden of forbiddenGlobals) {
      assert.ok(!forbidden.pattern.test(source), `${relative} 包含禁止的全局引用 ${forbidden.label}`)
    }
  }
})

test('共享核心模块可在无 DOM 环境（纯 Node）加载', async () => {
  const balance = await import('../src/balance.js')
  assert.equal(typeof balance.pickCyreneBatch, 'function')
  assert.equal(typeof balance.computeCyreneBalanceProbability, 'function')
  assert.equal(typeof balance.secureRandom, 'function')

  const protocol = await import('../src/protocol.js')
  assert.equal(typeof protocol.normalizeCoreDrawInput, 'function')
  assert.equal(typeof protocol.normalizeCoreCommitState, 'function')

  const core = await import('../src/core-service.js')
  assert.equal(typeof core.executeCoreDrawRequest, 'function')
  assert.equal(typeof core.executeCoreCardRequest, 'function')
  assert.equal(typeof core.executeCoreMaintenanceRequest, 'function')
})

test('核心事务在无 DOM 环境可完成一次完整抽取', async () => {
  const { executeCoreDrawRequest } = await import('../src/core-service.js')
  const state = {
    names: { lists: { 'list-1': { names: [
      { id: 'p1', cn: '张三', gender: 'male' },
      { id: 'p2', cn: '李四', gender: 'male' },
      { id: 'p3', cn: '王五', gender: 'female' }
    ] } } },
    balance: { enabled: true },
    statistics: { counts: {}, totalCount: 0 },
    records: []
  }
  const { receipt, nextStatistics, nextRecords } = executeCoreDrawRequest({
    input: { listId: 'list-1', target: 'people', count: 1, allowDuplicates: false, gender: 'all' },
    caller: { kind: 'core-ui', pluginId: 'core' },
    state,
    peopleCache: new Map()
  })
  assert.equal(receipt.count, 1)
  assert.equal(nextStatistics.totalCount, 1)
  assert.equal(nextRecords.length, 1)
  assert.match(receipt.operationId, /^draw-|^[0-9a-f-]{36}$/)
})

test('共享核心仅依赖可注入的 crypto 宿主能力', () => {
  for (const relative of modules) {
    const source = fs.readFileSync(path.join(packageRoot, relative), 'utf8')
    const cryptoUses = [...source.matchAll(/crypto\.[a-zA-Z]+/g)].map(match => match[0])
    for (const use of cryptoUses) {
      assert.ok(
        use === 'crypto.randomUUID' || use === 'crypto.getRandomValues',
        `${relative} 使用了宿主未声明的 crypto 能力 ${use}`
      )
    }
  }
})
