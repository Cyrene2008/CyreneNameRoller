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
        <span class="setting-label">{{ t('recordCounts', lang) }}</span>
        <FluentToggle :model-value="settings.recordCounts" @update:model-value="update('recordCounts', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('rainbowNames', lang) }}</span>
        <FluentToggle :model-value="settings.rainbowNames" @update:model-value="update('rainbowNames', $event)" />
      </div>
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
    </FluentCard>

    <!-- 平衡算法 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="data-line-24-regular" :width="20" /> {{ t('balanceSettings', lang) }}</h3>
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
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Max Boost (%)' : '最大提升值（%）' }}</span>
        <FluentInput v-model="balance.maxBoostPercent" type="number" :step="1" style="width: 100px;" @update:model-value="saveBalance" />
      </div>
      <div class="curve-section">
        <h4 class="curve-title">{{ lang === 'en' ? 'Curve Points' : '三点曲线（拟合函数）' }}</h4>
        <div class="points-grid">
          <template v-for="(pt, idx) in balance.points" :key="idx">
            <span class="point-label">{{ lang === 'en' ? `P${idx+1} X` : `点${idx+1} X（差值）` }}</span>
            <FluentInput v-model="pt.x" type="number" :step="0.1" @update:model-value="saveBalance" />
            <span class="point-label">{{ lang === 'en' ? `P${idx+1} Y` : `点${idx+1} Y（倍率%）` }}</span>
            <FluentInput v-model="pt.y" type="number" :step="1" @update:model-value="saveBalance" />
          </template>
        </div>
        <div class="preview-wrap">
          <canvas ref="balanceCanvasRef" class="balance-canvas" />
          <div class="preview-summary">{{ balanceSummary }}</div>
        </div>
        <div class="curve-actions">
          <FluentButton variant="primary" size="sm" @click="saveBalance"><FluentIcon icon="save-16-regular" :width="14" /> {{ lang === 'en' ? 'Save' : '保存设置' }}</FluentButton>
          <FluentButton variant="secondary" size="sm" @click="resetBalance"><FluentIcon icon="arrow-undo-16-regular" :width="14" /> {{ lang === 'en' ? 'Reset' : '恢复默认' }}</FluentButton>
        </div>
      </div>
      <p class="setting-note">{{ t('balanceNote', lang) }}</p>
    </FluentCard>

    <!-- 性能设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="gauge-24-regular" :width="20" /> {{ t('performance', lang) }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ t('animSpeed', lang) }}</span>
        <div class="slider-group">
          <input type="range" :value="settings.animSpeed" min="0.5" max="2" step="0.1" class="speed-slider" @input="update('animSpeed', parseFloat($event.target.value))" />
          <span class="speed-value num-font">{{ settings.animSpeed }}x</span>
        </div>
      </div>
      <p class="setting-note">{{ t('perfNote', lang) }}</p>
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
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doExport">
          <FluentIcon icon="arrow-download-16-regular" :width="14" /> {{ lang === 'en' ? 'Export All' : '导出全部数据' }}
        </FluentButton>
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doImport">
          <FluentIcon icon="arrow-upload-16-regular" :width="14" /> {{ lang === 'en' ? 'Import Data' : '导入数据' }}
        </FluentButton>
        <FluentButton variant="secondary" :disabled="!hasPassword" @click="doClearRecords">
          <FluentIcon icon="broom-16-regular" :width="14" /> {{ lang === 'en' ? 'Clear Records' : '清空抽取记录' }}
        </FluentButton>
        <FluentButton variant="danger" :disabled="!hasPassword" @click="doClearAll">
          <FluentIcon icon="delete-16-regular" :width="14" /> {{ lang === 'en' ? 'Clear All Data' : '清除所有数据' }}
        </FluentButton>
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

    <!-- 导入警告弹窗 -->
    <FluentModal v-model="showImportWarning" :title="lang === 'en' ? 'Import Warning' : '导入警告'" max-width="440px">
      <div class="pw-modal-body">
        <p class="pw-hint">{{ lang === 'en' ? 'Importing will overwrite all current data (lists, settings, records). This cannot be undone. Continue?' : '导入将覆盖当前所有数据（名单、设置、记录等），此操作不可撤销。是否继续？' }}</p>
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
import { t } from '../utils/i18n'
import { DEFAULT_BALANCE_SETTINGS, normalizeSettings, interpolateQuadratic } from '../utils/balance'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentInput from '../components/FluentInput.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentModal from '../components/FluentModal.vue'

const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const recordsStore = useRecordsStore()
const statisticsStore = useStatisticsStore()

const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
const settings = computed(() => settingsStore.settings)

