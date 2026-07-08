<template>
  <div class="settings-view">
    <h1 class="page-title">
      <FluentIcon icon="settings-24-regular" :width="28" />
      {{ t('settings', lang) }}
    </h1>

    <!-- 主题设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title">
        <FluentIcon icon="color-24-regular" :width="20" />
        {{ t('themeSettings', lang) }}
      </h3>
      <div class="setting-row">
        <span class="setting-label">{{ t('recordCounts', lang) }}</span>
        <FluentToggle :model-value="settings.recordCounts" @update:model-value="update('recordCounts', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('rainbowNames', lang) }}</span>
        <FluentToggle :model-value="settings.rainbowNames" @update:model-value="update('rainbowNames', $event)" />
      </div>
    </FluentCard>

    <!-- 平衡算法 -->
    <FluentCard class="settings-section">
      <h3 class="section-title">
        <FluentIcon icon="data-line-24-regular" :width="20" />
        {{ t('balanceSettings', lang) }}
      </h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Enable Balance' : '启用平衡算法' }}</span>
        <FluentToggle v-model="balance.enabled" @update:model-value="saveBalance" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Factor' : '平衡因子' }}</span>
        <FluentInput v-model="balance.factor" type="number" :step="0.1" style="width: 100px;" @update:model-value="saveBalance" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Max Threshold' : '最大阈值' }}</span>
        <FluentInput v-model="balance.maxThreshold" type="number" :step="0.1" style="width: 100px;" @update:model-value="saveBalance" />
      </div>
      <p class="setting-note">{{ t('balanceNote', lang) }}</p>
    </FluentCard>

    <!-- 性能设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title">
        <FluentIcon icon="gauge-24-regular" :width="20" />
        {{ t('performance', lang) }}
      </h3>
      <div class="setting-row">
        <span class="setting-label">{{ t('animSpeed', lang) }}</span>
        <input
          type="range"
          :value="settings.animSpeed"
          min="0.5"
          max="2"
          step="0.1"
          class="speed-slider"
          @input="update('animSpeed', parseFloat($event.target.value))"
        />
        <span class="speed-value">{{ settings.animSpeed }}x</span>
      </div>
      <p class="setting-note">{{ t('perfNote', lang) }}</p>
    </FluentCard>

    <!-- 数据管理 -->
    <FluentCard class="settings-section">
      <h3 class="section-title">
        <FluentIcon icon="database-24-regular" :width="20" />
        {{ t('dataManagement', lang) }}
      </h3>
      <div class="action-row">
        <FluentButton variant="secondary" @click="exportData">
          <FluentIcon icon="arrow-download-16-regular" :width="14" />
          {{ lang === 'en' ? 'Export' : '导出数据' }}
        </FluentButton>
        <FluentButton variant="secondary" @click="importData">
          <FluentIcon icon="arrow-upload-16-regular" :width="14" />
          {{ lang === 'en' ? 'Import' : '导入数据' }}
        </FluentButton>
      </div>
    </FluentCard>

    <!-- 更新日志 -->
    <FluentCard class="settings-section">
      <h3 class="section-title">
        <FluentIcon icon="list-24-regular" :width="20" />
        {{ t('changelog', lang) }}
      </h3>
      <div class="changelog-list">
        <div v-for="log in changelog" :key="log.version" class="changelog-item">
          <div class="changelog-header">
            <span class="changelog-version">{{ log.version }}</span>
            <span class="changelog-date">{{ log.date }}</span>
          </div>
          <ul class="changelog-logs">
            <li v-for="(entry, i) in log.logs" :key="i">{{ entry }}</li>
          </ul>
        </div>
      </div>
    </FluentCard>

    <div class="version-info">
      <p>CyreneNameRoller v3.0.0</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'
import { t } from '../utils/i18n'
import { DEFAULT_BALANCE_SETTINGS, normalizeSettings } from '../utils/balance'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentInput from '../components/FluentInput.vue'

const settingsStore = useSettingsStore()
const statisticsStore = useStatisticsStore()

const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
const settings = computed(() => settingsStore.settings)

const balance = ref({ ...DEFAULT_BALANCE_SETTINGS })
const changelog = ref([])

function update(key, value) {
  settingsStore.update(key, value)
}

async function saveBalance() {
  await window.electronAPI.saveData('balance', balance.value)
}

async function exportData() {
  const result = await window.electronAPI.exportData()
  if (result.success) {
    alert(lang.value === 'en' ? 'Exported successfully' : '导出成功')
  }
}

async function importData() {
  const result = await window.electronAPI.importData()
  if (result.success) {
    alert(lang.value === 'en' ? 'Imported successfully. Please restart.' : '导入成功，请重启应用。')
  }
}

onMounted(async () => {
  const saved = await window.electronAPI.loadData('balance')
  if (saved) {
    balance.value = normalizeSettings(saved)
  }

  const logs = await window.electronAPI.loadChangelog()
  changelog.value = logs || []
})
</script>

<style scoped>
.settings-view {
  padding: 32px;
  max-width: 700px;
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

.settings-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  gap: 16px;
}

.setting-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.setting-note {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
  line-height: 1.5;
}

.speed-slider {
  flex: 1;
  max-width: 200px;
  accent-color: var(--accent);
}

.speed-value {
  font-size: 13px;
  color: var(--text-muted);
  min-width: 32px;
  text-align: right;
}

.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.changelog-list {
  max-height: 400px;
  overflow-y: auto;
}

.changelog-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-default);
}

.changelog-item:last-child {
  border-bottom: none;
}

.changelog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.changelog-version {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.changelog-date {
  font-size: 12px;
  color: var(--text-muted);
}

.changelog-logs {
  list-style: disc;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.changelog-logs li {
  margin-bottom: 2px;
}

.version-info {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
