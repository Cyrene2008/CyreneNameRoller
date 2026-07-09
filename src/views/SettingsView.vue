<template>
  <div class="settings-view">
    <h1 class="page-title">
      <FluentIcon icon="settings-24-regular" :width="28" />
      {{ t('settings', lang) }}
    </h1>

    <!-- 基本设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="options-24-regular" :width="20" /> {{ lang === 'en' ? 'General' : '基本设置' }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Language' : '语言' }}</span>
        <FluentSelect :model-value="settings.language" :options="langOptions" @update:model-value="update('language', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Dark Mode' : '深色模式' }}</span>
        <FluentToggle :model-value="settingsStore.darkMode" @update:model-value="settingsStore.toggleDarkMode()" />
      </div>
      <div v-if="isDesktop" class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Check for Updates' : '检查更新' }}</span>
        <FluentButton variant="secondary" size="sm" :disabled="updateState.checking" @click="doCheckUpdate">
          <FluentIcon icon="arrow-sync-16-regular" :width="14" />
          {{ updateState.checking ? (lang === 'en' ? 'Checking...' : '检查中...') : (lang === 'en' ? 'Check' : '检查') }}
        </FluentButton>
      </div>
      <div v-if="isDesktop && updateState.available" class="update-info">
        <FluentIcon icon="arrow-download-16-regular" :width="14" />
        <span>{{ lang === 'en' ? 'New version:' : '发现新版本：' }}{{ updateState.version }}</span>
        <FluentButton variant="primary" size="sm" @click="downloadUpdate">{{ lang === 'en' ? 'Download' : '下载' }}</FluentButton>
      </div>
      <p v-if="isDesktop && updateState.error" class="setting-note" style="color: var(--accent);">{{ updateState.error }}</p>
    </FluentCard>

    <!-- 主题与显示 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="color-24-regular" :width="20" /> {{ lang === 'en' ? 'Theme & Display' : '主题与显示' }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ t('nameColorMode', lang) }}</span>
        <FluentSelect :model-value="settings.nameColorMode" :options="colorModeOptions" @update:model-value="update('nameColorMode', $event)" />
      </div>
      <Transition name="toggle-expand">
        <div v-if="settings.nameColorMode === 'custom'" class="sub-setting">
          <div class="setting-row">
            <span class="setting-label">{{ t('customColorLight', lang) }}</span>
            <div class="color-picker-row">
              <input type="color" :value="settings.customNameColorLight" class="color-input" @input="update('customNameColorLight', $event.target.value)" />
              <span class="color-value">{{ settings.customNameColorLight }}</span>
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">{{ t('customColorDark', lang) }}</span>
            <div class="color-picker-row">
              <input type="color" :value="settings.customNameColorDark" class="color-input" @input="update('customNameColorDark', $event.target.value)" />
              <span class="color-value">{{ settings.customNameColorDark }}</span>
            </div>
          </div>
        </div>
      </Transition>
      <div class="setting-row">
        <span class="setting-label">{{ t('uiScale', lang) }}</span>
        <FluentSelect :model-value="settings.uiScale" :options="uiScaleOptions" @update:model-value="update('uiScale', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('fontSize', lang) }}</span>
        <FluentSelect :model-value="settings.nameFontSize" :options="fontSizeOptions" @update:model-value="update('nameFontSize', $event)" />
      </div>
    </FluentCard>

    <!-- 性能设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="gauge-24-regular" :width="20" /> {{ lang === 'en' ? 'Performance' : '性能设置' }}</h3>
      <div class="setting-row">
        <div class="setting-label-group">
          <span class="setting-label">{{ lang === 'en' ? 'Acrylic Blur' : '亚克力模糊' }}</span>
          <span class="setting-desc">{{ lang === 'en' ? 'Glass blur on cards, dock, titlebar' : '卡片、侧边栏、标题栏的毛玻璃效果' }}</span>
        </div>
        <FluentToggle :model-value="settings.perfBlur" @update:model-value="update('perfBlur', $event)" />
      </div>
      <div class="setting-row">
        <div class="setting-label-group">
          <span class="setting-label">{{ lang === 'en' ? 'Shadows' : '阴影效果' }}</span>
          <span class="setting-desc">{{ lang === 'en' ? 'Card and button drop shadows' : '卡片和按钮的投影效果' }}</span>
        </div>
        <FluentToggle :model-value="settings.perfShadows" @update:model-value="update('perfShadows', $event)" />
      </div>
      <div class="setting-row">
        <div class="setting-label-group">
          <span class="setting-label">{{ lang === 'en' ? 'Animations' : '过渡动画' }}</span>
          <span class="setting-desc">{{ lang === 'en' ? 'Page transitions, hover effects' : '页面切换动画、悬停效果' }}</span>
        </div>
        <FluentToggle :model-value="settings.perfAnimations" @update:model-value="update('perfAnimations', $event)" />
      </div>
      <p class="setting-note">{{ lang === 'en' ? 'Disable options to improve performance on integrated GPUs.' : '关闭选项可提升核显设备性能。' }}</p>
    </FluentCard>

    <!-- 数据管理 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="database-24-regular" :width="20" /> {{ lang === 'en' ? 'Data' : '数据管理' }}</h3>
      <div class="setting-row">
        <div class="setting-label-group">
          <span class="setting-label">{{ lang === 'en' ? 'Enable Statistics' : '启用数据统计' }}</span>
          <span class="setting-desc">{{ lang === 'en' ? 'When off, no stats or history recorded. Auto re-enabled on restart.' : '关闭后不记录统计和历史，重启自动开启。' }}</span>
        </div>
        <FluentToggle :model-value="settings.recordCounts" @update:model-value="update('recordCounts', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Data Password' : '数据操作密码' }}</span>
        <FluentButton variant="secondary" size="sm" @click="openPasswordModal">
          <FluentIcon icon="lock-closed-16-regular" :width="14" />
          {{ hasPassword ? (lang === 'en' ? 'Change' : '修改密码') : (lang === 'en' ? 'Set' : '设置密码') }}
        </FluentButton>
      </div>
      <div class="action-row">
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doExport">
          <FluentIcon icon="arrow-download-16-regular" :width="14" /> {{ lang === 'en' ? 'Export' : '导出数据' }}
        </FluentButton>
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doImport">
          <FluentIcon icon="arrow-upload-16-regular" :width="14" /> {{ lang === 'en' ? 'Import' : '导入数据' }}
        </FluentButton>
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doClearRecords">
          <FluentIcon icon="broom-16-regular" :width="14" /> {{ lang === 'en' ? 'Clear Records' : '清空记录' }}
        </FluentButton>
        <FluentButton variant="danger" :disabled="!hasPassword" @click="doClearAll">
          <FluentIcon icon="delete-16-regular" :width="14" /> {{ lang === 'en' ? 'Clear All' : '清除全部' }}
        </FluentButton>
      </div>
    </FluentCard>

    <!-- 平衡算法 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="data-line-24-regular" :width="20" /> {{ t('balanceSettings', lang) }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Enable Balance' : '启用平衡算法' }}</span>
        <FluentToggle :model-value="balance.enabled" @update:model-value="val => { balance.enabled = val; saveBalance() }" />
      </div>
      <Transition name="toggle-expand">
        <div v-if="balance.enabled" class="balance-sub">
          <p class="balance-explain">{{ lang === 'en' ? 'Names picked fewer times get higher probability next round.' : '被抽中次数越少，下次被抽中的概率越高。' }}</p>
          <FluentButton variant="secondary" size="sm" @click="router.push('/settings/balance-curve')">
            <FluentIcon icon="data-line-16-regular" :width="14" /> {{ lang === 'en' ? 'Edit Curve' : '编辑曲线' }}
          </FluentButton>
        </div>
      </Transition>
    </FluentCard>

    <!-- 更新日志 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="list-24-regular" :width="20" /> {{ t('changelog', lang) }}</h3>
      <div class="changelog-list">
        <div v-for="log in changelog" :key="log.version" class="changelog-item">
          <div class="changelog-header"><span class="changelog-version">{{ log.version }}</span><span class="changelog-date">{{ log.date }}</span></div>
          <ul class="changelog-logs"><li v-for="(entry, i) in getLogEntries(log)" :key="i">{{ entry }}</li></ul>
        </div>
      </div>
    </FluentCard>

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

    <FluentModal v-model="showImportWarning" :title="lang === 'en' ? 'Warning' : '警告'" max-width="440px">
      <div class="pw-modal-body">
        <p class="pw-hint">{{ lang === 'en' ? 'This will overwrite all data. Continue?' : '将覆盖所有数据，是否继续？' }}</p>
      </div>
      <template #footer>
        <FluentButton variant="secondary" size="sm" @click="showImportWarning = false">{{ lang === 'en' ? 'Cancel' : '取消' }}</FluentButton>
        <FluentButton variant="danger" size="sm" @click="confirmImport">{{ lang === 'en' ? 'Import' : '确认导入' }}</FluentButton>
      </template>
    </FluentModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useRecordsStore } from '../stores/records'
