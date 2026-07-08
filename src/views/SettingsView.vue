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
          <span class="speed-value">{{ settings.animSpeed }}x</span>
        </div>
      </div>
      <p class="setting-note">{{ t('perfNote', lang) }}</p>
    </FluentCard>

    <!-- 数据管理 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="database-24-regular" :width="20" /> {{ t('dataManagement', lang) }}</h3>
      <div class="action-row">
        <FluentButton variant="secondary" @click="exportData"><FluentIcon icon="arrow-download-16-regular" :width="14" /> {{ lang === 'en' ? 'Export' : '导出数据' }}</FluentButton>
        <FluentButton variant="secondary" @click="importData"><FluentIcon icon="arrow-upload-16-regular" :width="14" /> {{ lang === 'en' ? 'Import' : '导入数据' }}</FluentButton>
        <FluentButton variant="secondary" @click="clearRecords"><FluentIcon icon="delete-16-regular" :width="14" /> {{ lang === 'en' ? 'Clear Records' : '清空抽取记录' }}</FluentButton>
      </div>
      <div class="setting-row" style="margin-top: 12px;">
        <span class="setting-label">{{ lang === 'en' ? 'Data Password' : '数据操作密码' }}</span>
        <div class="password-group">
          <FluentButton v-if="!hasPassword" variant="secondary" size="sm" @click="showPasswordModal = true">
            <FluentIcon icon="lock-closed-16-regular" :width="14" /> {{ lang === 'en' ? 'Set Password' : '设置密码' }}
          </FluentButton>
          <FluentButton v-else variant="secondary" size="sm" @click="showPasswordModal = true">
            <FluentIcon icon="lock-closed-16-regular" :width="14" /> {{ lang === 'en' ? 'Change Password' : '修改密码' }}
          </FluentButton>
        </div>
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

    <!-- 密码验证弹窗 -->
    <FluentModal v-model="showPasswordModal" :title="lang === 'en' ? 'Password Verification' : '密码验证'" max-width="400px">
      <div class="password-modal-body">
        <p v-if="pendingAction === 'set'" class="pw-hint">{{ lang === 'en' ? 'Set a password to protect data operations:' : '设置密码以保护数据操作：' }}</p>
        <p v-else class="pw-hint">{{ lang === 'en' ? 'Enter password to continue:' : '请输入密码以继续：' }}</p>
        <FluentInput ref="pwInputRef" v-model="passwordInput" type="password" :placeholder="lang === 'en' ? 'Password' : '密码'" @enter="handlePasswordConfirm" />
        <p v-if="passwordError" class="pw-error">{{ passwordError }}</p>
      </div>
      <template #footer>
        <FluentButton variant="secondary" size="sm" @click="showPasswordModal = false">{{ lang === 'en' ? 'Cancel' : '取消' }}</FluentButton>
        <FluentButton variant="primary" size="sm" @click="handlePasswordConfirm">{{ lang === 'en' ? 'Confirm' : '确认' }}</FluentButton>
      </template>
    </FluentModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useRecordsStore } from '../stores/records'
import { t } from '../utils/i18n'
import { DEFAULT_BALANCE_SETTINGS, normalizeSettings, interpolateQuadratic } from '../utils/balance'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentInput from '../components/FluentInput.vue'
import FluentModal from '../components/FluentModal.vue'

const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const recordsStore = useRecordsStore()

const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
const settings = computed(() => settingsStore.settings)

const balance = ref(JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS)))
const changelog = ref([])
const balanceCanvasRef = ref(null)
const balanceSummary = ref('')

const hasPassword = ref(false)
const showPasswordModal = ref(false)
const passwordInput = ref('')
const passwordError = ref('')
const pendingAction = ref(null)

