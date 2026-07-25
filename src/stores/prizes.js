import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dataBridge } from '../utils/dataBridge'
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
export const usePrizesStore = defineStore('prizes', () => {
  const lists = ref({ default: { id: 'default', name: '默认奖品单', prizes: [] } })
  const currentId = ref('default')
  const current = computed(() => lists.value[currentId.value] || lists.value.default)
  async function initialize() { const saved = await dataBridge.load('prizeLists'); if (saved && typeof saved === 'object') lists.value = saved; const id = await dataBridge.load('currentPrizeListId'); if (id && lists.value[id]) currentId.value = id }
  async function save() { await dataBridge.save('prizeLists', lists.value); await dataBridge.save('currentPrizeListId', currentId.value) }
  function add(name, quantity = 1, weight = 1) { current.value.prizes.push({ id: uid(), name, quantity: Math.max(0, +quantity || 0), weight: Math.max(1, +weight || 1) }); save() }
  function pick() { const pool = current.value.prizes.filter(p => p.quantity > 0); const total = pool.reduce((sum, p) => sum + p.weight, 0); let cursor = Math.random() * total; const prize = pool.find(p => (cursor -= p.weight) < 0); if (prize) { prize.quantity--; save() } return prize }
  return { lists, currentId, current, initialize, save, add, pick }
})
