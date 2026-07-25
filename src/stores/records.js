import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dataBridge } from '../utils/dataBridge'
import { useNamesStore } from './names'

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const isLoaded = ref(false)

  async function initialize() {
    if (isLoaded.value) return
    try {
      const saved = await dataBridge.load('records')
      if (saved && Array.isArray(saved)) {
        const namesStore = useNamesStore()
        let migrated = false
        records.value = saved.map(record => {
          if (record.personId !== undefined && record.listId) {
            return {
              personId: record.personId || null,
              listId: record.listId,
              groupId: record.groupId || null,
              source: record.source || 'roller',
              time: record.time || Date.now()
            }
          }
          migrated = true
          const list = namesStore.allLists.find(item => item.id === record.listId || item.name === record.listName)
          const person = list?.names?.find(item => item.cn === record.cn && (!record.en || item.en === record.en))
          return {
            personId: person?.id || null,
            listId: list?.id || record.listId || null,
            groupId: record.groupId || null,
            source: record.source || 'roller',
            time: record.time || Date.now()
          }
        })
        if (migrated) await save()
      }
    } catch (e) {
      console.error('[records] initialize failed:', e)
    }
    isLoaded.value = true
  }

  async function save() {
    await dataBridge.save('records', records.value)
  }

  function addRecord({ personId, listId, source, groupId = null }) {
    records.value.unshift({
      personId,
      listId,
      groupId,
      source,
      time: Date.now()
    })
    if (records.value.length > 500) {
      records.value = records.value.slice(0, 500)
    }
    save()
  }

  function clearAll() {
    records.value = []
    save()
  }

  return {
    records,
    isLoaded,
    initialize,
    save,
    addRecord,
    clearAll
  }
})
