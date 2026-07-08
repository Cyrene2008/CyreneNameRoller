<template>
  <div class="lists-view">
    <h1 class="page-title">
      <FluentIcon icon="people-list-24-regular" :width="28" />
      {{ t('listManager', lang) }}
    </h1>

    <!-- 名单选择与创建 -->
    <FluentCard class="list-header">
      <div class="list-header-row">
        <FluentSelect
          :model-value="namesStore.currentListId"
          :options="listOptions"
          @update:model-value="namesStore.switchList"
        />
        <FluentButton variant="primary" size="sm" @click="showCreateForm = true">
          <FluentIcon icon="add-16-regular" :width="14" />
          {{ t('createList', lang) }}
        </FluentButton>
      </div>

      <!-- 新建名单表单 -->
      <div v-if="showCreateForm" class="create-form">
        <FluentInput
          ref="newListInput"
          v-model="newListName"
          :placeholder="lang === 'en' ? 'New list name' : '新名单名称'"
          @enter="createList"
        />
        <FluentButton variant="primary" size="sm" @click="createList">
          <FluentIcon icon="checkmark-16-regular" :width="14" />
        </FluentButton>
        <FluentButton variant="subtle" size="sm" @click="showCreateForm = false; newListName = ''">
          <FluentIcon icon="dismiss-16-regular" :width="14" />
        </FluentButton>
      </div>
    </FluentCard>

    <!-- 添加人员 -->
    <FluentCard class="add-person-card">
      <div class="add-person-row">
        <FluentInput v-model="newCn" :placeholder="t('cnName', lang)" @enter="$refs.newEnInput?.focus()" />
        <FluentInput ref="newEnInput" v-model="newEn" :placeholder="t('enName', lang)" @enter="addPerson" />
        <FluentButton variant="primary" size="sm" @click="addPerson">
          <FluentIcon icon="add-16-regular" :width="14" />
          {{ t('addPerson', lang) }}
        </FluentButton>
      </div>
    </FluentCard>

    <!-- 人员列表 -->
    <FluentCard class="person-list-card">
      <div class="person-list-header">
        <span class="person-count">{{ namesStore.currentNames.length }} {{ lang === 'en' ? 'people' : '人' }}</span>
      </div>
      <div class="person-list">
        <div
          v-for="(person, index) in namesStore.currentNames"
          :key="index"
          class="person-item"
        >
          <div class="person-info">
            <span class="person-cn">{{ person.cn }}</span>
            <span class="person-en">{{ person.en }}</span>
            <span v-if="namesStore.isWhiteList(person.cn)" class="whitelist-badge">{{ lang === 'en' ? 'WL' : '白名单' }}</span>
          </div>
          <div class="person-actions">
            <FluentButton variant="subtle" size="sm" icon-only @click="startEdit(index)">
              <FluentIcon icon="edit-16-regular" :width="14" />
            </FluentButton>
            <FluentButton
              variant="subtle"
              size="sm"
              icon-only
              :disabled="namesStore.isWhiteList(person.cn)"
              @click="confirmDelete(index)"
            >
              <FluentIcon icon="delete-16-regular" :width="14" />
            </FluentButton>
          </div>
        </div>
        <div v-if="namesStore.currentNames.length === 0" class="empty-list">
          {{ lang === 'en' ? 'No names in this list' : '名单为空' }}
        </div>
      </div>
    </FluentCard>

    <!-- 操作按钮 -->
    <div class="list-actions">
      <FluentButton variant="secondary" @click="namesStore.resetCurrentList()">
        <FluentIcon icon="arrow-undo-16-regular" :width="14" />
        {{ t('resetList', lang) }}
      </FluentButton>
      <FluentButton variant="secondary" @click="namesStore.clearCurrentList()">
        <FluentIcon icon="delete-16-regular" :width="14" />
        {{ t('clearList', lang) }}
      </FluentButton>
      <FluentButton
        v-if="namesStore.allLists.length > 1"
        variant="danger"
        @click="namesStore.deleteList(namesStore.currentListId)"
      >
        <FluentIcon icon="dismiss-16-regular" :width="14" />
        {{ t('deleteList', lang) }}
      </FluentButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
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
const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')

const listOptions = computed(() =>
  namesStore.allLists.map(l => ({ value: l.id, label: l.name }))
)

const showCreateForm = ref(false)
const newListName = ref('')
const newCn = ref('')
const newEn = ref('')

function createList() {
  if (!newListName.value.trim()) return
  namesStore.createList(newListName.value)
  newListName.value = ''
  showCreateForm.value = false
}

function addPerson() {
  if (!newCn.value.trim()) return
  namesStore.addPerson(newCn.value, newEn.value)
  newCn.value = ''
  newEn.value = ''
}

function startEdit(index) {
  // TODO: implement inline edit
}

function confirmDelete(index) {
  namesStore.deletePerson(index)
}
</script>

<style scoped>
.lists-view {
  padding: 32px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.list-header {
  margin-bottom: 12px;
}

.list-header-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.create-form {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
}

.add-person-card {
  margin-bottom: 12px;
}

.add-person-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.person-list-card {
  padding: 0;
  overflow: hidden;
  margin-bottom: 16px;
}

.person-list-header {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-default);
}

.person-count {
  font-size: 13px;
  color: var(--text-muted);
}

.person-list {
  max-height: 400px;
  overflow-y: auto;
}

.person-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  border-bottom: 1px solid var(--border-default);
  transition: background var(--duration-fast) ease;
}

.person-item:last-child {
  border-bottom: none;
}

.person-item:hover {
  background: var(--bg-hover);
}

.person-info {
  display: flex;
  align-items: center;
  gap: 8px;
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
}

.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.list-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
