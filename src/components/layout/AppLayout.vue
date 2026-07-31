<template>
  <div class="app-layout" :class="[settingsStore.settings.colorTheme || 'peach', { dark: settingsStore.darkMode, 'perf-no-blur': !settingsStore.settings.perfBlur, 'perf-no-shadow': !settingsStore.settings.perfShadows, 'perf-no-anim': !settingsStore.settings.perfAnimations }]" :style="themeStyle" @contextmenu.prevent>
    <TitleBar />
    <div class="app-body">
      <NavigationDock />
      <main class="app-content">
        <router-view v-slot="{ Component, route }">
          <Transition :name="transitionName" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </router-view>
      </main>
    </div>
    <FullscreenToggle />
    <div class="version-badge">
      <span class="v-prefix">{{ APP_VERSION_PREFIX }}</span><span class="v-num">{{ APP_VERSION }}</span>
      <span class="v-sep">build:</span><span class="v-num">{{ APP_BUILD }}</span><span class="v-sep">-{{ APP_PLATFORM }}</span>
    </div>

    <Transition name="drop-overlay">
      <div v-if="dragActive" class="file-drop-overlay">
        <div class="file-drop-target">
          <FluentIcon icon="arrow-upload-20-regular" :width="28" />
          <strong>{{ lang === 'en' ? 'Drop to import' : '松开以导入文件' }}</strong>
          <span>CSV / XLSX / JSON / CYRENE</span>
        </div>
      </div>
    </Transition>

    <!-- Banner Notification System -->
    <TransitionGroup name="banner-enter" tag="div" class="banner-container">
      <div
        v-for="b in banners"
        :key="b.id"
        class="notify-banner"
        :class="{ 'banner-download': b.type === 'download', 'banner-info': b.type === 'info', 'banner-success': b.type === 'success', 'banner-warning': b.type === 'warning' }"
        @mouseenter="onBannerEnter(b)"
        @mouseleave="onBannerLeave(b)"
      >
        <div class="banner-progress-bg" :style="{ width: b.duration > 0 ? b.countdown + '%' : (b.type === 'download' ? b.progress + '%' : '0%'), transition: b.hovered ? 'none' : 'width 0.1s linear' }"></div>
        <div class="banner-scanline"></div>
        <div class="banner-content">
          <span class="banner-icon" v-if="b.icon">
            <FluentIcon :icon="b.icon" :width="16" />
          </span>
          <span class="banner-text">{{ b.message }}</span>
          <span v-if="b.type === 'download'" class="banner-progress-num">{{ b.progress }}%</span>
          <button v-if="b.undoAction" class="banner-undo" @click="b.undoAction(); dismissBanner(b.id)">
            <FluentIcon icon="arrow-undo-16-regular" :width="12" /> {{ lang === 'en' ? 'Undo' : '撤销' }}
          </button>
          <button v-if="b.action" class="banner-undo" @click="runBannerAction(b)">
            <FluentIcon :icon="b.actionIcon || 'shield-keyhole-16-regular'" :width="12" /> {{ b.actionLabel }}
          </button>
          <button v-if="b.dismissible" class="banner-dismiss" @click="dismissBanner(b.id)">
            <FluentIcon icon="dismiss-12-regular" :width="12" />
          </button>
        </div>
      </div>
    </TransitionGroup>

    <FluentModal
      v-model="showDropPassword"
      :title="dropPasswordMode === 'set'
        ? (lang === 'en' ? 'Set a protection password' : '设置安全密码')
        : (lang === 'en' ? 'Verify password' : '验证密码')"
      max-width="440px"
      @close="cancelProtectedImport"
    >
      <div class="drop-modal-body">
        <p>{{ dropPasswordMode === 'set'
          ? (lang === 'en' ? 'Set a password before importing data that overwrites this app.' : '覆盖程序数据前需要先设置安全密码。')
          : (lang === 'en' ? 'Enter the protection password to continue.' : '请输入安全密码以继续覆盖程序数据。') }}</p>
        <FluentInput
          ref="dropPasswordInputRef"
          v-model="dropPassword"
          type="password"
          :placeholder="lang === 'en' ? 'Password' : '密码'"
          @enter="confirmDropPassword"
        />
        <span v-if="dropPasswordError" class="drop-modal-error">{{ dropPasswordError }}</span>
      </div>
      <template #footer>
        <FluentButton variant="secondary" size="sm" @click="cancelProtectedImport">{{ lang === 'en' ? 'Cancel' : '取消' }}</FluentButton>
        <FluentButton variant="primary" size="sm" @click="confirmDropPassword">{{ lang === 'en' ? 'Continue' : '继续' }}</FluentButton>
      </template>
    </FluentModal>

    <FluentModal
      v-model="showDropDataWarning"
      :title="lang === 'en' ? 'Overwrite application data?' : '覆盖程序数据？'"
      max-width="440px"
      @close="cancelProtectedImport"
    >
      <div class="drop-modal-body">
        <p>{{ lang === 'en'
          ? 'All current lists, records and settings will be replaced by the dropped CYRENE file.'
          : '当前名单、记录和设置将被拖入的 CYRENE 文件全部替换。' }}</p>
      </div>
      <template #footer>
        <FluentButton variant="secondary" size="sm" @click="cancelProtectedImport">{{ lang === 'en' ? 'Cancel' : '取消' }}</FluentButton>
        <FluentButton variant="danger" size="sm" @click="importProtectedData">{{ lang === 'en' ? 'Overwrite' : '确认覆盖' }}</FluentButton>
      </template>
    </FluentModal>

    <FluentToast ref="globalToast" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, provide, ref, computed, nextTick, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TitleBar from './TitleBar.vue'
