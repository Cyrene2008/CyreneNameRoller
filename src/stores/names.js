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
  const defaultNamesData = ref({ names: [] })
  const isLoaded = ref(false)

  const currentList = computed(() => {
    return nameLists.value[currentListId.value] || nameLists.value[DEFAULT_LIST_ID] || getDefaultList()
  })

  const currentNames = computed(() => currentList.value.names || [])
  const currentWhiteList = computed(() => currentNames.value.filter(n => n.isWhiteList))
  const allLists = computed(() => Object.values(nameLists.value))

  function getDefaultList() {
    return {
      id: DEFAULT_LIST_ID,
      name: '默认名单',
      groups: [],
      names: []
    }
  }

  function migrateList(list) {
    if (!list) return
    if (!Array.isArray(list.groups)) list.groups = []
    if (!Array.isArray(list.names)) list.names = []
    if (Array.isArray(list.whiteList)) {
      list.whiteList.forEach(w => {
        const p = list.names.find(x => x.cn === (w.cn || w))
        if (p) p.isWhiteList = true
      })
      delete list.whiteList
    }
    list.names.forEach(p => {
      if (p.groupId === undefined) p.groupId = ''
      if (p.isWhiteList === undefined) p.isWhiteList = false
    })
  }

  async function initialize() {
    try {
      const savedLists = await dataBridge.load('lists')
      const savedCurrentId = await dataBridge.load('currentListId')
      const namesJson = await dataBridge.loadNames()

      defaultNamesData.value = namesJson || { names: [] }

      if (savedLists && typeof savedLists === 'object' && Object.keys(savedLists).length > 0) {
        nameLists.value = savedLists
      } else {
        nameLists.value = {
          [DEFAULT_LIST_ID]: {
            id: DEFAULT_LIST_ID,
            name: '默认名单',
            groups: [],
            names: defaultNamesData.value.names || []
          }
        }
        await save()
      }

      Object.values(nameLists.value).forEach(migrateList)

      if (savedCurrentId && nameLists.value[savedCurrentId]) {
        currentListId.value = savedCurrentId
      }
    } catch (e) {
      console.error('[names] initialize failed:', e)
      nameLists.value = {
        [DEFAULT_LIST_ID]: {
          id: DEFAULT_LIST_ID,
          name: '默认名单',
          groups: [],
          names: []
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
    currentList.value.names.push({ cn: cn.trim(), en: (en || '').trim(), isWhiteList: false })
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
      const old = currentList.value.names[index]
      currentList.value.names[index] = {
        cn: newCn.trim(),
        en: (newEn || '').trim(),
        count: old?.count || 0,
        groupId: old?.groupId || '',
        isWhiteList: old?.isWhiteList || false
      }
      save()
    }
  }

  function createList(name) {
    if (!name || !name.trim()) return null
    const id = generateId()
    nameLists.value[id] = {
      id,
      name: name.trim(),
      groups: [],
      names: []
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
    migrateList(listData)
    nameLists.value[listData.id] = listData
    save()
  }

  function resetCurrentList() {
    currentList.value.names = (defaultNamesData.value.names || []).map(p => ({
      ...p,
      isWhiteList: !!p.isWhiteList
    }))
    save()
  }

  function listGroups(listId) {
    const l = nameLists.value[listId]
    if (!l) return []
    if (!Array.isArray(l.groups)) l.groups = []
    return l.groups
  }

  function groupMemberCount(listId, groupId) {
    const l = nameLists.value[listId]
    if (!l || !l.names) return 0
    return l.names.filter(p => p.groupId === groupId).length
  }

  function addGroup(listId, { id, name, enName }) {
    const l = nameLists.value[listId]
    if (!l) return { ok: false, error: 'invalidList' }
    if (!Array.isArray(l.groups)) l.groups = []
    if (!name || !name.trim()) return { ok: false, error: 'nameRequired' }
    if (!id || !id.trim()) return { ok: false, error: 'idRequired' }
    const gid = id.trim()
    if (l.groups.some(g => g.id === gid)) return { ok: false, error: 'idDuplicate' }
    l.groups.push({ id: gid, name: name.trim(), enName: (enName || '').trim() })
    save()
    return { ok: true }
  }

  function updateGroup(listId, groupId, patch) {
    const l = nameLists.value[listId]
    if (!l || !l.groups) return false
    const g = l.groups.find(g => g.id === groupId)
    if (!g) return false
    if (patch.name !== undefined) g.name = patch.name.trim()
    if (patch.enName !== undefined) g.enName = (patch.enName || '').trim()
    if (patch.id !== undefined && patch.id.trim() && patch.id.trim() !== groupId) {
      const newId = patch.id.trim()
      if (l.groups.some(x => x.id === newId && x.id !== groupId)) return false
      if (l.names) l.names.forEach(p => { if (p.groupId === groupId) p.groupId = newId })
      g.id = newId
    }
    save()
    return true
  }

  function deleteGroup(listId, groupId) {
    const l = nameLists.value[listId]
    if (!l || !l.groups) return false
    const idx = l.groups.findIndex(g => g.id === groupId)
    if (idx === -1) return false
    l.groups.splice(idx, 1)
    if (l.names) l.names.forEach(p => { if (p.groupId === groupId) p.groupId = '' })
    save()
    return true
  }

  function assignGroup(listId, personIndex, groupId) {
    const l = nameLists.value[listId]
    if (!l || !l.names || !l.names[personIndex]) return false
    l.names[personIndex].groupId = groupId || ''
    save()
    return true
  }

  function batchAssignGroup(listId, indices, groupId) {
    const l = nameLists.value[listId]
    if (!l || !l.names) return false
    indices.forEach(i => { if (l.names[i]) l.names[i].groupId = groupId || '' })
    save()
    return true
  }

  function clearCurrentList() {
    currentList.value.names = []
    save()
  }

  function isWhiteList(cn) {
    return currentNames.value.some(p => p.cn === cn && p.isWhiteList)
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
    isWhiteList,
    listGroups,
    groupMemberCount,
    addGroup,
    updateGroup,
    deleteGroup,
    assignGroup,
    batchAssignGroup
  }
})
