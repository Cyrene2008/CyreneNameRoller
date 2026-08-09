const DRAW_INPUT_FIELDS = new Set(['listId', 'target', 'count', 'allowDuplicates', 'gender'])
const CARD_INPUT_FIELDS = new Set(['listId', 'personIds'])

function coreError(code, message) { return Object.assign(new Error(message), { code }) }

export function normalizeCoreDrawInput(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw coreError('CORE_TRANSACTION_REJECTED', 'draw.execute 参数必须为对象')
  const unsupported = Object.keys(raw).find(key => !DRAW_INPUT_FIELDS.has(key))
  if (unsupported) throw coreError('CORE_TRANSACTION_REJECTED', `draw.execute 不允许指定参数 ${unsupported}`)
  return {
    listId: String(raw.listId || ''),
    target: raw.target === 'groups' ? 'groups' : 'people',
    count: Math.max(1, Math.min(100, Math.floor(Number(raw.count) || 1))),
    allowDuplicates: raw.allowDuplicates === true,
    gender: ['male', 'female'].includes(raw.gender) ? raw.gender : 'all'
  }
}

export function normalizeCoreCaller(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw coreError('CORE_TRANSACTION_REJECTED', 'Core 调用方无效')
  const kind = raw.kind === 'plugin' ? 'plugin' : raw.kind === 'core-ui' ? 'core-ui' : ''
  const pluginId = String(raw.pluginId || '')
  if (!kind || !pluginId) throw coreError('CORE_TRANSACTION_REJECTED', 'Core 调用方无效')
  return {
    kind,
    pluginId: kind === 'core-ui' ? 'core' : pluginId,
    operationId: String(raw.operationId || ''),
    countStatistics: raw.countStatistics !== false
  }
}

export function normalizeCoreCardInput(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw coreError('CORE_TRANSACTION_REJECTED', 'card.commit input must be an object')
  const unsupported = Object.keys(raw).find(key => !CARD_INPUT_FIELDS.has(key))
  if (unsupported) throw coreError('CORE_TRANSACTION_REJECTED', `card.commit does not allow field ${unsupported}`)
  const personIds = Array.isArray(raw.personIds) ? [...new Set(raw.personIds.map(value => String(value || '')).filter(Boolean))] : []
  if (!personIds.length || personIds.length > 100) throw coreError('CORE_TRANSACTION_REJECTED', 'card.commit requires 1 to 100 person IDs')
  return {
    listId: String(raw.listId || ''),
    personIds
  }
}

export const CORE_DRAW_INPUT_FIELDS = Object.freeze([...DRAW_INPUT_FIELDS])
export const CORE_CARD_INPUT_FIELDS = Object.freeze([...CARD_INPUT_FIELDS])