import NavigationDock from './NavigationDock.vue'
import FluentToast from '../FluentToast.vue'
import FluentModal from '../FluentModal.vue'
import FluentInput from '../FluentInput.vue'
import FluentButton from '../FluentButton.vue'
import FullscreenToggle from '../FullscreenToggle.vue'
import FluentIcon from '../FluentIcon.vue'
import { useSettingsStore } from '../../stores/settings'
import { useNamesStore } from '../../stores/names'
import { useStatisticsStore } from '../../stores/statistics'
import { useRecordsStore } from '../../stores/records'
import { usePrizesStore } from '../../stores/prizes'
import { APP_VERSION, APP_VERSION_PREFIX, APP_BUILD, APP_PLATFORM, APP_NAME } from '../../utils/version'
import { updateState, checkForUpdates, downloadUpdate } from '../../utils/updater'
import { isTauri, tauriAPI } from '../../utils/tauriAPI'
import { dataBridge } from '../../utils/dataBridge'
import { createThemeVariables, DEFAULT_ACCENT, normalizeHex } from '../../utils/theme'

const router = useRouter()
const currentRoute = useRoute()
const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const statisticsStore = useStatisticsStore()
const recordsStore = useRecordsStore()
const prizesStore = usePrizesStore()

const lang = computed(() => settingsStore.settings.language)
const systemAccent = ref(DEFAULT_ACCENT)
let removeAccentListener
const themeStyle = computed(() => {
  const settings = settingsStore.settings
  const style = { fontSize: (14 * (settings.uiScale || 100) / 100) + 'px' }
  if (settings.colorTheme === 'custom') {
    return { ...style, ...createThemeVariables(settings.customThemeColor, settingsStore.darkMode, false) }
  }
  if (settings.colorTheme === 'fluent') {
    return { ...style, ...createThemeVariables(systemAccent.value, settingsStore.darkMode, true) }
  }
  return style
})
const isDesktopApp = computed(() => isTauri())

const dragActive = ref(false)
const showDropPassword = ref(false)
const showDropDataWarning = ref(false)
const dropPasswordMode = ref('verify')
const dropPassword = ref('')
const dropPasswordError = ref('')
const dropPasswordInputRef = ref(null)
let pendingDataImport = null
let removeDropListener
let browserDragDepth = 0
const recentDropFingerprints = new Map()

function claimDroppedFile(fingerprint) {
  const now = Date.now()
  for (const [key, timestamp] of recentDropFingerprints) {
    if (now - timestamp > 3000) recentDropFingerprints.delete(key)
  }
  if (recentDropFingerprints.has(fingerprint)) return false
  recentDropFingerprints.set(fingerprint, now)
  return true
}

