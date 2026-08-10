import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dataBridge } from '../utils/dataBridge.js'
import { personKey } from '../../packages/cyrene-core/src/balance.js'
import { useNamesStore } from './names.js'

export const useStatisticsStore = defineStore('statistics', () => {
  const counts = ref({})
  const totalCount = ref(0)
  const isLoaded = ref(false)
  const revision = ref(0)

  async function initialize() {
    if (isLoaded.value) return
    try {
      const saved = await dataBridge.load('statistics')
      if (saved && typeof saved === 'object') {
        counts.value = saved.counts || {}
        totalCount.value = saved.totalCount || 0
      }

      // Versions before 26.1 keyed statistics by Chinese name. Copy that
      // shared legacy baseline to every matching UUID so duplicate names are
      // independent from this point onward. Historical draw records are not
      // fabricated; only the aggregate baseline and its total are migrated.
      const namesStore = useNamesStore()
      const people = namesStore.allLists.flatMap(list => list.names || [])
      const personIds = new Set(people.map(person => personKey(person)).filter(Boolean))
      const migratedLegacyKeys = new Set()
      let migrated = false

      const peopleByName = new Map()
      people.forEach(person => {
        const legacyKey = String(person.cn || '')
        if (!legacyKey || !personKey(person)) return
        if (!peopleByName.has(legacyKey)) peopleByName.set(legacyKey, [])
        peopleByName.get(legacyKey).push(person)
      })
      peopleByName.forEach((matchingPeople, legacyKey) => {
        // If a legacy name happens to equal a real person ID, the key is
        // ambiguous. Preserve it instead of risking deletion of valid UUID
        // statistics; normal generated IDs never collide with display names.
        if (personIds.has(legacyKey)) return
        if (counts.value[legacyKey] === undefined) return
        const legacyCount = Number(counts.value[legacyKey]) || 0
        matchingPeople.forEach(person => {
          const key = personKey(person)
          if (counts.value[key] !== undefined) return
          counts.value[key] = legacyCount
          migratedLegacyKeys.add(legacyKey)
          migrated = true
        })
      })

      migratedLegacyKeys.forEach(key => { delete counts.value[key] })
      const reconciledTotal = Object.values(counts.value).reduce((sum, value) => {
        const count = Number(value)
        return sum + (Number.isFinite(count) && count > 0 ? count : 0)
      }, 0)
      if (totalCount.value !== reconciledTotal) {
        totalCount.value = reconciledTotal
        migrated = true
      }
      if (migrated) await save()
    } catch (e) {
      console.error('[statistics] initialize failed:', e)
    }
    isLoaded.value = true
  }

  async function save() {
    await dataBridge.save('statistics', {
      counts: counts.value,
      totalCount: totalCount.value
    })
  }

  function snapshotState() {
    return {
      counts: { ...counts.value },
      totalCount: totalCount.value
    }
  }

  function restoreState(snapshot, { persist = true } = {}) {
    counts.value = { ...(snapshot?.counts || {}) }
    totalCount.value = Math.max(0, Number(snapshot?.totalCount) || 0)
    revision.value += 1
    return persist ? save() : Promise.resolve()
  }

  function getCount(person) {
    return counts.value[personKey(person)] || 0
  }

  function getStatsForList(names, whiteList) {
    const whiteListIds = new Set((whiteList || []).map(personKey))
    const BANNED = '再来一次'

    let calculatedTotal = 0
    const stats = []

    names.forEach(person => {
      const id = personKey(person)
      if (!whiteListIds.has(id) && !person.isWhiteList && person.cn !== BANNED) {
        const count = getCount(person)
        calculatedTotal += count
        stats.push({ id, name: person.cn, en: person.en, count })
      }
    })

    stats.forEach(stat => {
      stat.probability = calculatedTotal > 0 ? (stat.count / calculatedTotal) * 100 : 0
    })

    stats.sort((a, b) => b.count - a.count)
    return { stats, totalCount: calculatedTotal }
  }

  return {
    counts,
    totalCount,
    isLoaded,
    revision,
    initialize,
    save,
    snapshotState,
    restoreState,
    getCount,
    getStatsForList
  }
})
