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
        <FluentSelect :model-value="settings.language" :options="langOptions" width="200px" @update:model-value="update('language', $event)" />
      </div>
      <div class="setting-row">
        <div class="setting-label-group">
          <span class="setting-label">{{ t('startupSplash', lang) }}</span>
        </div>
        <FluentToggle
          :model-value="!settings.disableSplash"
          @update:model-value="update('disableSplash', !$event)"
        />
      </div>
      <div v-if="isDesktop" class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Update download source' : '更新下载源' }}</span>
        <FluentSelect :model-value="settings.downloadSource" :options="downloadSourceOptions" width="220px" @update:model-value="update('downloadSource', $event)" />
      </div>
      <div v-if="isDesktop" class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Floating Window' : '悬浮窗快捷点名' }}</span>
        <FluentToggle :model-value="settings.floatingWindowEnabled" @update:model-value="onFloatingWindowToggle" />
      </div>
      <Transition name="toggle-expand">
        <div v-if="isDesktop && settings.floatingWindowEnabled" class="sub-setting floating-window-settings">
          <div class="floating-style-setting">
            <span class="setting-label">{{ lang === 'en' ? 'Floating window style' : '悬浮窗样式' }}</span>
            <div class="floating-style-options" role="radiogroup" :aria-label="lang === 'en' ? 'Floating window style' : '悬浮窗样式'">
              <label
                v-for="option in floatingStyleOptions"
                :key="option.value"
                :class="['floating-style-option', { selected: settings.floatingWindowStyle === option.value }]"
              >
                <input
                  class="floating-style-radio"
                  type="radio"
                  name="floating-window-style"
                  :value="option.value"
                  :checked="settings.floatingWindowStyle === option.value"
                  @change="onFloatingWindowStyleChange(option.value)"
                />
                <span :class="['floating-style-preview', { 'text-preview': option.value === 'text' }]">
                  <span v-if="option.value === 'text'">点名</span>
                  <img v-else :src="floatingWindowImagePath(option.value)" alt="" />
                </span>
                <span class="floating-style-label">{{ option.label }}</span>
              </label>
            </div>
          </div>
          <div class="setting-row floating-size-row">
            <div class="setting-label-group">
              <span class="setting-label">{{ lang === 'en' ? 'Floating window size' : '悬浮窗大小' }}</span>
              <span class="setting-desc">{{ floatingSizeDraft }} px</span>
            </div>
            <input
              class="floating-size-range"
              type="range"
              min="40"
              max="256"
              step="4"
              :value="floatingSizeDraft"
              :aria-label="lang === 'en' ? 'Floating window size' : '悬浮窗大小'"
              @input="onFloatingWindowSizeInput"
              @change="onFloatingWindowSizeChange"
            />
          </div>
          <div class="setting-row floating-reset-row">
            <span class="setting-label">{{ lang === 'en' ? 'Floating window position' : '悬浮窗位置' }}</span>
            <FluentButton variant="secondary" size="sm" @click="resetFloatingWindowPosition">
              <FluentIcon icon="arrow-reset-20-regular" :width="16" />
              {{ lang === 'en' ? 'Reset position' : '重置位置' }}
            </FluentButton>
          </div>
        </div>
      </Transition>
      <div v-if="isDesktop" class="setting-row"><span class="setting-label">{{ lang === 'en' ? 'Launch at sign-in (administrator task)' : '开机自启动（管理员计划任务）' }}</span><FluentToggle :model-value="settings.autoStart" :disabled="autoStartBusy" @update:model-value="onAutoStart" /></div>
      <Transition name="toggle-expand">
        <div v-if="isDesktop && settings.autoStart" class="sub-setting"><div class="setting-row"><span class="setting-label">{{ lang === 'en' ? 'Start hidden in tray' : '启动到托盘' }}</span><FluentToggle :model-value="settings.autoStartToTray" @update:model-value="update('autoStartToTray', $event)" /></div></div>
      </Transition>
      <div v-if="isDesktop" class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Check for Updates' : '检查更新' }}</span>
        <div class="update-actions">
          <FluentButton variant="secondary" size="sm" :disabled="updateState.checking || updateState.downloading" @click="doForceUpdate">
            <FluentIcon icon="arrow-download-16-regular" :width="14" />
            {{ lang === 'en' ? 'Force Update' : '强制更新' }}
          </FluentButton>
          <FluentButton variant="primary" size="sm" :disabled="updateState.checking || updateState.downloading" @click="doCheckUpdate">
            <FluentIcon icon="search-16-regular" :width="14" />
            {{ updateState.checking ? (lang === 'en' ? 'Checking...' : '检查中...') : (lang === 'en' ? 'Check' : '检查') }}
          </FluentButton>
        </div>
      </div>
      <div v-if="isDesktop && updateState.available" class="update-info">
        <div class="update-info-content">
          <FluentIcon icon="arrow-download-16-regular" :width="16" />
          <div class="update-text">
            <span class="update-version">{{ lang === 'en' ? 'New version available' : '发现新版本' }}</span>
            <span class="update-version-num">{{ updateState.version }}{{ updateState.fileSize ? ` (${(updateState.fileSize / 1024 / 1024).toFixed(1)} MB)` : '' }}</span>
          </div>
        </div>
        <FluentButton variant="primary" size="sm" :disabled="updateState.downloading" @click="downloadUpdate(showBanner)">
          <FluentIcon icon="arrow-download-16-regular" :width="14" />
          {{ updateState.downloading ? (lang === 'en' ? 'Downloading...' : '下载中...') : (lang === 'en' ? 'Download' : '下载') }}
        </FluentButton>
      </div>

    </FluentCard>

    <!-- 主题与显示 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="color-24-regular" :width="20" /> {{ lang === 'en' ? 'Theme & Display' : '主题与显示' }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Dark Mode' : '深色模式' }}</span>
        <FluentToggle :model-value="settingsStore.darkMode" @update:model-value="settingsStore.toggleDarkMode()" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Color theme' : '主题色' }}</span>
        <FluentSelect :model-value="settings.colorTheme" :options="colorThemeOptions" width="220px" @update:model-value="update('colorTheme', $event)" />
      </div>
      <div v-if="settings.colorTheme === 'custom'" class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Custom color' : '自定义颜色' }}</span>
        <div class="color-picker-row">
          <input class="color-input" type="color" :value="settings.customThemeColor" @input="onCustomColorPicker" />
          <FluentInput v-model="customColorDraft" class="hex-color-input" placeholder="#0078d4 / rgb(0,120,212)" @enter="commitCustomColor" @blur="commitCustomColor" />
        </div>
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('nameColorMode', lang) }}</span>
        <FluentSelect :model-value="settings.nameColorMode" :options="colorModeOptions" width="200px" @update:model-value="update('nameColorMode', $event)" />
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
        <div class="setting-label-group">
          <span class="setting-label">{{ t('uiScale', lang) }}</span>
          <span class="scale-range">{{ lang === 'en' ? 'Range 50–200%' : '范围 50%-200%' }}</span>
        </div>
        <div class="scale-control">
          <div class="scale-input-wrap">
            <input
              type="number"
              class="scale-input"
              min="50"
              max="200"
              step="1"
              v-model.number="scaleDraft"
            />
            <span class="scale-unit">%</span>
          </div>
          <Transition name="scale-btn">
            <FluentButton v-if="scaleChanged" variant="secondary" size="sm" @click="confirmScale">{{ lang === 'en' ? 'Apply' : '确认' }}</FluentButton>
          </Transition>
        </div>
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ t('fontSize', lang) }}</span>
        <FluentSelect :model-value="settings.nameFontSize" :options="fontSizeOptions" width="200px" @update:model-value="update('nameFontSize', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Font' : '字体' }}</span>
        <FluentSelect :model-value="settings.fontFamily" :options="fontOptions" width="200px" @update:model-value="update('fontFamily', $event)" />
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
      <div class="performance-note">
        <FluentIcon icon="info-16-regular" :width="14" />
        <span>{{ lang === 'en' ? 'Disable options to improve performance on integrated GPUs.' : '关闭选项可提升核显设备性能。' }}</span>
      </div>
    </FluentCard>

    <!-- 数据管理 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="database-24-regular" :width="20" /> {{ lang === 'en' ? 'Data' : '数据管理' }}</h3>
      <div class="setting-row">
        <div class="setting-label-group">
          <span class="setting-label">{{ lang === 'en' ? 'Enable Statistics' : '启用数据统计' }}</span>
          <span class="setting-desc">{{ balance.enabled
            ? (lang === 'en' ? 'Required by the fairness algorithm.' : '公平算法需要持续记录统计数据。')
            : (lang === 'en' ? 'When off, no selection counts are recorded.' : '关闭后不记录中签次数。') }}</span>
        </div>
          <FluentToggle :model-value="settings.recordCounts" :disabled="balance.enabled" @update:model-value="update('recordCounts', $event)" />
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

    <!-- 抽取设置 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="play-24-regular" :width="18" /> {{ t('drawSettings', lang) }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Auto stop' : '自动停止' }}</span>
        <FluentToggle :model-value="settings.autoStop" @update:model-value="update('autoStop', $event)" />
      </div>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Result emphasis' : '结果强调动画' }}</span>
        <FluentSelect :model-value="settings.finishAnimation" :options="finishAnimationOptions" width="220px" @update:model-value="update('finishAnimation', $event)" />
      </div>
      <div class="setting-row">
        <div class="setting-label-group">
          <span class="setting-label">{{ t('multiStepStop', lang) }}</span>
        </div>
        <FluentToggle :model-value="settings.multiStepStop" @update:model-value="update('multiStepStop', $event)" />
      </div>
      <Transition name="toggle-expand">
        <div v-if="settings.multiStepStop" class="sub-setting">
          <div class="setting-row">
            <span class="setting-label">{{ t('stepStopInterval', lang) }}</span>
            <div class="scale-control">
              <div class="scale-input-wrap" style="width:140px">
                <input type="number" class="scale-input" min="0.01" max="1.00" step="0.01" v-model.number="stepIntervalDraft" />
                <span class="scale-unit">sec</span>
              </div>
              <FluentButton variant="secondary" size="sm" @click="confirmStepInterval">{{ lang === 'en' ? 'Apply' : '确认' }}</FluentButton>
            </div>
          </div>
        </div>
      </Transition>
    </FluentCard>

    <!-- 平衡算法 -->
    <FluentCard class="settings-section">
      <h3 class="section-title"><FluentIcon icon="data-line-24-regular" :width="20" /> {{ t('balanceSettings', lang) }}</h3>
      <div class="setting-row">
        <span class="setting-label">{{ lang === 'en' ? 'Enable Balance' : '启用平衡算法' }}</span>
          <FluentToggle :model-value="balance.enabled" @update:model-value="onBalanceEnabledChange" />
      </div>
      <Transition name="toggle-expand">
        <div v-if="balance.enabled" class="balance-sub">
          <p class="balance-explain">{{ lang === 'en' ? 'The fairness target is fixed at an absolute gap of 2. Every candidate keeps a non-zero probability, so 2 is a strong soft target rather than an impossible hard guarantee.' : '公平算法固定以绝对极差 2 为软目标。每个人始终保留非零概率，因此会强力趋近 2，但不会作不可能的硬性保证。' }}</p>
          <div class="balance-info">
            <FluentIcon icon="info-16-regular" :width="14" />
            <span>{{ lang === 'en' ? `Algorithm: ${ALGORITHM_NAME} v${ALGORITHM_VERSION} · Parameters are protected` : `算法: ${ALGORITHM_NAME} v${ALGORITHM_VERSION} · 公平参数不可修改` }}</span>
          </div>
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, inject } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useRecordsStore } from '../stores/records'
import { useStatisticsStore } from '../stores/statistics'
import { dataBridge } from '../utils/dataBridge'
import { isTauri, tauriAPI } from '../utils/tauriAPI'
import { updateState, checkForUpdates, downloadUpdate } from '../utils/updater'
import { t } from '../utils/i18n'
import {
  DEFAULT_CYRENE_BALANCE_SETTINGS,
  normalizeCyreneBalanceSettings,
  ALGORITHM_NAME,
  ALGORITHM_VERSION
} from '../utils/cyrene-balance'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentInput from '../components/FluentInput.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentModal from '../components/FluentModal.vue'
import { normalizeHex } from '../utils/theme'
import { FLOATING_WINDOW_STYLES, floatingWindowImagePath, normalizeFloatingWindowStyle } from '../utils/floatingWindowStyle'
import { normalizeFloatingWindowSize } from '../utils/floatingWindowSize'