const globalToast = ref(null)
provide('toast', globalToast)

// Banner notification system
const banners = ref([])
let bannerIdCounter = 0

function showBanner({ message, icon = 'info-16-regular', type = 'info', duration = 8000, dismissible = false, progress = 0, undoAction = null, action = null, actionLabel = '', actionIcon = '' }) {
  const existing = banners.value.find(b => b.message === message)
  if (existing) return { id: existing.id, update(opts) { Object.assign(existing, opts) }, dismiss() { dismissBanner(existing.id) } }

  const id = ++bannerIdCounter
  const banner = reactive({
    id, message, icon, type, dismissible, progress, undoAction, action, actionLabel, actionIcon,
    hovered: false, countdown: 100, duration,
    _timer: null, _countdownInterval: null, _remaining: duration, _startTime: Date.now()
  })
  banners.value.push(banner)
  while (banners.value.length > 3) {
    banners.value.shift()
  }
  if (duration > 0) {
    startBannerTimer(banner, id)
  }
  return {
    id,
    update(opts) { Object.assign(banner, opts) },
    dismiss() { dismissBanner(id) }
  }
}

async function runBannerAction(banner) {
  const result = await banner.action?.()
  if (result !== false) dismissBanner(banner.id)
}

function startBannerTimer(banner, id) {
  banner._startTime = Date.now()
  banner._countdownStart = banner.countdown
  banner._timer = setTimeout(() => dismissBanner(id), banner._remaining)
  banner._countdownInterval = setInterval(() => {
    const elapsed = Date.now() - banner._startTime
    const pct = (elapsed / banner._remaining) * banner._countdownStart
    banner.countdown = Math.max(0, banner._countdownStart - pct)
  }, 100)
}

function pauseBannerTimer(banner) {
  if (banner._timer) clearTimeout(banner._timer)
  if (banner._countdownInterval) clearInterval(banner._countdownInterval)
  const elapsed = Date.now() - banner._startTime
  banner._remaining = Math.max(0, banner._remaining - elapsed)
}

function dismissBanner(id) {
  const idx = banners.value.findIndex(b => b.id === id)
  if (idx !== -1) {
    const b = banners.value[idx]
    if (b._timer) clearTimeout(b._timer)
    if (b._countdownInterval) clearInterval(b._countdownInterval)
    banners.value.splice(idx, 1)
  }
}

function onBannerEnter(b) {
  b.hovered = true
  if (b.duration > 0) pauseBannerTimer(b)
}

function onBannerLeave(b) {
  b.hovered = false
  if (b.duration > 0) startBannerTimer(b, b.id)
}

provide('banner', showBanner)

async function sha256(value) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function requestProtectedImport(bytes) {
  pendingDataImport = bytes
  const savedPassword = await dataBridge.load('password')
  dropPasswordMode.value = savedPassword?.hash ? 'verify' : 'set'
  dropPassword.value = ''
  dropPasswordError.value = ''
  showDropPassword.value = true
  await nextTick()
  dropPasswordInputRef.value?.focus()
}

function cancelProtectedImport() {
  showDropPassword.value = false
  showDropDataWarning.value = false
  dropPassword.value = ''
  dropPasswordError.value = ''
  pendingDataImport = null
}

async function confirmDropPassword() {
  if (!dropPassword.value) {
    dropPasswordError.value = lang.value === 'en' ? 'Enter a password.' : '请输入密码。'
    return
  }
  const hash = await sha256(dropPassword.value)
  if (dropPasswordMode.value === 'set') {
    await dataBridge.save('password', { hash })
  } else {
    const savedPassword = await dataBridge.load('password')
    if (!savedPassword?.hash || hash !== savedPassword.hash) {
      dropPasswordError.value = lang.value === 'en' ? 'Incorrect password.' : '密码错误。'
      return
    }
  }
  showDropPassword.value = false
  dropPassword.value = ''
  showDropDataWarning.value = true
}

