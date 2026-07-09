<template>
  <div class="lists-view">
    <h1 class="page-title">
      <FluentIcon icon="people-list-24-regular" :width="28" />
      {{ t('listManager', lang) }}
    </h1>

    <!-- 名单选择与创建 -->
    <FluentCard class="list-header">
      <div class="list-header-row">
        <FluentSelect :model-value="namesStore.currentListId" :options="listOptions" @update:model-value="namesStore.switchList" />
        <FluentButton variant="primary" size="sm" @click="showCreateForm = true">
          <FluentIcon icon="add-16-regular" :width="14" /> {{ t('createList', lang) }}
        </FluentButton>
        <FluentButton variant="secondary" size="sm" @click="startEditListName">
          <FluentIcon icon="edit-16-regular" :width="14" /> {{ lang === 'en' ? 'Rename' : '改名' }}
        </FluentButton>
      </div>
      <div v-if="showCreateForm" class="create-form">
        <FluentInput v-model="newListName" :placeholder="lang === 'en' ? 'New list name' : '新名单名称'" @enter="createList" />
        <FluentButton variant="primary" size="sm" @click="createList"><FluentIcon icon="checkmark-16-regular" :width="14" /></FluentButton>
        <FluentButton variant="subtle" size="sm" @click="showCreateForm = false; newListName = ''"><FluentIcon icon="dismiss-16-regular" :width="14" /></FluentButton>
      </div>
      <div v-if="editingListName" class="create-form">
        <FluentInput v-model="editListNameValue" :placeholder="lang === 'en' ? 'List name' : '名单名称'" @enter="saveListName" />
        <FluentButton variant="primary" size="sm" @click="saveListName"><FluentIcon icon="checkmark-16-regular" :width="14" /></FluentButton>
        <FluentButton variant="subtle" size="sm" @click="editingListName = false"><FluentIcon icon="dismiss-16-regular" :width="14" /></FluentButton>
      </div>
    </FluentCard>

    <!-- 添加人员 -->
    <FluentCard class="add-person-card">
      <div class="add-person-row">
        <FluentInput v-model="newCn" :placeholder="t('cnName', lang)" @enter="newEnRef?.focus()" />
        <FluentInput ref="newEnRef" v-model="newEn" :placeholder="t('enName', lang)" @enter="addPerson" />
        <FluentButton variant="primary" size="sm" @click="addPerson">
          <FluentIcon icon="add-16-regular" :width="14" /> {{ t('addPerson', lang) }}
        </FluentButton>
      </div>
    </FluentCard>

    <!-- 人员列表 -->
    <FluentCard class="person-list-card">
      <div class="person-list-header">
        <label class="select-all-label">
          <input type="checkbox" :checked="allSelected" :indeterminate="someSelected" @change="toggleSelectAll" class="person-checkbox" />
          <span class="person-count">{{ namesStore.currentNames.length }} {{ lang === 'en' ? 'people' : '人' }}</span>
        </label>
        <Transition name="fade">
          <FluentButton v-if="selectedIndices.length > 0" variant="danger" size="sm" @click="batchDelete">
            <FluentIcon icon="delete-16-regular" :width="14" />
            {{ lang === 'en' ? `Delete ${selectedIndices.length}` : `删除 ${selectedIndices.length} 项` }}
          </FluentButton>
        </Transition>
      </div>
      <div class="person-list">
        <div v-for="(person, index) in namesStore.currentNames" :key="index" class="person-item" :class="{ editing: editingIndex === index }">
          <!-- 编辑模式 -->
          <template v-if="editingIndex === index">
            <div class="edit-row">
              <FluentInput v-model="editCn" style="flex:1;" :placeholder="t('cnName', lang)" />
              <FluentInput v-model="editEn" style="flex:1;" :placeholder="t('enName', lang)" />
              <FluentButton variant="primary" size="sm" icon-only @click="saveEdit(index)"><FluentIcon icon="checkmark-16-regular" :width="14" /></FluentButton>
              <FluentButton variant="subtle" size="sm" icon-only @click="editingIndex = -1"><FluentIcon icon="dismiss-16-regular" :width="14" /></FluentButton>
            </div>
          </template>
          <!-- 显示模式 -->
          <template v-else>
            <label class="person-check-label">
              <input type="checkbox" :checked="selectedSet.has(index)" @change="toggleSelect(index)" class="person-checkbox" :disabled="namesStore.isWhiteList(person.cn)" />
            </label>
            <div class="person-info" @dblclick="startEdit(index, person)">
              <span class="person-cn">{{ person.cn }}</span>
              <span class="person-en">{{ person.en }}</span>
              <span v-if="namesStore.isWhiteList(person.cn)" class="whitelist-badge">{{ lang === 'en' ? 'WL' : '白名单' }}</span>
            </div>
            <div class="person-actions">
              <FluentButton variant="subtle" size="sm" icon-only @click="startEdit(index, person)">
                <FluentIcon icon="edit-16-regular" :width="14" />
              </FluentButton>
              <FluentButton variant="subtle" size="sm" icon-only :disabled="namesStore.isWhiteList(person.cn)" @click="namesStore.deletePerson(index)">
                <FluentIcon icon="delete-16-regular" :width="14" />
              </FluentButton>
            </div>
          </template>
        </div>
        <div v-if="namesStore.currentNames.length === 0" class="empty-list">
          {{ lang === 'en' ? 'No names in this list' : '名单为空' }}
        </div>
      </div>
    </FluentCard>

    <!-- 操作按钮 -->
    <div class="list-actions">
      <FluentButton variant="danger" @click="deleteCurrentList">
        <FluentIcon icon="delete-16-regular" :width="14" /> {{ lang === 'en' ? 'Delete List' : '删除名单' }}
      </FluentButton>
      <div class="list-divider" />
      <FluentButton variant="secondary" @click="exportList">
        <FluentIcon icon="arrow-download-16-regular" :width="14" /> {{ lang === 'en' ? 'Export List' : '导出名单' }}
      </FluentButton>
      <FluentButton variant="secondary" @click="importList">
        <FluentIcon icon="arrow-upload-16-regular" :width="14" /> {{ lang === 'en' ? 'Import List' : '导入名单' }}
      </FluentButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { t } from '../utils/i18n'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentInput from '../components/FluentInput.vue'

