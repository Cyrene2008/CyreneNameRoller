import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dataBridge } from '../utils/dataBridge'

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const isLoaded = ref(false)

  async function initialize() {
    const saved = await dataBridge.load('records')
    if (saved && Array.isArray(saved)) {
      records.value = saved
    }
    isLoaded.value = true
  }

  async function save() {
    await dataBridge.save('records', records.value)
  }

  function addRecord({ cn, en, listName, source }) {
    records.value.unshift({
      cn,
      en,
      listName,
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
