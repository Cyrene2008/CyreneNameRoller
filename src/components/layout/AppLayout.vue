<template>
  <div class="app-layout" :class="{ dark: settingsStore.darkMode, 'perf-no-blur': !settingsStore.settings.perfBlur, 'perf-no-shadow': !settingsStore.settings.perfShadows, 'perf-no-anim': !settingsStore.settings.perfAnimations }" :style="{ fontSize: (14 * (settingsStore.settings.uiScale || 100) / 100) + 'px' }">
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

    <!-- Banner Notification System -->
    <TransitionGroup name="banner-enter" tag="div" class="banner-container">
      <div
        v-for="b in banners"
        :key="b.id"
        class="notify-banner"
        :class="{ 'banner-download': b.type === 'download', 'banner-info': b.type === 'info', 'banner-success': b.type === 'success', 'banner-warning': b.type === 'warning' }"
        @mouseenter="b.hovered = true"
        @mouseleave="b.hovered = false"
      >
        <div class="banner-progress-bg" :style="{ width: b.duration > 0 ? b.countdown + '%' : (b.type === 'download' ? b.progress + '%' : '0%'), transition: b.hovered ? 'none' : (b.type === 'download' ? 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)' : 'width 0.1s linear') }"></div>
        <div class="banner-scanline"></div>
        <div class="banner-glow"></div>
        <div class="banner-content">
          <span class="banner-icon" v-if="b.icon">
            <FluentIcon :icon="b.icon" :width="16" />
          </span>
          <span class="banner-text">{{ b.message }}</span>
          <span v-if="b.type === 'download'" class="banner-progress-num">{{ b.progress }}%</span>
          <button v-if="b.undoAction" class="banner-undo" @click="b.undoAction(); dismissBanner(b.id)">
            <FluentIcon icon="arrow-undo-16-regular" :width="12" /> {{ lang === 'en' ? 'Undo' : '撤销' }}
          </button>
          <button v-if="b.dismissible && b.type !== 'download'" class="banner-dismiss" @click="dismissBanner(b.id)">
            <FluentIcon icon="dismiss-12-regular" :width="12" />
          </button>
        </div>
      </div>
    </TransitionGroup>

    <FluentToast ref="globalToast" />
  </div>
</template>

<script setup>
import { onMounted, watch, provide, ref, computed, nextTick, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TitleBar from './TitleBar.vue'
import NavigationDock from './NavigationDock.vue'
import FluentToast from '../FluentToast.vue'
import FullscreenToggle from '../FullscreenToggle.vue'
import FluentIcon from '../FluentIcon.vue'
import { useSettingsStore } from '../../stores/settings'
import { useNamesStore } from '../../stores/names'
import { useStatisticsStore } from '../../stores/statistics'
import { useRecordsStore } from '../../stores/records'
import { APP_VERSION, APP_VERSION_PREFIX, APP_BUILD, APP_PLATFORM, APP_NAME } from '../../utils/version'
import { updateState, checkForUpdates, downloadUpdate } from '../../utils/updater'
import { isTauri, tauriAPI } from '../../utils/tauriAPI'

const router = useRouter()
const currentRoute = useRoute()
const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const statisticsStore = useStatisticsStore()
const recordsStore = useRecordsStore()

const lang = computed(() => settingsStore.settings.language)
const isDesktopApp = computed(() => !!window.electronAPI || isTauri())

const globalToast = ref(null)
provide('toast', globalToast)

// Banner notification system
const banners = ref([])
let bannerIdCounter = 0

function showBanner({ message, icon = 'info-16-regular', type = 'info', duration = 0, dismissible = true, progress = 0, undoAction = null }) {
  const id = ++bannerIdCounter
  const banner = reactive({ id, message, icon, type, dismissible, progress, undoAction, hovered: false, countdown: 100, duration, _timer: null, _countdownInterval: null })
  banners.value.push(banner)
  while (banners.value.length > 3) {
    banners.value.shift()
  }
  if (duration > 0) {
    banner._timer = setTimeout(() => dismissBanner(id), duration)
    // 倒计时进度条：每100ms更新一次
    const startTime = Date.now()
    banner._countdownInterval = setInterval(() => {
      if (banner.hovered) return // hover时暂停
      const elapsed = Date.now() - startTime
      banner.countdown = Math.max(0, 100 - (elapsed / duration) * 100)
    }, 100)
  }
  return {
    id,
    update(opts) {
      Object.assign(banner, opts)
    },
    dismiss() {
      dismissBanner(id)
    }
  }
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

provide('banner', showBanner)

const routeOrder = ['/', '/roller', '/card', '/statistics', '/records', '/lists', '/lists/manage', '/settings', '/settings/balance-curve', '/about', '/about/contributors']
const transitionName = ref('page-forward')

function getRouteIndex(path) {
  const clean = path.replace(/\/$/, '') || '/'
  const idx = routeOrder.indexOf(clean)
  return idx >= 0 ? idx : routeOrder.length
}

router.beforeEach((to, from) => {
  const toIdx = getRouteIndex(to.path)
  const fromIdx = getRouteIndex(from.path)
  transitionName.value = toIdx >= fromIdx ? 'page-forward' : 'page-back'
})

router.afterEach(() => {
  nextTick(() => {
    const content = document.querySelector('.app-content')
    if (content) content.scrollTop = 0
  })
})

document.title = APP_NAME

onMounted(async () => {
  await settingsStore.initialize()
  await namesStore.initialize()
  await statisticsStore.initialize()
  await recordsStore.initialize()
  if (isDesktopApp.value) checkForUpdates(true, showBanner)
})

watch(() => settingsStore.settings.uiScale, (val) => {
  document.documentElement.style.setProperty('--ui-scale', (val || 100) / 100 * 1.25)
}, { immediate: true })

watch(() => settingsStore.settings.nameFontSize, (val) => {
  document.documentElement.style.setProperty('--name-font-factor', val || 1)
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

.notify-banner.banner-info {
  background: linear-gradient(135deg, #3d1a2e 0%, #4a1636 100%);
  color: #ffd6ec;
}

.notify-banner.banner-success {
  background: linear-gradient(135deg, #2e1a3d 0%, #36164a 100%);
  color: #e8b0ff;
}

.notify-banner.banner-warning {
  background: linear-gradient(135deg, #3d2a1a 0%, #4a3616 100%);
  color: #ffe0b0;
}

.notify-banner.banner-download {
  background: linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%);
  color: #fff;
}

/* Progress bar background for download */
.banner-progress-bg {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.25) 100%);
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
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
    rgba(255,255,255,0.02) 2px,
    rgba(255,255,255,0.02) 4px
  );
  z-index: 1;
  pointer-events: none;
}

/* Glow effect */
.banner-glow {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255,255,255,0.4) 20%,
    rgba(255,255,255,0.8) 50%,
    rgba(255,255,255,0.4) 80%,
    transparent 100%
  );
  animation: glow-sweep 3s ease-in-out infinite;
  z-index: 2;
}

@keyframes glow-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
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