const balance = ref(JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS)))
const changelog = ref([])
const balanceCanvasRef = ref(null)
const balanceSummary = ref('')

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
  if (pwModalMode.value === 'set') return lang.value === 'en' ? 'Set Password' : '设置密码'
  if (pwModalMode.value === 'change') return lang.value === 'en' ? 'Change Password' : '修改密码'
  return lang.value === 'en' ? 'Verify Password' : '验证密码'
})
const pwModalHint = computed(() => {
  if (pwModalMode.value === 'set') return lang.value === 'en' ? 'Set a password to protect data operations:' : '设置密码以保护数据操作：'
  if (pwModalMode.value === 'change') return lang.value === 'en' ? 'Enter current password, then new password:' : '请输入当前密码，然后设置新密码：'
  return lang.value === 'en' ? 'Enter password to continue:' : '请输入密码以继续：'
})

function update(key, value) { settingsStore.update(key, value) }

async function sha256(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function loadPasswordHash() {
  try {
    const stored = await window.electronAPI.loadData('password')
    if (stored && stored.hash) { hasPassword.value = true; return stored.hash }
  } catch {}
  hasPassword.value = false
  return null
}

async function savePasswordHash(hash) {
  try { await window.electronAPI.saveData('password', { hash }) } catch {}
  hasPassword.value = true
}

function openPasswordModal() {
  pwModalMode.value = hasPassword.value ? 'change' : 'set'
  pwInput.value = ''
  pwError.value = ''
  showPwModal.value = true
}

async function confirmPassword() {
  pwError.value = ''
  if (pwModalMode.value === 'set') {
    if (!pwInput.value || pwInput.value.length < 1) { pwError.value = lang.value === 'en' ? 'Password required' : '请输入密码'; return }
    const hash = await sha256(pwInput.value)
    await savePasswordHash(hash)
    showPwModal.value = false
    pwInput.value = ''
    if (pendingAction.value) { executePending(); pendingAction.value = null }
    return
  }
  const storedHash = await loadPasswordHash()
  if (!storedHash) { showPwModal.value = false; executePending(); return }
  const inputHash = await sha256(pwInput.value)
  if (inputHash !== storedHash) { pwError.value = lang.value === 'en' ? 'Wrong password' : '密码错误'; return }
  showPwModal.value = false
  pwInput.value = ''
  if (pendingAction.value) { executePending(); pendingAction.value = null }
}

function executePending() {
  const action = pendingAction.value
  if (action === 'export') doExportNow()
  else if (action === 'import') showImportWarning.value = true
  else if (action === 'clearRecords') { recordsStore.clearAll(); alert(lang.value === 'en' ? 'Records cleared' : '抽取记录已清空') }
  else if (action === 'clearAll') doClearAllNow()
}

function requirePassword(action) {
  pendingAction.value = action
  if (!hasPassword.value) { openPasswordModal(); return }
  pwModalMode.value = 'verify'
  pwInput.value = ''; pwError.value = ''
  showPwModal.value = true
}

function doExport() { requirePassword('export') }
function doImport() { requirePassword('import') }
function doClearRecords() { requirePassword('clearRecords') }
function doClearAll() { requirePassword('clearAll') }

async function doExportNow() {
  const result = await window.electronAPI.exportData()
  if (result.success) alert(lang.value === 'en' ? 'Exported successfully' : '导出成功')
}

async function confirmImport() {
  showImportWarning.value = false
  const result = await window.electronAPI.importData()
  if (result.success) alert(lang.value === 'en' ? 'Imported. Please restart.' : '导入成功，请重启应用。')
}

async function doClearAllNow() {
  await window.electronAPI.saveData('lists', {})
  await window.electronAPI.saveData('statistics', { counts: {}, totalCount: 0 })
  await window.electronAPI.saveData('records', [])
  await window.electronAPI.saveData('settings', {})
  alert(lang.value === 'en' ? 'All data cleared. Please restart.' : '所有数据已清除，请重启应用。')
}

async function saveBalance() {
  const normalized = normalizeSettings(balance.value)
  balance.value = normalized
  await window.electronAPI.saveData('balance', normalized)
  renderBalanceCurve()
}

function resetBalance() {
  balance.value = JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS))
  saveBalance()
}

