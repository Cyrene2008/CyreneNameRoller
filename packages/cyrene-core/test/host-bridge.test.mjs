import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HOST_BRIDGE_VERSION,
  HOST_BRIDGE_METHODS,
  permissionForMethod,
  validateHostBridgeImplementation,
  normalizeHostBridgeRequest,
  createHostBridgeResult,
  createHostBridgeError
} from '../src/host-bridge.js'

test('HostBridge 契约：版本与能力数量', () => {
  assert.equal(HOST_BRIDGE_VERSION, '1.0.0')
  assert.ok(HOST_BRIDGE_METHODS.length >= 20)
})

test('HostBridge 契约：权限映射与 manifest 权限集一致', async () => {
  const { PLUGIN_PERMISSIONS } = await import('../src/plugin-contract.js')
  for (const item of HOST_BRIDGE_METHODS) {
    if (item.permission) assert.ok(PLUGIN_PERMISSIONS.has(item.permission), `${item.id} 权限 ${item.permission} 未在 PLUGIN_PERMISSIONS 声明`)
  }
  assert.equal(permissionForMethod('draw.execute'), 'draw:execute')
  assert.equal(permissionForMethod('runtime.platform'), null)
})

test('HostBridge 契约：实现完整性校验', () => {
  const complete = Object.fromEntries(HOST_BRIDGE_METHODS.map(item => [item.id, () => {}]))
  assert.equal(validateHostBridgeImplementation(complete), true)
  assert.throws(() => validateHostBridgeImplementation({}), /缺少方法：runtime\.platform/)
})

test('HostBridge 契约：JSON 序列化边界', () => {
  const request = normalizeHostBridgeRequest({ method: 'draw.execute', requestId: 'req-1', args: { listId: 'l' } })
  assert.deepEqual(request, { method: 'draw.execute', requestId: 'req-1', args: { listId: 'l' } })
  assert.throws(() => normalizeHostBridgeRequest({ method: 'unknown.method', requestId: 'x' }), /未知 HostBridge 方法/)
  assert.throws(() => normalizeHostBridgeRequest({ method: 'draw.execute', requestId: 'x', evil: 1 }), /不允许字段/)
  assert.throws(() => normalizeHostBridgeRequest({ method: 'draw.execute' }), /requestId/)
  const result = createHostBridgeResult({ ok: true, circular: () => {} })
  assert.equal(result.ok, true)
  assert.deepEqual(result.value, { ok: true })
  const failure = createHostBridgeError(Object.assign(new Error('失败'), { code: 'PLUGIN_PERMISSION_DENIED' }))
  assert.equal(failure.ok, false)
  assert.equal(failure.error.code, 'PLUGIN_PERMISSION_DENIED')
})