import { useStatisticsStore } from '../stores/statistics'
import { dataBridge } from '../utils/dataBridge'
import { isTauri } from '../utils/tauriAPI'
import { updateState, checkForUpdates, downloadUpdate } from '../utils/updater'
import { t } from '../utils/i18n'
import { DEFAULT_BALANCE_SETTINGS, normalizeSettings } from '../utils/balance'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentInput from '../components/FluentInput.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentModal from '../components/FluentModal.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const recordsStore = useRecordsStore()
const statisticsStore = useStatisticsStore()

const lang = computed(() => settingsStore.settings.language)
const settings = computed(() => settingsStore.settings)

const isDesktop = computed(() => !!window.electronAPI || isTauri())

const langOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
]
const uiScaleOptions = [
  { value: 75, label: '75%' }, { value: 100, label: '100%' }, { value: 125, label: '125%' },
  { value: 150, label: '150%' }, { value: 175, label: '175%' }, { value: 200, label: '200%' }
]
const fontSizeOptions = [
  { value: 0.75, label: '0.75x' }, { value: 1.0, label: '1.0x' }, { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' }, { value: 1.75, label: '1.75x' }, { value: 2.0, label: '2.0x' }
]

const colorModeOptions = [
  { value: 'gradient', label: lang.value === 'en' ? 'Gradient' : '渐变' },
  { value: 'custom', label: lang.value === 'en' ? 'Custom Solid' : '自定义单色' }
]

const balance = ref(JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS)))
const changelog = ref([])
const hasPassword = ref(false)
const showPwModal = ref(false)
const pwInput = ref('')
const pwError = ref('')
const pwModalMode = ref('verify')
const pendingAction = ref(null)
const showImportWarning = ref(false)

