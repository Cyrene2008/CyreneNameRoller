import { ALGORITHM_NAME, ALGORITHM_VERSION, normalizeCyreneBalanceSettings, personKey, pickCyreneBatch, secureRandom } from '../../utils/cyrene-balance.js'
import { normalizeCoreCaller, normalizeCoreDrawInput } from '../protocol.js'

function coreError(code, message) { return Object.assign(new Error(message), { code }) }

export function executeCoreDrawRequest({ input: rawInput, caller: rawCaller, state }) {
  const input = normalizeCoreDrawInput(rawInput)
  const caller = normalizeCoreCaller(rawCaller)
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw coreError('CORE_TRANSACTION_REJECTED', 'Core 状态无效')
  const list = state.names?.lists?.[input.listId]
  if (!list) throw coreError('CORE_TRANSACTION_REJECTED', '抽取名单不存在')

  const operationId = caller.operationId || crypto.randomUUID?.() || `draw-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const committedAt = Date.now()
  let picks
  if (input.target === 'groups') {
    const groups = (list.groups || []).map(group => ({ id: group.id, cn: group.name, en: group.enName || '', isGroup: true }))
    if ((list.names || []).some(person => !person.groupId)) groups.push({ id: '__unassigned__', cn: '未分组', en: 'Unassigned', isGroup: true })
    if (!groups.length) throw coreError('CORE_TRANSACTION_REJECTED', '所选名单没有可抽取小组')
    const count = input.allowDuplicates ? input.count : Math.min(input.count, groups.length)
    const available = [...groups]
    picks = []
    for (let index = 0; index < count; index += 1) {
      const pool = input.allowDuplicates ? groups : available
      const selectedIndex = Math.min(pool.length - 1, Math.floor(secureRandom() * pool.length))
      picks.push(pool[selectedIndex])
      if (!input.allowDuplicates) available.splice(selectedIndex, 1)
    }
  } else {
    const people = (list.names || []).filter(person => person.cn && person.cn !== '再来一次' && (input.gender === 'all' || person.gender === input.gender))
    if (!people.length) throw coreError('CORE_TRANSACTION_REJECTED', '所选名单没有符合条件的人员')
    const count = input.allowDuplicates ? input.count : Math.min(input.count, people.length)
    picks = pickCyreneBatch(people, people.filter(person => person.isWhiteList), state.statistics?.counts || {}, normalizeCyreneBalanceSettings(state.balance), count, input.allowDuplicates)
  }

  const results = picks.map(pick => ({ id: pick.id || '', name: pick.cn || '', englishName: pick.en || '', isGroup: !!pick.isGroup, isWhiteList: !!pick.isWhiteList }))
  const receipt = {
    operationId,
    pluginId: caller.pluginId,
    listId: input.listId,
    target: input.target,
    count: results.length,
    allowDuplicates: input.allowDuplicates,
    gender: input.gender,
    algorithm: input.target === 'people' ? ALGORITHM_NAME : 'host-random/groups',
    algorithmVersion: input.target === 'people' ? ALGORITHM_VERSION : '1',
    committedAt,
    results
  }

  const nextStatistics = { counts: { ...(state.statistics?.counts || {}) }, totalCount: Math.max(0, Number(state.statistics?.totalCount) || 0) }
  if (caller.countStatistics && input.target === 'people') {
    for (const pick of picks) {
      if (pick.isWhiteList) continue
      const key = personKey(pick)
      if (!key) continue
      nextStatistics.counts[key] = (Number(nextStatistics.counts[key]) || 0) + 1
      nextStatistics.totalCount += 1
    }
  }
  const source = caller.kind === 'plugin' ? `plugin:${caller.pluginId}` : 'roller'
  const appended = picks.map(pick => ({
    personId: pick.isGroup ? null : (pick.id || null),
    listId: input.listId,
    groupId: pick.isGroup ? pick.id : null,
    source,
    pluginId: caller.kind === 'plugin' ? caller.pluginId : '',
    operationId,
    time: committedAt
  }))
  const nextRecords = [...appended, ...(Array.isArray(state.records) ? state.records : [])].slice(0, 500)
  return { receipt, nextStatistics, nextRecords }
}