async function importProtectedData() {
  if (!pendingDataImport) return
  const bytes = pendingDataImport
  showDropDataWarning.value = false
  pendingDataImport = null
  const result = await dataBridge.importDataBytes(bytes)
  if (!result?.success) {
    showBanner({
      message: `${lang.value === 'en' ? 'Data import failed' : '程序数据导入失败'}：${result?.error || (lang.value === 'en' ? 'Unknown error' : '未知错误')}`,
      icon: 'warning-16-regular', type: 'warning', duration: 10000, dismissible: true
    })
    return
  }
  showBanner({
    message: lang.value === 'en' ? 'Data imported. Reload to apply it.' : '程序数据已导入，重新加载后生效。',
    icon: 'checkmark-circle-16-regular', type: 'success', duration: 0, dismissible: true,
    action: () => window.location.reload(),
    actionLabel: lang.value === 'en' ? 'Reload' : '重新加载',
    actionIcon: 'arrow-clockwise-16-regular'
  })
}

async function routeSmartImport(fileName, bytes) {
  const { parseSmartFile } = await import('../../utils/smartImport')
  const parsed = parseSmartFile(fileName, bytes)
  if (parsed.kind === 'data') {
    await requestProtectedImport(parsed.bytes)
    return
  }
  if (parsed.kind === 'names') {
    const imported = namesStore.importList(parsed.list)
    if (!imported) throw new Error(lang.value === 'en' ? 'Invalid people list' : '人员名单格式无效')
    await router.push('/lists')
    showBanner({ message: `${lang.value === 'en' ? 'People list imported' : '人员名单已导入'}：${imported.name}`, icon: 'checkmark-circle-16-regular', type: 'success', duration: 6000 })
    return
  }
  const result = prizesStore.importList(parsed.list)
  if (!result?.success) throw new Error(result?.error || (lang.value === 'en' ? 'Invalid prize list' : '奖品单格式无效'))
  await router.push('/lottery/prizes/manage')
  showBanner({ message: `${lang.value === 'en' ? 'Prize list imported' : '奖品单已导入'}：${result.list.name}`, icon: 'checkmark-circle-16-regular', type: 'success', duration: 6000 })
}

async function processBrowserFiles(files) {
  for (const file of Array.from(files || [])) {
    const fingerprint = `web:${file.name}:${file.size}:${file.lastModified}`
    if (!claimDroppedFile(fingerprint)) continue
    try {
      await routeSmartImport(file.name, new Uint8Array(await file.arrayBuffer()))
    } catch (error) {
      showBanner({ message: `${file.name}：${error.message || error}`, icon: 'warning-16-regular', type: 'warning', duration: 10000, dismissible: true })
    }
  }
}

async function processTauriPaths(paths) {
  for (const path of new Set(paths || [])) {
    const fingerprint = `tauri:${String(path).toLowerCase()}`
    if (!claimDroppedFile(fingerprint)) continue
    try {
      const file = await tauriAPI.readDroppedFile(path)
      if (!file?.base64) throw new Error(lang.value === 'en' ? 'Unable to read file' : '无法读取文件')
      const binary = atob(file.base64)
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
      await routeSmartImport(file.name, bytes)
    } catch (error) {
      const fileName = String(path).split(/[\\/]/).pop() || String(path)
      showBanner({ message: `${fileName}：${error.message || error}`, icon: 'warning-16-regular', type: 'warning', duration: 10000, dismissible: true })
    }
  }
}

function onBrowserDragEnter(event) {
  if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return
  event.preventDefault()
  browserDragDepth += 1
  dragActive.value = true
}

