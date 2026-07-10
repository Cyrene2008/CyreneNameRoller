import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dataBridge } from '../utils/dataBridge'

const DEFAULT_LIST_ID = 'default'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useNamesStore = defineStore('names', () => {
  const nameLists = ref({})
  const currentListId = ref(DEFAULT_LIST_ID)
  const defaultNamesData = ref({ names: [], whiteList: [] })
  const isLoaded = ref(false)

  const currentList = computed(() => {
    return nameLists.value[currentListId.value] || nameLists.value[DEFAULT_LIST_ID] || getDefaultList()
  })

  const currentNames = computed(() => currentList.value.names || [])
  const currentWhiteList = computed(() => currentList.value.whiteList || [])
  const allLists = computed(() => Object.values(nameLists.value))

  function getDefaultList() {
    return {
      id: DEFAULT_LIST_ID,
      name: '默认名单',
      names: [],
      whiteList: [{ cn: '再来一次', en: 'Again!' }]
    }
  }

  async function initialize() {
    try {
      const savedLists = await dataBridge.load('lists')
      const savedCurrentId = await dataBridge.load('currentListId')
      const namesJson = await dataBridge.loadNames()

      defaultNamesData.value = namesJson || { names: [], whiteList: [{ cn: '再来一次', en: 'Again!' }] }

      if (savedLists && typeof savedLists === 'object' && Object.keys(savedLists).length > 0) {
        nameLists.value = savedLists
      } else {
        nameLists.value = {
          [DEFAULT_LIST_ID]: {
            id: DEFAULT_LIST_ID,
            name: '默认名单',
            names: defaultNamesData.value.names || [],
            whiteList: [{ cn: '再来一次', en: 'Again!' }]
          }
        }
        await save()
      }

      if (savedCurrentId && nameLists.value[savedCurrentId]) {
        currentListId.value = savedCurrentId
      }
    } catch (e) {
      console.error('[names] initialize failed:', e)
      nameLists.value = {
        [DEFAULT_LIST_ID]: {
          id: DEFAULT_LIST_ID,
          name: '默认名单',
          names: [],
          whiteList: [{ cn: '再来一次', en: 'Again!' }]
        }
      }
    }
    isLoaded.value = true
  }

  async function save() {
    await dataBridge.save('lists', nameLists.value)
    await dataBridge.save('currentListId', currentListId.value)
  }

  function switchList(id) {
    if (nameLists.value[id]) {
      currentListId.value = id
      save()
    }
  }

  function addPerson(cn, en) {
    if (!cn || !cn.trim()) return
    currentList.value.names.push({ cn: cn.trim(), en: (en || '').trim() })
    save()
  }

  function deletePerson(index) {
    if (index >= 0 && index < currentList.value.names.length) {
      currentList.value.names.splice(index, 1)
      save()
    }
  }

  function editPerson(index, newCn, newEn) {
    if (index >= 0 && index < currentList.value.names.length) {
      currentList.value.names[index] = { cn: newCn.trim(), en: (newEn || '').trim() }
      save()
    }
  }

  function createList(name) {
    if (!name || !name.trim()) return null
    const id = generateId()
    nameLists.value[id] = {
      id,
      name: name.trim(),
      names: [],
      whiteList: [{ cn: '再来一次', en: 'Again!' }]
    }
    currentListId.value = id
    save()
    return id
  }

  function deleteList(id) {
    if (Object.keys(nameLists.value).length <= 1) return false
    delete nameLists.value[id]
    currentListId.value = Object.keys(nameLists.value)[0]
    save()
    return true
  }

  function restoreList(listData) {
    if (!listData || !listData.id) return
    nameLists.value[listData.id] = listData
    save()
  }

  function resetCurrentList() {
    currentList.value.names = [...defaultNamesData.value.names]
    currentList.value.whiteList = [{ cn: '再来一次', en: 'Again!' }]
    save()
  }

  function clearCurrentList() {
    currentList.value.names = []
    currentList.value.whiteList = [{ cn: '再来一次', en: 'Again!' }]
    save()
  }

  function isWhiteList(cn) {
    return currentWhiteList.value.some(w => w.cn === cn)
  }

  return {
    nameLists,
    currentListId,
    currentList,
    currentNames,
    currentWhiteList,
    allLists,
    isLoaded,
    initialize,
    save,
    switchList,
    addPerson,
    deletePerson,
    editPerson,
    createList,
    deleteList,
    restoreList,
    resetCurrentList,
    clearCurrentList,
    isWhiteList
  }
})