const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const recordsStore = useRecordsStore()
const statisticsStore = useStatisticsStore()
const showBanner = inject('banner')

const lang = computed(() => settingsStore.settings.language)
const settings = computed(() => settingsStore.settings)

const isDesktop = computed(() => isTauri())
const floatingStyleOptions = computed(() => FLOATING_WINDOW_STYLES.map((value, index) => ({
  value,
  label: value === 'text'
    ? (lang.value === 'en' ? 'Text' : '文字')
    : (lang.value === 'en' ? `Image ${index}` : `图片 ${index}`)
})))
const floatingSizeDraft = ref(normalizeFloatingWindowSize(settings.value.floatingWindowSize))
watch(() => settings.value.floatingWindowSize, value => {
  floatingSizeDraft.value = normalizeFloatingWindowSize(value)
})

const langOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
]
const scaleDraft = ref(settings.value.uiScale)
watch(() => settings.value.uiScale, (v) => { scaleDraft.value = v })
const scaleChanged = computed(() => {
  const v = Math.round(Number(scaleDraft.value))
  if (!Number.isFinite(v)) return false
  return v !== Math.round(settings.value.uiScale)
})
function confirmScale() {
  let v = Math.round(Number(scaleDraft.value))
  if (!Number.isFinite(v)) v = settings.value.uiScale
  v = Math.min(200, Math.max(50, v))
  scaleDraft.value = v
  update('uiScale', v)
}
const fontSizeOptions = [
  { value: 0.75, label: '0.75x' }, { value: 1.0, label: '1.0x' }, { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' }, { value: 1.75, label: '1.75x' }, { value: 2.0, label: '2.0x' }
]

const colorModeOptions = [
  { value: 'gradient', label: lang.value === 'en' ? 'Gradient' : '渐变' },
  { value: 'custom', label: lang.value === 'en' ? 'Custom Solid' : '自定义单色' }
]

const fontOptions = [
  { value: 'HarmonyOS', label: 'HarmonyOS Sans SC' },
  { value: 'MiSans', label: 'Mi Sans' }
]
const colorThemeOptions = computed(() => [
  { value: 'peach', label: lang.value === 'en' ? 'Peach' : '桃粉', icon: 'fluent:heart-16-regular' },
  { value: 'fluent', label: 'Fluent', icon: 'fluent:window-16-regular' },
  { value: 'custom', label: lang.value === 'en' ? 'Custom' : '自定义', icon: 'fluent:color-16-regular' }
])
const downloadSourceOptions = computed(() => [
  { value: 'cyrene', label: 'gh.昔涟.cn', icon: 'fluent:cloud-arrow-down-16-regular' },
  { value: 'github', label: 'GitHub', icon: 'fluent:code-16-regular' },
  { value: 'ghproxy', label: 'gh-proxy.com', icon: 'fluent:globe-16-regular' }
])
const finishAnimationOptions = computed(() => [
  { value: 'spotlight', label: lang.value === 'en' ? 'Classic emphasis' : '经典强调', icon: 'fluent:sparkle-16-regular' },
  { value: 'lift', label: lang.value === 'en' ? 'Lift' : '跃升', icon: 'fluent:arrow-up-16-regular' },
  { value: 'glow', label: lang.value === 'en' ? 'Glow' : '辉光', icon: 'fluent:weather-sunny-16-regular' }
])

const balance = ref({ ...DEFAULT_CYRENE_BALANCE_SETTINGS })
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

function update(key, value) { return settingsStore.update(key, value) }
const customColorDraft = ref(settings.value.customThemeColor)
const autoStartBusy = ref(false)
watch(() => settings.value.customThemeColor, value => { customColorDraft.value = value })
function commitCustomColor() {
  const normalized = normalizeHex(customColorDraft.value, '')
  if (!normalized) {
    customColorDraft.value = settings.value.customThemeColor
    return
  }
  customColorDraft.value = normalized
  update('customThemeColor', normalized)
}
function onCustomColorPicker(event) {
  customColorDraft.value = event.target.value
  commitCustomColor()
}
async function onAutoStart(value) {
  autoStartBusy.value = true
  await update('autoStart', value)
  showBanner({
    message: value
      ? (lang.value === 'en' ? 'Administrator permission is required. The app will restart.' : '需要管理员权限创建计划任务，应用即将重启。')
      : (lang.value === 'en' ? 'Removing the startup task...' : '正在移除开机启动计划任务...'),
    icon: 'shield-keyhole-16-regular', type: 'info', duration: 5000
  })
  const result = await tauriAPI.setAutoStart(value)
  if (!result || result.success === false) {
    await update('autoStart', !value)
    showBanner({ message: result.error || (lang.value === 'en' ? 'Startup task update failed' : '计划任务更新失败'), icon: 'warning-16-regular', type: 'warning', duration: 8000 })
  }
  autoStartBusy.value = false
}

async function onFloatingWindowToggle(val) {
  await update('floatingWindowEnabled', val)
  if (isTauri()) {
    await tauriAPI.invoke(val ? 'open_floating_window' : 'close_floating_window')
  }
}

async function onFloatingWindowStyleChange(value) {
  const style = normalizeFloatingWindowStyle(value)
  await update('floatingWindowStyle', style)
  if (isTauri()) {
    await tauriAPI.setFloatingWindowStyle(style)
  }
}

let floatingSizeTimer = null
let floatingSizePending = null
let floatingSizeRunning = false
let floatingSizeWaiters = []

function sendFloatingWindowSize(size) {
  floatingSizePending = size
  const completion = new Promise(resolve => { floatingSizeWaiters.push(resolve) })
  if (!floatingSizeRunning) processFloatingWindowSizeQueue()
  return completion
}

async function processFloatingWindowSizeQueue() {
  floatingSizeRunning = true
  let result = { success: true }
  while (floatingSizePending !== null) {
    const size = floatingSizePending
    floatingSizePending = null
    result = await tauriAPI.setFloatingWindowSize(size)
    if (result?.success === false) {
      showBanner({
        message: result.error || (lang.value === 'en' ? 'Failed to resize floating window' : '调整悬浮窗大小失败'),
        icon: 'warning-16-regular', type: 'warning', duration: 6000
      })
    }
  }
  floatingSizeRunning = false
  const waiters = floatingSizeWaiters
  floatingSizeWaiters = []
  waiters.forEach(resolve => resolve(result))
}

onBeforeUnmount(() => {
  clearTimeout(floatingSizeTimer)
  floatingSizePending = null
  const waiters = floatingSizeWaiters
  floatingSizeWaiters = []
  waiters.forEach(resolve => resolve({ success: false, cancelled: true }))
})

function onFloatingWindowSizeInput(event) {
  const size = normalizeFloatingWindowSize(event.target.value)
  floatingSizeDraft.value = size
  clearTimeout(floatingSizeTimer)
  floatingSizeTimer = setTimeout(() => { sendFloatingWindowSize(size) }, 60)
}

async function onFloatingWindowSizeChange(event) {
  const size = normalizeFloatingWindowSize(event.target.value)
  floatingSizeDraft.value = size
  clearTimeout(floatingSizeTimer)
  await update('floatingWindowSize', size)
  await sendFloatingWindowSize(size)
}

async function resetFloatingWindowPosition() {
  const result = await tauriAPI.resetFloatingWindowPosition()
  if (result?.success) {
    showBanner({
      message: lang.value === 'en' ? 'Floating window position reset' : '悬浮窗位置已重置',
      icon: 'checkmark-circle-16-regular', type: 'success', duration: 4000
    })
    return
  }
  showBanner({
    message: result?.error || (lang.value === 'en' ? 'Failed to reset floating window position' : '重置悬浮窗位置失败'),
    icon: 'warning-16-regular', type: 'warning', duration: 8000
  })
}

const stepIntervalDraft = ref(settings.value.stepStopInterval)
watch(() => settings.value.stepStopInterval, v => { stepIntervalDraft.value = v })
function confirmStepInterval() {
  let v = Number(stepIntervalDraft.value)
  if (!Number.isFinite(v)) v = 0.15
  v = Math.min(1.0, Math.max(0.01, Math.round(v * 100) / 100))
  stepIntervalDraft.value = v
  update('stepStopInterval', v)
}

function doCheckUpdate() { checkForUpdates(false, showBanner) }

async function doForceUpdate() {
  updateState.value.checking = true
  updateState.value.error = null
  try {
    const { fetchRelease, findPlatformAsset } = await import('../utils/updater')
    const release = await fetchRelease()
    if (release) {
      const assets = release.assets || []
      const targetAsset = findPlatformAsset(assets)
      updateState.value = {
        available: true, checking: false, downloading: false, downloadProgress: 0,
        version: release.tag_name,
        url: targetAsset ? targetAsset.browser_download_url : release.html_url,
        fileName: targetAsset ? targetAsset.name : '',
        fileSize: targetAsset ? targetAsset.size : 0,
        body: release.body || '', error: null
      }
      const sizeMB = targetAsset ? (targetAsset.size / 1024 / 1024).toFixed(1) : ''
      const sizeText = sizeMB ? ` (${sizeMB} MB)` : ''
      showBanner({ message: `发现新版本 ${release.tag_name}${sizeText}`, icon: 'arrow-download-16-regular', type: 'info', duration: 0, dismissible: true })
    } else {
      updateState.value.checking = false
      showBanner({ message: '无法连接到更新服务器', icon: 'warning-16-regular', type: 'warning', duration: 3000 })
    }
  } catch {
    updateState.value.checking = false
    showBanner({ message: '无法连接到更新服务器', icon: 'warning-16-regular', type: 'warning', duration: 3000 })
  }
}

function getLogEntries(log) {
  if (!log.logs) return []
  if (Array.isArray(log.logs)) return log.logs
  return log.logs[lang.value] || log.logs.zh || []
}

onMounted(async () => {
  await loadPasswordHash()
  const saved = await dataBridge.load('balance')
  balance.value = normalizeCyreneBalanceSettings(saved)
  if (balance.value.enabled && !settings.value.recordCounts) settingsStore.update('recordCounts', true)
  if (saved && JSON.stringify(saved) !== JSON.stringify(balance.value)) {
    await dataBridge.save('balance', balance.value)
  }
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
async function doExportNow() {
  const result = await dataBridge.exportData()
  if (result?.success) showBanner({ message: lang.value === 'en' ? 'Data exported' : '程序数据导出成功', icon: 'checkmark-circle-16-regular', type: 'success', duration: 5000 })
  else if (!result?.cancelled) showBanner({ message: `${lang.value === 'en' ? 'Export failed' : '导出失败'}：${result?.error || (lang.value === 'en' ? 'Unknown error' : '未知错误')}`, icon: 'warning-16-regular', type: 'warning', duration: 8000 })
}
async function confirmImport() {
  showImportWarning.value = false
  const result = await dataBridge.importData()
  if (result.success) {
    showBanner({ message: lang.value === 'en' ? 'Import successful. Restart the app to apply it.' : '导入成功，重启应用后生效。', icon: 'checkmark-circle-16-regular', type: 'success', duration: 10000, dismissible: true })
  } else if (!result.cancelled) {
    showBanner({ message: lang.value === 'en' ? 'Import failed: ' + (result.error || 'Unknown') : '导入失败：' + (result.error || '未知错误'), icon: 'warning-16-regular', type: 'warning', duration: 8000 })
  }
}
async function doClearAllNow() {
  await dataBridge.clearAll()
  alert(lang.value === 'en' ? 'All data cleared. Please close and restart.' : '所有数据已清除，请关闭并重启应用。')
}
async function saveBalance() {
  balance.value = normalizeCyreneBalanceSettings(balance.value)
  await dataBridge.save('balance', balance.value)
}
function onBalanceEnabledChange(enabled) {
  balance.value.enabled = enabled
  if (enabled) settingsStore.update('recordCounts', true)
  saveBalance()
}
</script>

<style scoped>
.settings-view { padding: 32px; }
.page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
.settings-section { margin-bottom: 16px; }
.section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; gap: 16px; }
.setting-label { font-size: 14px; color: var(--text-secondary); }
.hex-color-input { width: 220px; }
.readonly-id { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.setting-label-group { display: flex; flex-direction: column; gap: 2px; }
.setting-desc { font-size: 12px; color: var(--text-muted); }
.balance-sub { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 10px; }
.balance-explain { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.balance-info { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); padding: 8px 12px; background: var(--bg-subtle); border-radius: var(--radius-sm); }
.sub-setting { padding-left: 16px; border-left: 2px solid var(--accent-200); margin-left: 0; }
.floating-window-settings { display: flex; flex-direction: column; gap: 12px; margin: 4px 0 8px; }
.floating-style-setting { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
.floating-style-options { display: flex; flex-wrap: wrap; gap: 10px; }
.floating-style-option {
  width: 82px; min-height: 88px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px;
  border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: var(--bg-subtle);
  color: var(--text-secondary); cursor: pointer; transition: border-color var(--duration-fast), background var(--duration-fast);
}
.floating-style-option:hover { border-color: var(--border-strong); }
.floating-style-option.selected { border-color: var(--accent); background: var(--accent-50); color: var(--text-primary); }
.floating-style-option:has(.floating-style-radio:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
.floating-style-radio { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.floating-style-preview { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.floating-style-preview.text-preview { border-radius: 50%; background: var(--accent); color: #fff; font-size: 12px; font-weight: 600; }
.floating-style-preview img { width: 100%; height: 100%; display: block; object-fit: cover; }
.floating-style-label { max-width: 100%; font-size: 12px; line-height: 1.25; text-align: center; overflow-wrap: anywhere; }
.floating-reset-row { padding: 4px 0; }
.floating-size-row { align-items: center; }
.floating-size-range { width: min(240px, 48%); accent-color: var(--accent); cursor: pointer; }
.color-picker-row { display: flex; align-items: center; gap: 10px; }
.color-input { width: 40px; height: 32px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); cursor: pointer; padding: 2px; background: transparent; }
.scale-control { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.scale-input-wrap {
  display: flex; align-items: center; gap: 2px;
  width: 200px; height: 32px; padding: 0 10px;
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
  background: var(--bg-input, rgba(255, 255, 255, 0.06));
  transition: border-color .15s;
}
.scale-input-wrap:focus-within { border-color: var(--accent-500); }
.scale-input {
  flex: 1; width: 100%; min-width: 0; border: none; background: transparent;
  color: var(--text-primary); font-size: 14px; font-family: var(--font-ui);
  font-variant-numeric: tabular-nums; outline: none;
}
/* 隐藏数字输入框的上下微调箭头 */
.scale-input::-webkit-outer-spin-button,
.scale-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.scale-input { -moz-appearance: textfield; }
.scale-unit { color: var(--text-muted); font-size: 14px; }
.scale-range { font-size: 12px; color: var(--text-muted); }
.scale-btn-enter-active, .scale-btn-leave-active {
  overflow: hidden;
  transition: opacity .22s ease, transform .22s cubic-bezier(0.1, 0.9, 0.2, 1), max-width .25s ease;
}
.scale-btn-enter-from, .scale-btn-leave-to {
  opacity: 0;
  transform: translateX(-8px);
  max-width: 0;
}
.scale-btn-enter-to, .scale-btn-leave-from {
  opacity: 1;
  max-width: 120px;
}
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

.update-actions {
  display: flex;
  gap: 8px;
}

.update-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 8px 0;
  background: var(--accent-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-100);
}

.dark .update-info {
  background: rgba(234, 94, 193, 0.1);
  border-color: rgba(234, 94, 193, 0.2);
}

.update-info-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--accent);
}

.update-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.update-version {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.update-version-num {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-num);
}

.setting-note {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
  padding: 0 4px;
}

.update-success {
  color: #0f7b0f;
}

.performance-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-muted);
}

.performance-note svg {
  flex-shrink: 0;
  color: var(--text-muted);
}

.download-progress {
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
}
</style>