function onBrowserDragOver(event) {
  if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

function onBrowserDragLeave(event) {
  event.preventDefault()
  browserDragDepth = Math.max(0, browserDragDepth - 1)
  if (browserDragDepth === 0) dragActive.value = false
}

function onBrowserDrop(event) {
  event.preventDefault()
  browserDragDepth = 0
  dragActive.value = false
  processBrowserFiles(event.dataTransfer?.files)
}

async function setupFileDrop() {
  if (isTauri()) {
    const { getCurrentWebview } = await import('@tauri-apps/api/webview')
    removeDropListener = await getCurrentWebview().onDragDropEvent(event => {
      if (event.payload.type === 'enter' || event.payload.type === 'over') dragActive.value = true
      if (event.payload.type === 'leave') dragActive.value = false
      if (event.payload.type === 'drop') {
        dragActive.value = false
        processTauriPaths(event.payload.paths)
      }
    })
    return
  }
  window.addEventListener('dragenter', onBrowserDragEnter)
  window.addEventListener('dragover', onBrowserDragOver)
  window.addEventListener('dragleave', onBrowserDragLeave)
  window.addEventListener('drop', onBrowserDrop)
  removeDropListener = () => {
    window.removeEventListener('dragenter', onBrowserDragEnter)
    window.removeEventListener('dragover', onBrowserDragOver)
    window.removeEventListener('dragleave', onBrowserDragLeave)
    window.removeEventListener('drop', onBrowserDrop)
  }
}

const transitionName = ref('page-forward')

router.beforeEach((to, from) => {
  const toIdx = Number(to.meta.order ?? 0)
  const fromIdx = Number(from.meta.order ?? 0)
  transitionName.value = toIdx >= fromIdx ? 'page-forward' : 'page-back'
})

// Scroll to top on route change.
router.afterEach((to, from) => {
  if (to.path.startsWith(from.path + '/')) return
  nextTick(() => {
    const content = document.querySelector('.app-content')
    if (content) content.scrollTop = 0
  })
})

document.title = APP_NAME

onMounted(async () => {
  await namesStore.initialize()
  await statisticsStore.initialize()
  await recordsStore.initialize()
  await prizesStore.initialize()
  await setupFileDrop()
  if (isTauri()) {
    systemAccent.value = normalizeHex(await tauriAPI.systemAccent(), DEFAULT_ACCENT)
  }
  if (isDesktopApp.value) checkForUpdates(true, showBanner)
  if (isDesktopApp.value && settingsStore.settings.floatingWindowEnabled) {
    if (isTauri()) await tauriAPI.invoke('open_floating_window')
  }
})

onBeforeUnmount(() => {
  removeAccentListener?.()
  removeDropListener?.()
})

watch(() => settingsStore.settings.uiScale, (val) => {
  document.documentElement.style.setProperty('--ui-scale', (val || 100) / 100 * 1.25)
}, { immediate: true })

watch(() => settingsStore.settings.nameFontSize, (val) => {
  document.documentElement.style.setProperty('--name-font-factor', val || 1)
}, { immediate: true })

function applyFontFamily(val) {
  const font = val === 'MiSans' ? 'MiSans' : 'HarmonyOS'
  document.documentElement.style.setProperty('--font-ui', `'${font}', 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif`)
  document.documentElement.style.setProperty('--font-display', `'${font}', 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif`)
  document.documentElement.style.setProperty('--font-num', `'Wengfaluosi', '${font}', system-ui, sans-serif`)
}

watch(() => settingsStore.settings.fontFamily, (val) => {
  applyFontFamily(val)
}, { immediate: true })
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  overflow: hidden;
  position: relative;
  transform: scale(var(--ui-scale, 1));
  transform-origin: top left;
  width: calc(100vw / var(--ui-scale, 1));
  height: calc(100vh / var(--ui-scale, 1));
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-base);
  position: relative;
}

