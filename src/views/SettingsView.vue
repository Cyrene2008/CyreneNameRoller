<template>
  <div class="settings-view">
    <h1 class="page-title">
      <FluentIcon icon="settings-24-regular" :width="28" />
      {{ t('settings', lang) }}
    </h1>

    <!-- 主题设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="color-24-regular" :width="20" /> {{ t('themeSettings', lang) }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Dark Mode' : '深色模式' }}</span>
        <FluentToggle :model-value="settingsStore.darkMode" @update:model-value="settingsStore.toggleDarkMode()" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Enable Statistics' : '启用数据统计' }}</span>
        <FluentToggle :model-value="settings.recordCounts" @update:model-value="update('recordCounts', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('rainbowNames', lang) }}</span>
        <FluentToggle :model-value="settings.rainbowNames" @update:model-value="update('rainbowNames', $event)" />
      </div>
      <p class="setting-note">{{ lang === 'en' ? 'When disabled, no statistics or extraction history will be recorded. Auto re-enabled on restart.' : '关闭后不再记录统计数据和抽取历史，下次重启自动开启。' }}</p>
    </FluentCard>

    <!-- 显示设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="desktop-24-regular" :width="20" /> {{ lang === 'en' ? 'Display' : '显示设置' }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ t('uiScale', lang) }}</span>
        <FluentSelect :model-value="settings.uiScale" :options="uiScaleOptions" @update:model-value="update('uiScale', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('fontSize', lang) }}</span>
        <FluentSelect :model-value="settings.nameFontSize" :options="fontSizeOptions" @update:model-value="update('nameFontSize', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('animSpeed', lang) }}</span>
        <div class="slider-group">
          <input type="range" :value="settings.animSpeed" min="0.5" max="2" step="0.1" class="speed-slider" @input="update('animSpeed', parseFloat($event.target.value))" />
          <span class="speed-value">{{ settings.animSpeed }}x</span>
        </div>
      </div>
    </FluentCard>

    <!-- 平衡算法 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="data-line-24-regular" :width="20" /> {{ t('balanceSettings', lang) }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Enable Balance Algorithm' : '启用平衡算法' }}</span>
        <FluentToggle :model-value="balance.enabled" @update:model-value="val => { balance.enabled = val; saveBalance() }" />
      </div>
      <Transition name="toggle-expand">
        <div v-if="balance.enabled" class="balance-sub">
          <p class="balance-explain">{{ lang === 'en' ? 'The fewer times a name is picked, the higher its probability of being picked next. The curve controls how aggressively this adjustment is applied.' : '被抽中次数越少的名字，下次被抽中的概率越高。曲线控制这种调整的力度。' }}</p>
          <FluentButton variant="secondary" size="sm" @click="showBalanceEditor = true">
            <FluentIcon icon="data-line-16-regular" :width="14" /> {{ lang === 'en' ? 'Edit Curve' : '编辑曲线' }}
          </FluentButton>
        </div>
      </Transition>
    </FluentCard>

    <!-- 数据安全 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="shield-lock-24-regular" :width="20" /> {{ lang === 'en' ? 'Data Security' : '数据安全' }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Data Password' : '数据操作密码' }}</span>
        <FluentButton variant="secondary" size="sm" @click="openPasswordModal">
          <FluentIcon icon="lock-closed-16-regular" :width="14" />
          {{ hasPassword ? (lang === 'en' ? 'Change Password' : '修改密码') : (lang === 'en' ? 'Set Password' : '设置密码') }}
        </FluentButton>
      </div>
      <p class="setting-note">{{ lang === 'en' ? 'Password is required for data export, import, and clear operations.' : '导出、导入和清除数据操作需要验证密码。' }}</p>
    </FluentCard>

    <!-- 数据管理 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="database-24-regular" :width="20" /> {{ t('dataManagement', lang) }}</h3>
      <div class="action-row">
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doExport"><FluentIcon icon="arrow-download-16-regular" :width="14" /> {{ lang === 'en' ? 'Export All' : '导出全部数据' }}</FluentButton>
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doImport"><FluentIcon icon="arrow-upload-16-regular" :width="14" /> {{ lang === 'en' ? 'Import Data' : '导入数据' }}</FluentButton>
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doClearRecords"><FluentIcon icon="broom-16-regular" :width="14" /> {{ lang === 'en' ? 'Clear Records' : '清空抽取记录' }}</FluentButton>
        <FluentButton variant="danger" :disabled="!hasPassword" @click="doClearAll"><FluentIcon icon="delete-16-regular" :width="14" /> {{ lang === 'en' ? 'Clear All Data' : '清除所有数据' }}</FluentButton>
      </div>
    </FluentCard>

    <!-- 更新日志 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="list-24-regular" :width="20" /> {{ t('changelog', lang) }}</h3>
      <div class="changelog-list">
        <div v-for="log in changelog" :key="log.version" class="changelog-item">
          <div class="changelog-header"><span class="changelog-version">{{ log.version }}</span><span class="changelog-date">{{ log.date }}</span></div>
          <ul class="changelog-logs"><li v-for="(entry, i) in log.logs" :key="i">{{ entry }}</li></ul>
        </div>
      </div>
    </FluentCard>

    <!-- 平衡曲线编辑器弹窗 -->
    <FluentModal v-model="showBalanceEditor" :title="lang === 'en' ? 'Balance Curve Editor' : '平衡曲线编辑器'" max-width="600px">
      <BalanceEditor v-model="balance.points" :lang="lang" @update:model-value="saveBalance" />
      <template #footer>
        <FluentButton variant="secondary" size="sm" @click="showBalanceEditor = false">{{ lang === 'en' ? 'Close' : '关闭' }}</FluentButton>
        <FluentButton variant="primary" size="sm" @click="resetBalance">{{ lang === 'en' ? 'Reset' : '恢复默认' }}</FluentButton>
      </template>
    </FluentModal>

    <!-- 密码弹窗 -->
    <FluentModal v-model="showPwModal" :title="pwModalTitle" max-width="400px">
      <div class="pw-modal-body">
        <p class="pw-hint">{{ pwModalHint }}</p>
        <FluentInput v-model="pwInput" type="password" :placeholder="lang === 'en' ? 'Password' : '密码'" @enter="confirmPassword" />
        <p v-if="pwError" class="pw-error">{{ pwError }}</p>
      </div>
      <template #footer>
        <FluentButton variant="secondary" size="sm" @click="showPwModal = false">{{ lang === 'en' ? 'Cancel' : '取消' }}</FluentButton>
        <FluentButton variant="primary" size="sm" @click="confirmPassword">{{ lang === 'en' ? 'Confirm' : '确认' }}</FluentButton>
      </template>
    </FluentModal>

    <!-- 导入警告 -->
    <FluentModal v-model="showImportWarning" :title="lang === 'en' ? 'Import Warning' : '导入警告'" max-width="440px">
      <div class="pw-modal-body">
        <p class="pw-hint">{{ lang === 'en' ? 'Importing will overwrite all current data. This cannot be undone. Continue?' : '导入将覆盖当前所有数据，此操作不可撤销。是否继续？' }}</p>
      </div>
      <template #footer>
        <FluentButton variant="secondary" size="sm" @click="showImportWarning = false">{{ lang === 'en' ? 'Cancel' : '取消' }}</FluentButton>
        <FluentButton variant="danger" size="sm" @click="confirmImport">{{ lang === 'en' ? 'Import' : '确认导入' }}</FluentButton>
      </template>
    </FluentModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useRecordsStore } from '../stores/records'
import { useStatisticsStore } from '../stores/statistics'
import { dataBridge } from '../utils/dataBridge'
import { t } from '../utils/i18n'
import { DEFAULT_BALANCE_SETTINGS, normalizeSettings } from '../utils/balance'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentInput from '../components/FluentInput.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentModal from '../components/FluentModal.vue'
import BalanceEditor from '../components/BalanceEditor.vue'

const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const recordsStore = useRecordsStore()
const statisticsStore = useStatisticsStore()

const lang = computed(() => 'zh')
const settings = computed(() => settingsStore.settings)

const balance = ref(JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS)))
const changelog = ref([])
const showBalanceEditor = ref(false)