const namesStore = useNamesStore()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)
const toastRef = inject('toast')

const listOptions = computed(() => namesStore.allLists.map(l => ({ value: l.id, label: l.name })))

const showCreateForm = ref(false)
const newListName = ref('')
const newCn = ref('')
const newEn = ref('')
const newEnRef = ref(null)

const editingIndex = ref(-1)
const editCn = ref('')
const editEn = ref('')

const editingListName = ref(false)
const editListNameValue = ref('')

const selectedSet = ref(new Set())
const selectedIndices = computed(() => [...selectedSet.value])
const allSelected = computed(() => namesStore.currentNames.length > 0 && selectedSet.value.size === namesStore.currentNames.length)
const someSelected = computed(() => selectedSet.value.size > 0 && !allSelected.value)

function toggleSelect(index) {
  const s = new Set(selectedSet.value)
  if (s.has(index)) s.delete(index)
  else if (!namesStore.isWhiteList(namesStore.currentNames[index].cn)) s.add(index)
  selectedSet.value = s
}

function toggleSelectAll() {
  if (allSelected.value) { selectedSet.value = new Set(); return }
  const s = new Set()
  namesStore.currentNames.forEach((p, i) => { if (!namesStore.isWhiteList(p.cn)) s.add(i) })
  selectedSet.value = s
}

function createList() {
  if (!newListName.value.trim()) return
  namesStore.createList(newListName.value)
  newListName.value = ''
  showCreateForm.value = false
}

function startEditListName() {
  editListNameValue.value = namesStore.currentList.name
  editingListName.value = true
}