.version-badge {
  position: fixed;
  bottom: 0px;
  right: 24px;
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0.5;
  pointer-events: none;
  z-index: 999999;
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.file-drop-overlay {
  position: fixed;
  inset: 40px 0 0 var(--dock-width);
  z-index: 999998;
  display: grid;
  place-items: center;
  pointer-events: none;
  background: color-mix(in srgb, var(--bg-base) 74%, transparent);
  backdrop-filter: blur(10px);
}

.file-drop-target {
  width: min(420px, calc(100vw - var(--dock-width) - 48px));
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 2px dashed var(--accent);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  background: var(--bg-card-solid);
  box-shadow: var(--shadow-16);
}

.file-drop-target strong { font-size: 18px; font-weight: 600; }
.file-drop-target span { font-size: 12px; color: var(--text-muted); }
.drop-overlay-enter-active, .drop-overlay-leave-active { transition: opacity var(--duration-fast) ease; }
.drop-overlay-enter-from, .drop-overlay-leave-to { opacity: 0; }

.drop-modal-body { display: grid; gap: 12px; }
.drop-modal-body p { margin: 0; color: var(--text-secondary); line-height: 1.6; }
.drop-modal-error { color: #c42b1c; font-size: 12px; }

.v-prefix { font-family: var(--font-ui); font-size: 12px; }
.v-num { font-family: var(--font-num); font-size: calc(12px * var(--font-num-scale, 1.6)); }
.v-sep { font-family: var(--font-ui); font-size: 12px; }

/* Banner Container */
.banner-container {
  position: fixed;
  top: 0;
  left: var(--dock-width);
  right: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

/* Banner Notification */
.notify-banner {
  position: relative;
  height: 40px;
  overflow: hidden;
  pointer-events: all;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.notify-banner.banner-info,
.notify-banner.banner-success,
.notify-banner.banner-warning,
.notify-banner.banner-download {
  background: linear-gradient(90deg, #F3AAE1 0%, #99B9F2 100%);
  color: #3a1a2e;
}

.dark .notify-banner.banner-info,
.dark .notify-banner.banner-success,
.dark .notify-banner.banner-warning,
.dark .notify-banner.banner-download {
  background: #4a1a35;
  color: #f0c0dd;
}

/* Progress bar background for countdown/download */
.banner-progress-bg {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: rgba(255,255,255,0.1);
  z-index: 0;
}

/* Scanline effect */
.banner-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.06) 2px,
    rgba(255,255,255,0.06) 4px
  );
  z-index: 1;
  pointer-events: none;
  animation: scanline-scroll 8s linear infinite;
}

@keyframes scanline-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 0 100px; }
}

/* Performance: disable scanline */
.perf-no-anim .banner-scanline {
  animation: none !important;
}

.banner-content {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 100%;
  width: 100%;
  font-size: 13px;
  font-weight: 500;
}

.banner-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-progress-num {
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  font-size: calc(13px * 1.6);
  font-weight: 700;
  flex-shrink: 0;
  text-shadow: 0 0 8px rgba(255,255,255,0.3);
}

.banner-dismiss {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border: none;
  color: inherit;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.banner-dismiss:hover {
  background: rgba(255,255,255,0.2);
  transform: rotate(90deg);
}

.banner-undo {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-ui);
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 4px;
}

.banner-undo:hover {
  background: rgba(255,255,255,0.25);
}

/* Banner entrance animation */
.banner-enter-enter-active {
  animation: banner-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.banner-enter-leave-active {
  animation: banner-out 0.35s cubic-bezier(0.55, 0, 1, 0.45) both;
}

@keyframes banner-in {
  0% {
    opacity: 0;
    transform: translateY(-100%) scaleX(0.8);
    filter: blur(8px) brightness(2);
    max-height: 0;
  }
  30% {
    opacity: 0.6;
    filter: blur(3px) brightness(1.5);
    max-height: 40px;
  }
  60% {
    opacity: 1;
    transform: translateY(4px) scaleX(1.01);
    filter: blur(0) brightness(1.1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scaleX(1);
    filter: blur(0) brightness(1);
    max-height: 40px;
  }
}

@keyframes banner-out {
  0% {
    opacity: 1;
    transform: translateX(0);
    max-height: 40px;
  }
  100% {
    opacity: 0;
    transform: translateX(60px);
    max-height: 0;
  }
}

/* Page transitions */
.page-forward-enter-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.page-forward-leave-active { transition: all 0.28s cubic-bezier(0.55, 0, 1, 0.45); }
.page-forward-enter-from { opacity: 0; transform: translateX(40px) scale(0.97); filter: blur(4px); }
.page-forward-leave-to { opacity: 0; transform: translateX(-24px) scale(0.98); filter: blur(2px); }
.page-back-enter-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.page-back-leave-active { transition: all 0.28s cubic-bezier(0.55, 0, 1, 0.45); }
.page-back-enter-from { opacity: 0; transform: translateX(-40px) scale(0.97); filter: blur(4px); }
.page-back-leave-to { opacity: 0; transform: translateX(24px) scale(0.98); filter: blur(2px); }

@media (max-width: 768px) {
  .app-body { flex-direction: column; }
  .app-content { padding-left: 56px; }
  .banner-container { left: 56px; }
}
</style>
