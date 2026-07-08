import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStatisticsStore = defineStore('statistics', () => {
  const counts = ref({})
  const totalCount = ref(0)
  const isLoaded = ref(false)

  async function initialize() {
    const saved = await window.electronAPI.loadData('statistics')
    if (saved) {
      counts.value = saved.counts || {}
      totalCount.value = saved.totalCount || 0
    }
    isLoaded.value = true
  }

  async function save() {
    await window.electronAPI.saveData('statistics', {
      counts: counts.value,
      totalCount: totalCount.value
    })
  }

  function incrementCount(cn) {
    if (!counts.value[cn]) counts.value[cn] = 0
    counts.value[cn]++
    totalCount.value++
    save()
  }

  function getCount(cn) {
    return counts.value[cn] || 0
  }

  function clearAll() {
    counts.value = {}
    totalCount.value = 0
    save()
  }

  function getStatsForList(names, whiteList) {
    const isWL = (cn) => whiteList.some(w => w.cn === cn)
    const BANNED = '再来一次'

    let calculatedTotal = 0
    const nameCounts = {}

    names.forEach(person => {
      if (!isWL(person.cn) && person.cn !== BANNED) {
        const count = counts.value[person.cn] || 0
        calculatedTotal += count
        if (nameCounts[person.cn]) {
          nameCounts[person.cn].count += count
        } else {
          nameCounts[person.cn] = { count, en: person.en }
        }
      }
    })

    const stats = Object.entries(nameCounts).map(([name, data]) => ({
      name,
      en: data.en,
      count: data.count,
      probability: calculatedTotal > 0 ? (data.count / calculatedTotal) * 100 : 0
    }))

    stats.sort((a, b) => b.count - a.count)
    return { stats, totalCount: calculatedTotal }
  }

  return {
    counts,
    totalCount,
    isLoaded,
    initialize,
    save,
    incrementCount,
    getCount,
    clearAll,
    getStatsForList
  }
})