const pwModalTitle = computed(() => {
  if (pwModalMode.value === 'set') return lang.value === 'en' ? 'Set Password' : '设置密码'
  if (pwModalMode.value === 'change') return lang.value === 'en' ? 'Change Password' : '修改密码'
  return lang.value === 'en' ? 'Verify Password' : '验证密码'
})
const pwModalHint = computed(() => {
  if (pwModalMode.value === 'set') return lang.value === 'en' ? 'Set a password:' : '设置密码：'
  if (pwModalMode.value === 'change') return lang.value === 'en' ? 'Verify current password:' : '请验证当前密码：'
  return lang.value === 'en' ? 'Enter password:' : '请输入密码：'
})

function update(key, value) { settingsStore.update(key, value) }

function doCheckUpdate() { checkForUpdates(false) }

function getLogEntries(log) {
  if (!log.logs) return []
  if (Array.isArray(log.logs)) return log.logs
  return log.logs[lang.value] || log.logs.zh || []
}

onMounted(async () => {
  if (!settings.value.recordCounts) settingsStore.update('recordCounts', true)
  await loadPasswordHash()
  const saved = await dataBridge.load('balance')
  if (saved) balance.value = normalizeSettings(saved)
  const logs = await dataBridge.loadChangelog()
  changelog.value = logs || []
})