function renderBalanceCurve() {
  const canvas = balanceCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  if (rect.width < 10 || rect.height < 10) return

  const dpr = window.devicePixelRatio || 1
  const w = Math.round(rect.width * dpr)
  const h = Math.round(rect.height * dpr)
  canvas.width = w
  canvas.height = h

  const s = normalizeSettings(balance.value)
  const padL = 56, padR = 18, padT = 18, padB = 38
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  ctx.clearRect(0, 0, w, h)

  const names = namesStore.currentNames
  const poolCount = Math.max(1, names.filter(n => n.cn !== '再来一次').length || 2)
  const theoreticalThreshold = poolCount / Math.max(0.1, s.factor || 1)
  const maxThreshold = Math.max(0, s.maxThreshold)
  const maxBoost = Math.max(200, s.maxBoostPercent)
  const points = s.points.map(p => ({ x: p.x / Math.max(theoreticalThreshold, 1e-6), y: p.y }))
  const xMax = Math.max(1, (maxThreshold > 0 ? maxThreshold / Math.max(theoreticalThreshold, 1e-6) : 0), points[2].x * 1.2, 1.2)
  const yMin = 100, yMax = Math.max(maxBoost, ...points.map(p => p.y), 220)

  function xToPx(x) { return padL + (x / xMax) * plotW }
  function yToPx(y) { return padT + (1 - (y - yMin) / (yMax - yMin)) * plotH }

  ctx.save(); ctx.strokeStyle = '#e9e9e9'; ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) { const gx = padL + (plotW * i / 5); ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke() }
  for (let i = 0; i <= 4; i++) { const gy = padT + (plotH * i / 4); ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke() }
  ctx.restore()

  ctx.save(); ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke()
  ctx.restore()

  if (maxThreshold > 0) {
    const nx = maxThreshold / Math.max(theoreticalThreshold, 1e-6)
    if (Number.isFinite(nx)) { ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#6b7280'; ctx.beginPath(); ctx.moveTo(xToPx(Math.min(nx, xMax)), padT); ctx.lineTo(xToPx(Math.min(nx, xMax)), padT + plotH); ctx.stroke(); ctx.restore() }
  }

  ctx.save(); ctx.strokeStyle = '#111'; ctx.lineWidth = 2.25; ctx.beginPath()
  for (let i = 0; i <= 120; i++) {
    const x = xMax * (i / 120); let y = interpolateQuadratic(points, x)
    if (!Number.isFinite(y)) y = 100; y = Math.max(100, Math.min(y, maxBoost))
    if (i === 0) ctx.moveTo(xToPx(x), yToPx(y)); else ctx.lineTo(xToPx(x), yToPx(y))
  }
  ctx.stroke(); ctx.restore()

  ctx.save(); ctx.fillStyle = '#111'
  points.forEach(p => { const px = xToPx(Math.min(p.x, xMax)); const py = yToPx(Math.max(100, Math.min(p.y, maxBoost))); ctx.beginPath(); ctx.arc(px, py, 4.2, 0, Math.PI * 2); ctx.fill() })
  ctx.restore()

  ctx.save(); ctx.fillStyle = '#222'; ctx.font = `${Math.round(dpr * 12)}px "Wengfaluosi", "HarmonyOS Sans SC", sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(lang.value === 'en' ? 'Deficit' : '差值', padL + plotW / 2, h - 10)
  ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(lang.value === 'en' ? 'Boost (%)' : '倍率(%)', 0, 0); ctx.restore()
  ctx.textAlign = 'left'; ctx.fillText('100%', 8, yToPx(100) + 4); ctx.fillText(`${maxBoost.toFixed(0)}%`, 8, yToPx(maxBoost) + 4)
  ctx.restore()

  const activeState = s.enabled ? (lang.value === 'en' ? 'ON' : '开启') : (lang.value === 'en' ? 'OFF' : '关闭')
  balanceSummary.value = `${activeState} | ${lang.value === 'en' ? 'Candidates' : '候选'}: ${poolCount} | ${lang.value === 'en' ? 'Threshold' : '阈值'}: ${theoreticalThreshold.toFixed(4)} | ${lang.value === 'en' ? 'Max' : '最大'}: ${maxBoost.toFixed(0)}%`
}

onMounted(async () => {
  await loadPasswordHash()
  const saved = await window.electronAPI.loadData('balance')
  if (saved) balance.value = normalizeSettings(saved)
  const logs = await window.electronAPI.loadChangelog()
  changelog.value = logs || []
  await nextTick()
  setTimeout(() => { renderBalanceCurve() }, 100)
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
.curve-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-default); }
.curve-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.points-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; align-items: center; margin-bottom: 16px; }
.point-label { font-size: 13px; color: var(--text-secondary); }
.preview-wrap { border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 16px; background: var(--bg-card-solid); margin-bottom: 12px; }
.balance-canvas { width: 100%; height: 280px; display: block; border-radius: var(--radius-sm); }
.preview-summary { margin-top: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; word-break: break-all; }
.curve-actions { display: flex; gap: 8px; flex-wrap: wrap; }
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
</style>
