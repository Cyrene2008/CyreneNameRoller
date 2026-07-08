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
      <div v-if="showCreateForm" class="create-form">
        <FluentInput v-model="newListName" :placeholder="lang === 'en' ? 'New list name' : '新名单名称'" @enter="createList" />
        <FluentButton variant="primary" size="sm" @click="createList"><FluentIcon icon="checkmark-16-regular" :width="14" /></FluentButton>
        <FluentButton variant="subtle" size="sm" @click="showCreateForm = false; newListName = ''"><FluentIcon icon="dismiss-16-regular" :width="14" /></FluentButton>
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
        <span class="person-count">{{ namesStore.currentNames.length }} {{ lang === 'en' ? 'people' : '人' }}</span>
      </div>
      <div class="person-list">
        <div v-for="(person, index) in namesStore.currentNames" :key="index" class="person-item">
          <div class="person-info">
            <span class="person-cn">{{ person.cn }}</span>
            <span class="person-en">{{ person.en }}</span>
            <span v-if="namesStore.isWhiteList(person.cn)" class="whitelist-badge">{{ lang === 'en' ? 'WL' : '白名单' }}</span>
          </div>
          <div class="person-actions">
            <FluentButton variant="subtle" size="sm" icon-only :disabled="namesStore.isWhiteList(person.cn)" @click="namesStore.deletePerson(index)">
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
        <FluentIcon icon="arrow-undo-16-regular" :width="14" /> {{ t('resetList', lang) }}
      </FluentButton>
      <FluentButton variant="secondary" @click="namesStore.clearCurrentList()">
        <FluentIcon icon="delete-16-regular" :width="14" /> {{ t('clearList', lang) }}
      </FluentButton>
      <FluentButton v-if="namesStore.allLists.length > 1" variant="danger" @click="namesStore.deleteList(namesStore.currentListId)">
        <FluentIcon icon="dismiss-16-regular" :width="14" /> {{ t('deleteList', lang) }}
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
import { ref, computed } from 'vue'
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
const newEnRef = ref(null)

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

async function exportList() {
  const list = namesStore.currentList
  const data = JSON.stringify(list, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${list.name}.json`; a.click()
  URL.revokeObjectURL(url)
}

async function importList() {
  try {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.name && Array.isArray(data.names)) {
        namesStore.createList(data.name)
        data.names.forEach(n => namesStore.addPerson(n.cn, n.en))
        alert(lang.value === 'en' ? 'List imported' : '名单导入成功')
      } else {
        alert(lang.value === 'en' ? 'Invalid list file' : '无效的名单文件')
      }
    }
    input.click()
  } catch {
    alert(lang.value === 'en' ? 'Import failed' : '导入失败')
  }
}
</script>

<style scoped>
.lists-view { padding: 32px; }
.page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
.list-header { margin-bottom: 12px; }
.list-header-row { display: flex; gap: 12px; align-items: center; }
.create-form { display: flex; gap: 8px; margin-top: 12px; align-items: center; }
.add-person-card { margin-bottom: 12px; }
.add-person-row { display: flex; gap: 8px; flex-wrap: wrap; }
.person-list-card { padding: 0; overflow: hidden; margin-bottom: 16px; }
.person-list-header { padding: 12px 20px; border-bottom: 1px solid var(--border-default); }
.person-count { font-size: 13px; color: var(--text-muted); }
.person-list { max-height: 400px; overflow-y: auto; }
.person-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; border-bottom: 1px solid var(--border-default); transition: background var(--duration-fast) ease; }
.person-item:last-child { border-bottom: none; }
.person-item:hover { background: var(--bg-hover); }
.person-info { display: flex; align-items: center; gap: 8px; }
.person-cn { font-weight: 500; color: var(--text-primary); }
.person-en { font-size: 12px; color: var(--text-muted); }
.whitelist-badge { font-size: 11px; color: var(--text-muted); background: var(--bg-hover); padding: 1px 6px; border-radius: var(--radius-sm); }
.person-actions { display: flex; gap: 4px; }
.empty-list { padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 14px; }
.list-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.list-divider { width: 1px; height: 24px; background: var(--border-default); margin: 0 4px; }
</style>
