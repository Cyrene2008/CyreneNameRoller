/**
 * Cyrene Adaptive Fairness (CAF)
 *
 * The public module name and API stay version-neutral so future algorithm
 * upgrades do not require changing imports throughout the application.
 */

export const ALGORITHM_VERSION = '3.1.1'
export const ALGORITHM_NAME = 'cyrenenameroller-balance/v3'

export const TARGET_GAP = 2
const COLD_START_ROUNDS = 2
const INTERNAL_SENSITIVITY = 0.7
const INTERNAL_MAX_RATIO = 3
const OVERFLOW_PENALTY = 0.2
const RECOVERY_DECAY = 0.08
const GUARD_FLOOR = 0.01
const MAX_SELECTION_PROBABILITY = 0.3
const UINT32_RANGE = 0x100000000

export const DEFAULT_CYRENE_BALANCE_SETTINGS = {
  enabled: true,
  algorithm: ALGORITHM_NAME
}

// Person UUID is the canonical identity for fairness/statistics. The Chinese
// name fallback keeps imported legacy records and synthetic group entries
// usable while every persisted person created by the app has an id.
export function personKey(person) {
  if (person && typeof person === 'object') return String(person.id || person.cn || '')
  return String(person || '')
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function capWeightShares(weightMap, names) {
  if (names.length <= 1) return weightMap

  const maxShare = Math.max(MAX_SELECTION_PROBABILITY, 1 / names.length)
  const remaining = new Set(names.map(personKey))
  const shares = new Map()
  let remainingMass = 1

  while (remaining.size > 0) {
    const remainingNames = [...remaining]
    const totalWeight = remainingNames.reduce((sum, name) => sum + (weightMap.get(name) || 0), 0)
    const newlyCapped = remainingNames.filter(name => {
      const share = totalWeight > 0
        ? ((weightMap.get(name) || 0) / totalWeight) * remainingMass
        : remainingMass / remaining.size
      return share > maxShare
    })

    if (newlyCapped.length === 0) {
      remainingNames.forEach(name => {
        const share = totalWeight > 0
          ? ((weightMap.get(name) || 0) / totalWeight) * remainingMass
          : remainingMass / remaining.size
        shares.set(name, share)
      })
      break
    }

    newlyCapped.forEach(name => {
      shares.set(name, maxShare)
      remaining.delete(name)
      remainingMass -= maxShare
    })
  }

  return shares
}

function getCount(countsMap, person) {
  const key = personKey(person)
  const value = Number(countsMap?.[key])
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function normalizeCyreneBalanceSettings(raw) {
  const settings = { ...DEFAULT_CYRENE_BALANCE_SETTINGS }
  if (!raw || typeof raw !== 'object') return settings

  settings.enabled = raw.enabled !== false
  return settings
}

export function secureRandom() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1)
    globalThis.crypto.getRandomValues(value)
    return value[0] / UINT32_RANGE
  }
  return Math.random()
}

function createWeightMap(names, whiteList, countsMap, rawSettings) {
  const settings = normalizeCyreneBalanceSettings(rawSettings)
  const whiteListSet = new Set((whiteList || []).map(personKey))
  const regularNames = names.filter(name => !whiteListSet.has(personKey(name)))
  const weights = new Map(names.map(name => [personKey(name), 1]))

  if (!settings.enabled || regularNames.length === 0) return weights

  const counts = regularNames.map(name => getCount(countsMap, name))
  const totalDraws = counts.reduce((sum, count) => sum + count, 0)
  const expectedCount = totalDraws / regularNames.length
  const gap = Math.max(...counts) - Math.min(...counts)

  // Statistical feedback stays mild; the fixed soft-gap guard below provides
  // the strong correction needed near and beyond the target gap.
  const warmup = clamp(totalDraws / (regularNames.length * COLD_START_ROUNDS), 0, 1)
  const gapPressure = clamp(gap / TARGET_GAP, 0, 2)
  const adaptiveGain = INTERNAL_SENSITIVITY * (0.35 + 0.65 * gapPressure)
  const rawLogWeights = counts.map(count => -adaptiveGain * (count - expectedCount))

  const rawMin = Math.min(...rawLogWeights)
  const rawMax = Math.max(...rawLogWeights)
  const midpoint = (rawMin + rawMax) / 2
  const halfLogRange = Math.log(INTERNAL_MAX_RATIO) / 2
  const minCount = Math.min(...counts)

  regularNames.forEach((name, index) => {
    const centered = rawLogWeights[index] - midpoint
    const bounded = clamp(centered, -halfLogRange, halfLogRange)
    const projectedCounts = counts.slice()
    projectedCounts[index] += 1
    const projectedGap = Math.max(...projectedCounts) - Math.min(...projectedCounts)

    let guard = 1
    if (gap > TARGET_GAP && counts[index] > minCount) {
      guard = Math.max(GUARD_FLOOR, RECOVERY_DECAY ** (counts[index] - minCount))
    } else if (gap <= TARGET_GAP && projectedGap > TARGET_GAP) {
      guard = OVERFLOW_PENALTY
    }

    weights.set(personKey(name), Math.exp(bounded * warmup) * guard)
  })

  // Cap only the current single-draw probability. Batch positions always
  // recalculate after updating the state instead of reusing one distribution.
  return capWeightShares(weights, names)
}