const uiScaleOptions = [
  { value: 75, label: '75%' }, { value: 100, label: '100%' }, { value: 125, label: '125%' },
  { value: 150, label: '150%' }, { value: 175, label: '175%' }, { value: 200, label: '200%' }
]
const fontSizeOptions = [
  { value: 0.75, label: '0.75x' }, { value: 1.0, label: '1.0x' }, { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' }, { value: 1.75, label: '1.75x' }, { value: 2.0, label: '2.0x' }
]

const hasPassword = ref(false)
const showPwModal = ref(false)
const pwInput = ref('')
const pwError = ref('')
const pwModalMode = ref('verify')
const pendingAction = ref(null)
const showImportWarning = ref(false)

const pwModalTitle = computed(() => {
  if (pwModalMode.value === 'set') return '设置密码'
  if (pwModalMode.value === 'change') return '修改密码'
  return '验证密码'
})
const pwModalHint = computed(() => {
  if (pwModalMode.value === 'set') return '设置密码以保护数据操作：'
  if (pwModalMode.value === 'change') return '请输入当前密码验证后设置新密码：'
  return '请输入密码以继续：'
})

function update(key, value) { settingsStore.update(key, value) }

onMounted(async () => {
  if (!settings.value.recordCounts) settingsStore.update('recordCounts', true)
})

async function sha256(str) {
  const data = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function loadPasswordHash() {
  const stored = await dataBridge.load('password')
  if (stored && stored.hash) { hasPassword.value = true; return stored.hash }
  hasPassword.value = false; return null
}

async function savePasswordHash(hash) { await dataBridge.save('password', { hash }); hasPassword.value = true }

function openPasswordModal() {
  pwModalMode.value = hasPassword.value ? 'change' : 'set'
  pwInput.value = ''; pwError.value = ''; showPwModal.value = true
}

async function confirmPassword() {
  pwError.value = ''
  if (pwModalMode.value === 'set') {
    if (!pwInput.value) { pwError.value = '请输入密码'; return }
    await savePasswordHash(await sha256(pwInput.value))
    showPwModal.value = false; pwInput.value = ''
    if (pendingAction.value) { executePending(); pendingAction.value = null }
    return
  }
  if (pwModalMode.value === 'change') {
    const stored = await loadPasswordHash()
    if (stored && (await sha256(pwInput.value)) !== stored) { pwError.value = '密码错误'; return }
    pwModalMode.value = 'set'; pwInput.value = ''; pwError.value = ''; return
  }
  const stored = await loadPasswordHash()
  if (!stored) { showPwModal.value = false; executePending(); return }
  if ((await sha256(pwInput.value)) !== stored) { pwError.value = '密码错误'; return }
  showPwModal.value = false; pwInput.value = ''
  if (pendingAction.value) { executePending(); pendingAction.value = null }
}

function executePending() {
  const a = pendingAction.value
  if (a === 'export') doExportNow()
  else if (a === 'import') showImportWarning.value = true
  else if (a === 'clearRecords') { recordsStore.clearAll(); alert('抽取记录已清空') }
  else if (a === 'clearAll') doClearAllNow()
}

function requirePassword(action) { pendingAction.value = action; if (!hasPassword.value) { openPasswordModal(); return }; pwModalMode.value = 'verify'; pwInput.value = ''; pwError.value = ''; showPwModal.value = true }
function doExport() { requirePassword('export') }
function doImport() { requirePassword('import') }
function doClearRecords() { requirePassword('clearRecords') }
function doClearAll() { requirePassword('clearAll') }

async function doExportNow() { const r = await dataBridge.exportData(); if (r.success) alert('导出成功') }
async function confirmImport() { showImportWarning.value = false; const r = await dataBridge.importData(); if (r.success) alert('导入成功，请重启应用。') }
async function doClearAllNow() { await dataBridge.save('lists', {}); await dataBridge.save('statistics', { counts: {}, totalCount: 0 }); await dataBridge.save('records', []); alert('所有数据已清除，请重启应用。') }

async function saveBalance() {
  const normalized = normalizeSettings(balance.value)
  balance.value = normalized
  await dataBridge.save('balance', normalized)
}

function resetBalance() {
  balance.value = JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS))
  saveBalance()
}