async function sha256(str) { const d = new TextEncoder().encode(str); const h = await crypto.subtle.digest('SHA-256', d); return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('') }
async function loadPasswordHash() { const s = await dataBridge.load('password'); if (s && s.hash) { hasPassword.value = true; return s.hash }; hasPassword.value = false; return null }
async function savePasswordHash(hash) { await dataBridge.save('password', { hash }); hasPassword.value = true }
function openPasswordModal() { pwModalMode.value = hasPassword.value ? 'change' : 'set'; pwInput.value = ''; pwError.value = ''; showPwModal.value = true }
async function confirmPassword() {
  pwError.value = ''
  if (pwModalMode.value === 'set') { if (!pwInput.value) { pwError.value = '请输入密码'; return }; await savePasswordHash(await sha256(pwInput.value)); showPwModal.value = false; pwInput.value = ''; if (pendingAction.value) { executePending(); pendingAction.value = null }; return }
  if (pwModalMode.value === 'change') { const s = await loadPasswordHash(); if (s && (await sha256(pwInput.value)) !== s) { pwError.value = '密码错误'; return }; pwModalMode.value = 'set'; pwInput.value = ''; return }
  const s = await loadPasswordHash(); if (!s) { showPwModal.value = false; executePending(); return }; if ((await sha256(pwInput.value)) !== s) { pwError.value = '密码错误'; return }; showPwModal.value = false; pwInput.value = ''; if (pendingAction.value) { executePending(); pendingAction.value = null }
}
function executePending() { const a = pendingAction.value; if (a === 'export') doExportNow(); else if (a === 'import') showImportWarning.value = true; else if (a === 'clearRecords') { recordsStore.clearAll() } else if (a === 'clearAll') doClearAllNow() }
function requirePassword(action) { pendingAction.value = action; if (!hasPassword.value) { openPasswordModal(); return }; pwModalMode.value = 'verify'; pwInput.value = ''; pwError.value = ''; showPwModal.value = true }
function doExport() { requirePassword('export') }
function doImport() { requirePassword('import') }
function doClearRecords() { requirePassword('clearRecords') }
function doClearAll() { requirePassword('clearAll') }
async function doExportNow() { await dataBridge.exportData() }
async function confirmImport() {
  showImportWarning.value = false
  const result = await dataBridge.importData()
  if (result.success) {
    alert(lang.value === 'en'
      ? 'Import successful. Please close and restart the app manually.'
      : '导入成功。请手动关闭并重启应用。')
  } else if (!result.cancelled) {
    alert(lang.value === 'en' ? 'Import failed: ' + (result.error || 'Unknown') : '导入失败：' + (result.error || '未知错误'))
  }
}
async function doClearAllNow() {
  await dataBridge.clearAll()
  alert(lang.value === 'en' ? 'All data cleared. Please close and restart.' : '所有数据已清除，请关闭并重启应用。')
}
async function saveBalance() { const n = normalizeSettings(balance.value); balance.value = n; await dataBridge.save('balance', n) }
function resetBalance() { balance.value = JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS)); saveBalance() }
</script>

<style scoped>
.settings-view { padding: 32px; }
.page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
.settings-section { margin-bottom: 16px; }
.section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; gap: 16px; }
.setting-label { font-size: 14px; color: var(--text-secondary); }
.setting-label-group { display: flex; flex-direction: column; gap: 2px; }
.setting-desc { font-size: 12px; color: var(--text-muted); }
.balance-sub { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 10px; }
.balance-explain { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.sub-setting { padding-left: 16px; border-left: 2px solid var(--accent-200); margin-left: 0; }
.color-picker-row { display: flex; align-items: center; gap: 10px; }
.color-input { width: 40px; height: 32px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); cursor: pointer; padding: 2px; background: transparent; }
.color-value { font-size: 13px; color: var(--text-muted); font-family: var(--font-ui); font-variant-numeric: tabular-nums; }
.action-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.pw-modal-body { padding: 8px 0; }
.pw-hint { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }
.pw-error { font-size: 13px; color: #c42b1c; margin-top: 8px; }
.changelog-list { max-height: 400px; overflow-y: auto; }
.changelog-item { padding: 12px 0; border-bottom: 1px solid var(--border-default); }
.changelog-item:last-child { border-bottom: none; }
.changelog-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.changelog-version { font-weight: 600; color: var(--text-primary); font-size: 14px; }
.changelog-date { font-size: 12px; color: var(--text-muted); }
.changelog-logs { list-style: disc; padding-left: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.toggle-expand-enter-active { animation: toggle-in 0.25s cubic-bezier(0.1, 0.9, 0.2, 1); }
.toggle-expand-leave-active { animation: toggle-in 0.15s ease-in reverse; }
@keyframes toggle-in { from { opacity: 0; transform: translateY(-8px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 300px; } }
</style>
