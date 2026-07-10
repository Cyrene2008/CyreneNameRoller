<template>
  <div class="lists-view">
    <!-- 顶部区域 -->
    <div class="list-header">
      <div class="list-header-left">
        <FluentIcon icon="people-list-24-regular" :width="22" />
        <h1 class="page-title">{{ t('listManager', lang) }}</h1>
      </div>
      <div class="list-header-right">
        <FluentSelect :model-value="namesStore.currentListId" :options="listOptions" @update:model-value="namesStore.switchList" />
        <FluentButton variant="secondary" size="sm" @click="router.push('/lists/manage')">
          <FluentIcon icon="settings-16-regular" :width="14" /> {{ t('listManager', lang) }}
        </FluentButton>
      </div>
    </div>

    <!-- 添加栏 -->
    <FluentCard class="add-person-card">
      <div class="add-person-row">
        <FluentInput v-model="newCn" :placeholder="t('cnName', lang)" @enter="newEnRef?.focus()" />
        <FluentInput ref="newEnRef" v-model="newEn" :placeholder="t('enName', lang)" @enter="addPerson" />
        <FluentButton variant="primary" size="sm" @click="addPerson">
          <FluentIcon icon="add-16-regular" :width="14" /> {{ t('addPerson', lang) }}
        </FluentButton>
      </div>
    </FluentCard>

    <!-- 列表区域 -->
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
            <div class="person-info">
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
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { t } from '../utils/i18n'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentInput from '../components/FluentInput.vue'

const router = useRouter()
const namesStore = useNamesStore()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)
const showBanner = inject('banner')

const listOptions = computed(() => namesStore.allLists.map(l => ({ value: l.id, label: l.name })))

const newCn = ref('')
const newEn = ref('')
const newEnRef = ref(null)

const editingIndex = ref(-1)
const editCn = ref('')
const editEn = ref('')

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

function batchDelete() {
  const indices = [...selectedIndices.value].sort((a, b) => b - a)
  const deletedPersons = indices.map(i => ({ ...namesStore.currentNames[i] }))
  indices.forEach(i => namesStore.deletePerson(i))
  selectedSet.value = new Set()
  showBanner({
    message: lang.value === 'en' ? `Deleted ${deletedPersons.length} names` : `已删除 ${deletedPersons.length} 个名字`,
    icon: 'delete-16-regular',
    type: 'warning',
    duration: 8000,
    undoAction: () => {
      deletedPersons.forEach(p => namesStore.addPerson(p.cn, p.en))
    }
  })
}
</script>

<style scoped>
.lists-view {
  padding: 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部区域 */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.page-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.list-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 添加栏 */
.add-person-card {
  flex-shrink: 0;
}

.add-person-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-person-row .fluent-input-wrapper {
  flex: 1;
  min-width: 0;
}

/* 列表区域 */
.person-list-card {
  padding: 0;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.person-list-header {
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.person-count {
  font-size: 13px;
  color: var(--text-muted);
}

.person-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.person-item {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  border-bottom: 1px solid var(--border-default);
  transition: background var(--duration-fast) ease;
  gap: 8px;
}

.person-item:last-child {
  border-bottom: none;
}

.person-item:hover {
  background: var(--bg-hover);
}

.person-check-label {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.person-checkbox {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.person-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.person-cn {
  font-weight: 500;
  color: var(--text-primary);
}

.person-en {
  font-size: 12px;
  color: var(--text-muted);
}

.whitelist-badge {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-hover);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.person-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.edit-row {
  display: flex;
  gap: 8px;
  flex: 1;
  align-items: center;
}

.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

/* 过渡动画 */
.fade-enter-active { transition: opacity 0.2s; }
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