async function sha256(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function checkPassword() {
  const stored = await window.electronAPI.loadData('password')
  if (!stored || !stored.hash) { hasPassword.value = false; return false }
  hasPassword.value = true
  return stored.hash
}

async function handlePasswordConfirm() {
  passwordError.value = ''
  const storedHash = await window.electronAPI.loadData('password')

  if (pendingAction.value === 'set') {
    if (!passwordInput.value || passwordInput.value.length < 1) {
      passwordError.value = lang.value === 'en' ? 'Password required' : '请输入密码'
      return
    }
    const hash = await sha256(passwordInput.value)
    await window.electronAPI.saveData('password', { hash })
    hasPassword.value = true
    showPasswordModal.value = false
    passwordInput.value = ''
    return
  }

  if (!storedHash || !storedHash.hash) {
    showPasswordModal.value = false
    executePendingAction()
    return
  }

  const inputHash = await sha256(passwordInput.value)
  if (inputHash !== storedHash.hash) {
    passwordError.value = lang.value === 'en' ? 'Wrong password' : '密码错误'
    return
  }

  showPasswordModal.value = false
  passwordInput.value = ''
  executePendingAction()
}

function executePendingAction() {
  if (pendingAction.value === 'clearRecords') recordsStore.clearAll()
  if (pendingAction.value === 'clearAllData') { /* future */ }
  pendingAction.value = null
}

function requestAction(action) {
  pendingAction.value = action
  passwordInput.value = ''
  passwordError.value = ''
  if (!hasPassword.value) {
    showPasswordModal.value = true
    pendingAction.value = 'set'
  } else {
    showPasswordModal.value = true
  }
}

function update(key, value) { settingsStore.update(key, value) }

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

async function exportData() {
  const result = await window.electronAPI.exportData()
  if (result.success) alert(lang.value === 'en' ? 'Exported successfully' : '导出成功')
}

async function importData() {
  const result = await window.electronAPI.importData()
  if (result.success) alert(lang.value === 'en' ? 'Imported successfully. Please restart.' : '导入成功，请重启应用。')
}

function clearRecords() {
  if (!hasPassword.value) {
    pendingAction.value = 'set'
    showPasswordModal.value = true
    return
  }
  pendingAction.value = 'clearRecords'
  showPasswordModal.value = true
}

function setCanvasSize(canvas) {
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const width = Math.max(320, Math.round(rect.width * dpr))
  const height = Math.max(200, Math.round(rect.height * dpr))
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  return { width, height }
}

function renderBalanceCurve() {
  const canvas = balanceCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const s = normalizeSettings(balance.value)
  const { width, height } = setCanvasSize(canvas)
  const padL = 56, padR = 18, padT = 18, padB = 38
  const plotW = width - padL - padR
  const plotH = height - padT - padB
  ctx.clearRect(0, 0, width, height)

  const names = namesStore.currentNames
  const poolCount = Math.max(1, names.filter(n => n.cn !== '再来一次').length || 2)
  const theoreticalThreshold = poolCount / Math.max(0.1, s.factor || 1)
  const maxThreshold = Math.max(0, s.maxThreshold)
  const maxBoost = Math.max(200, s.maxBoostPercent)
  const points = s.points.map(p => ({ x: p.x / Math.max(theoreticalThreshold, 1e-6), y: p.y }))
  const xMax = Math.max(1, (maxThreshold > 0 ? maxThreshold / Math.max(theoreticalThreshold, 1e-6) : 0), points[2].x * 1.2, 1.2)
  const yMin = 100
  const yMax = Math.max(maxBoost, ...points.map(p => p.y), 220)

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
    if (Number.isFinite(nx)) {
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#6b7280'
      ctx.beginPath(); ctx.moveTo(xToPx(Math.min(nx, xMax)), padT); ctx.lineTo(xToPx(Math.min(nx, xMax)), padT + plotH); ctx.stroke()
      ctx.restore()
    }
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

  ctx.save(); ctx.fillStyle = '#222'; ctx.font = `${Math.round((window.devicePixelRatio || 1) * 12)}px sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(lang.value === 'en' ? 'Deficit' : '差值', padL + plotW / 2, height - 10)
  ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(lang.value === 'en' ? 'Boost (%)' : '倍率(%)', 0, 0); ctx.restore()
  ctx.textAlign = 'left'; ctx.fillText('100%', 8, yToPx(100) + 4); ctx.fillText(`${maxBoost.toFixed(0)}%`, 8, yToPx(maxBoost) + 4)
  ctx.restore()

  const activeState = s.enabled ? (lang.value === 'en' ? 'ON' : '开启') : (lang.value === 'en' ? 'OFF' : '关闭')
  balanceSummary.value = `${activeState} | ${lang.value === 'en' ? 'Candidates' : '候选'}: ${poolCount} | ${lang.value === 'en' ? 'Threshold' : '阈值'}: ${theoreticalThreshold.toFixed(4)} | ${lang.value === 'en' ? 'Max' : '最大'}: ${maxBoost.toFixed(0)}%`
}

onMounted(async () => {
  await checkPassword()
  const saved = await window.electronAPI.loadData('balance')
  if (saved) balance.value = normalizeSettings(saved)
  const logs = await window.electronAPI.loadChangelog()
  changelog.value = logs || []
  await nextTick()
  requestAnimationFrame(() => { renderBalanceCurve() })
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
.password-group { display: flex; gap: 8px; }
.pw-hint { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }
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