onMounted(async () => {
  await loadPasswordHash()
  const saved = await dataBridge.load('balance')
  if (saved) balance.value = normalizeSettings(saved)
  const logs = await dataBridge.loadChangelog()
  changelog.value = logs || []
})
</script>

<style scoped>
.settings-view { padding: 32px; }
.page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
.settings-section { margin-bottom: 16px; }
.section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; gap: 16px; }
.setting-label { font-size: 14px; color: var(--text-secondary); }
.setting-note { font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.5; }
.slider-group { display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
.speed-slider { width: 200px; accent-color: var(--accent); }
.speed-value { font-size: 13px; color: var(--text-muted); min-width: 32px; text-align: right; }

.balance-sub { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 10px; }
.balance-explain { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

.action-row { display: flex; gap: 8px; flex-wrap: wrap; }
.pw-modal-body { padding: 8px 0; }
.pw-hint { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5; }
.pw-error { font-size: 13px; color: #c42b1c; margin-top: 8px; }

.changelog-list { max-height: 400px; overflow-y: auto; }
.changelog-item { padding: 12px 0; border-bottom: 1px solid var(--border-default); }
.changelog-item:last-child { border-bottom: none; }
.changelog-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.changelog-version { font-weight: 600; color: var(--text-primary); font-size: 14px; }
.changelog-date { font-size: 12px; color: var(--text-muted); }
.changelog-logs { list-style: disc; padding-left: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.changelog-logs li { margin-bottom: 2px; }

.toggle-expand-enter-active { animation: toggle-in 0.25s cubic-bezier(0.1, 0.9, 0.2, 1); }
.toggle-expand-leave-active { animation: toggle-in 0.15s ease-in reverse; }
@keyframes toggle-in { from { opacity: 0; transform: translateY(-8px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 300px; } }
</style>