function saveListName() {
  if (!editListNameValue.value.trim()) return
  namesStore.currentList.name = editListNameValue.value.trim()
  namesStore.save()
  editingListName.value = false
}

function addPerson() {
  if (!newCn.value.trim()) return
  namesStore.addPerson(newCn.value, newEn.value)
  newCn.value = ''
  newEn.value = ''
}

function startEdit(index, person) {
  editingIndex.value = index
  editCn.value = person.cn
  editEn.value = person.en
}

function saveEdit(index) {
  if (!editCn.value.trim()) return
  namesStore.editPerson(index, editCn.value, editEn.value)
  editingIndex.value = -1
}

function deleteCurrentList() {
  if (namesStore.allLists.length <= 1) return
  const deletedName = namesStore.currentList.name
  namesStore.deleteList(namesStore.currentListId)
  if (toastRef?.value) {
    toastRef.value.add({
      title: lang.value === 'en' ? 'List deleted' : '名单已删除',
      message: deletedName,
      duration: 5000
    })
  }
}

function batchDelete() {
  const indices = [...selectedIndices.value].sort((a, b) => b - a)
  const deleted = indices.map(i => namesStore.currentNames[i])
  indices.forEach(i => namesStore.deletePerson(i))
  selectedSet.value = new Set()

  if (toastRef?.value) {
    toastRef.value.add({
      title: lang.value === 'en' ? `${deleted.length} deleted` : `已删除 ${deleted.length} 人`,
      message: deleted.map(d => d.cn).join(', '),
      duration: 10000,
      action: {
        label: lang.value === 'en' ? 'Undo' : '撤销',
        fn: () => {
          deleted.forEach(p => namesStore.addPerson(p.cn, p.en))
        }
      }
    })
  }
}

function exportList() {
  const list = namesStore.currentList
  const data = JSON.stringify(list, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${list.name}.json`; a.click()
  URL.revokeObjectURL(url)
}

function importList() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.name && Array.isArray(data.names)) {
        namesStore.createList(data.name)
        data.names.forEach(n => namesStore.addPerson(n.cn, n.en))
      }
    } catch {}
  }
  input.click()
}
</script>

<style scoped>
.lists-view { padding: 32px; }
.page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
.list-header { margin-bottom: 12px; }
.list-header-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.create-form { display: flex; gap: 8px; margin-top: 12px; align-items: center; }
.add-person-card { margin-bottom: 12px; }
.add-person-row { display: flex; gap: 8px; flex-wrap: wrap; }
.person-list-card { padding: 0; overflow: hidden; margin-bottom: 16px; }
.person-list-header { padding: 10px 20px; border-bottom: 1px solid var(--border-default); display: flex; align-items: center; justify-content: space-between; }
.select-all-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.person-count { font-size: 13px; color: var(--text-muted); }
.person-list { max-height: 400px; overflow-y: auto; }
.person-item { display: flex; align-items: center; padding: 8px 20px; border-bottom: 1px solid var(--border-default); transition: background var(--duration-fast) ease; gap: 8px; }
.person-item:last-child { border-bottom: none; }
.person-item:hover { background: var(--bg-hover); }
.person-check-label { display: flex; align-items: center; flex-shrink: 0; cursor: pointer; }
.person-checkbox { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
.person-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; cursor: pointer; }
.person-cn { font-weight: 500; color: var(--text-primary); }
.person-en { font-size: 12px; color: var(--text-muted); }
.whitelist-badge { font-size: 11px; color: var(--text-muted); background: var(--bg-hover); padding: 1px 6px; border-radius: var(--radius-sm); }
.person-actions { display: flex; gap: 4px; flex-shrink: 0; }
.edit-row { display: flex; gap: 8px; flex: 1; align-items: center; }
.empty-list { padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 14px; }
.list-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.list-divider { width: 1px; height: 24px; background: var(--border-default); margin: 0 4px; }

.fade-enter-active { transition: opacity 0.2s; }
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