function getAvailableNames(names, excludeList, allowDuplicates) {
  if (allowDuplicates || !excludeList?.length) return names
  const excluded = new Set(excludeList.map(personKey))
  return names.filter(name => !excluded.has(personKey(name)))
}

export function computeCyreneBalanceProbability(names, whiteList, countsMap, settings) {
  if (!Array.isArray(names) || names.length === 0) return {}

  const weightMap = createWeightMap(names, whiteList, countsMap, settings)
  const totalWeight = names.reduce((sum, name) => sum + (weightMap.get(personKey(name)) || 1), 0)
  const probabilities = {}

  names.forEach(name => {
    probabilities[personKey(name)] = ((weightMap.get(personKey(name)) || 1) / totalWeight) * 100
  })

  return probabilities
}

export function pickCyreneBalanced(
  names,
  whiteList,
  countsMap,
  settings,
  excludeList = [],
  allowDuplicates = true,
  random = secureRandom
) {
  const available = getAvailableNames(names, excludeList, allowDuplicates)
  const whiteListSet = new Set((whiteList || []).map(personKey))
  if (available.length === 0) {
    return { cn: '(没人选了!)', en: '(No one left!)' }
  }

  // In no-repeat mode, removing a candidate changes the current target pool.
  // Recompute the feedback model from the remaining candidates each draw.
  const weightMap = createWeightMap(available, whiteList, countsMap, settings)
  const weights = available.map(name => weightMap.get(personKey(name)) || 1)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const randomValue = clamp(Number(random()) || 0, 0, 1 - Number.EPSILON)
  let threshold = randomValue * totalWeight

  for (let index = 0; index < available.length; index++) {
    threshold -= weights[index]
    if (threshold < 0) {
      const selected = available[index]
      return {
        id: selected.id,
        cn: selected.cn,
        en: selected.en,
        index: names.indexOf(selected),
        isWhiteList: whiteListSet.has(personKey(selected))
      }
    }
  }

  const selected = available[available.length - 1]
  return {
    id: selected.id,
    cn: selected.cn,
    en: selected.en,
    index: names.indexOf(selected),
    isWhiteList: whiteListSet.has(personKey(selected))
  }
}

export function pickCyreneBatch(
  names,
  whiteList,
  countsMap,
  settings,
  drawCount,
  allowDuplicates = true,
  random = secureRandom
) {
  const localCounts = { ...(countsMap || {}) }
  const excluded = []
  const picks = []
  const requestedCount = Math.max(0, Math.floor(Number(drawCount) || 0))
  const limit = allowDuplicates ? requestedCount : Math.min(requestedCount, names.length)

  for (let index = 0; index < limit; index++) {
    const pick = pickCyreneBalanced(
      names,
      whiteList,
      localCounts,
      settings,
      excluded,
      allowDuplicates,
      random
    )
    if (!pick.cn || pick.cn === '(没人选了!)') break

    picks.push(pick)
    if (!allowDuplicates) excluded.push(personKey(pick))
    if (!pick.isWhiteList) {
      localCounts[personKey(pick)] = getCount(localCounts, pick) + 1
    }
  }

  return picks
}
