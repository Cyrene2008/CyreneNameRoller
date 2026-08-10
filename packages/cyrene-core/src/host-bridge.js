export const HOST_BRIDGE_VERSION = '1.0.0'

export const HOST_BRIDGE_METHODS = Object.freeze([
  { id: 'runtime.platform', permission: null, group: 'platform', description: '宿主平台信息' },
  { id: 'runtime.capabilities', permission: null, group: 'platform', description: '宿主能力声明' },
  { id: 'host.describe', permission: null, group: 'host', description: '宿主环境描述' },
  { id: 'storage.read', permission: 'storage:read', group: 'storage', description: '读取插件存储' },
  { id: 'storage.write', permission: 'storage:write', group: 'storage', description: '写入插件存储' },
  { id: 'dependency.storage.read', permission: null, group: 'storage', description: '读取前置插件共享数据（需双方声明）' },
  { id: 'names.read', permission: 'names:read', group: 'core-snapshot', description: '核心快照：名单' },
  { id: 'records.read', permission: 'records:read', group: 'core-snapshot', description: '核心快照：记录' },
  { id: 'statistics.read', permission: 'statistics:read', group: 'core-snapshot', description: '核心快照：统计' },
  { id: 'balance.read', permission: 'balance:read', group: 'core-snapshot', description: '核心快照：平衡配置' },
  { id: 'resources.query', permission: null, group: 'core-snapshot', description: '宿主资源查询（白名单）' },
  { id: 'draw.execute', permission: 'draw:execute', group: 'core-transaction', description: '执行抽取事务' },
  { id: 'transactions.execute', permission: null, group: 'core-transaction', description: '宿主事务（白名单）' },
  { id: 'notifications.show', permission: 'notifications:show', group: 'ui', description: '显示通知横幅' },
  { id: 'audio.select', permission: 'audio:select', group: 'audio', description: '选择本地音频文件' },
  { id: 'audio.play', permission: 'audio:play', group: 'audio', description: '播放已选择音频（data: URL）' },
  { id: 'system.open-url', permission: 'system:open-url', group: 'system', description: '打开外部链接' },
  { id: 'system.select-file', permission: 'system:select-file', group: 'system', description: '选择文件' },
  { id: 'system.select-directory', permission: 'system:select-directory', group: 'system', description: '选择目录' },
  { id: 'system.clipboard-read', permission: 'system:clipboard-read', group: 'system', description: '读取剪贴板' },
  { id: 'system.clipboard-write', permission: 'system:clipboard-write', group: 'system', description: '写入剪贴板' },
  { id: 'system.reveal-file', permission: 'system:reveal-file', group: 'system', description: '资源管理器中显示文件' },
  { id: 'system.execute', permission: 'system:execute', group: 'system', description: '执行受管系统操作（白名单命令）' },
  { id: 'ui.render', permission: null, group: 'ui', description: 'SDK v2：渲染 UI 声明树（M2 定义权限）' },
  { id: 'ui.action', permission: null, group: 'ui', description: 'SDK v2：UI 事件回传（M2 定义权限）' }
])

export function permissionForMethod(method) {
  return HOST_BRIDGE_METHODS.find(item => item.id === method)?.permission || null
}

export function validateHostBridgeImplementation(impl) {
  const missing = HOST_BRIDGE_METHODS.filter(item => typeof impl?.[item.id] !== 'function').map(item => item.id)
  if (missing.length) {
    throw new Error(`HostBridge 实现缺少方法：${missing.join(', ')}`)
  }
  return true
}

export const HOST_BRIDGE_REQUEST_FIELDS = Object.freeze(['method', 'args', 'requestId'])

export function normalizeHostBridgeRequest(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('HostBridge 请求必须为对象')
  const unsupported = Object.keys(raw).find(key => !HOST_BRIDGE_REQUEST_FIELDS.includes(key))
  if (unsupported) throw new Error(`HostBridge 请求不允许字段 ${unsupported}`)
  const method = String(raw.method || '')
  if (!HOST_BRIDGE_METHODS.some(item => item.id === method)) throw new Error(`未知 HostBridge 方法：${method}`)
  const requestId = String(raw.requestId || '')
  if (!requestId || requestId.length > 128) throw new Error('HostBridge 请求缺少 requestId')
  const args = raw.args && typeof raw.args === 'object' && !Array.isArray(raw.args) ? JSON.parse(JSON.stringify(raw.args)) : {}
  return { method, requestId, args }
}

export function createHostBridgeResult(value) {
  return { ok: true, value: JSON.parse(JSON.stringify(value)) }
}

export function createHostBridgeError(error) {
  return { ok: false, error: { code: error?.code || 'HOST_BRIDGE_FAILED', message: String(error?.message || error) } }
}
