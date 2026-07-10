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

    <Transition name="update-slide">
      <div v-if="isDesktopApp && updateState.available" class="update-banner">
        <div class="update-banner-bg"></div>
        <div class="update-banner-content">
          <FluentIcon icon="arrow-download-24-regular" :width="18" />
          <span>{{ lang === 'en' ? 'Update available:' : '发现新版本：' }}{{ updateState.version }}</span>
          <button class="update-btn" @click="downloadUpdate" :disabled="updateState.downloading">
            <span v-if="updateState.downloading" class="btn-progress">{{ updateState.downloadProgress }}%</span>
            {{ updateState.downloading ? (lang === 'en' ? 'Downloading...' : '下载中...') : (lang === 'en' ? 'Download' : '下载') }}
          </button>
          <button class="update-dismiss" @click="updateState.available = false">
            <FluentIcon icon="dismiss-16-regular" :width="14" />
          </button>
        </div>
      </div>
    </Transition>

    <FluentToast ref="globalToast" />
  </div>
</template>

<script setup>


import { onMounted, watch, provide, ref, computed, nextTick } from 'vue'
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
import { isTauri } from '../../utils/tauriAPI'

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

// Scroll to top on route change
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
  if (isDesktopApp.value) checkForUpdates()
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

.v-prefix {
  font-family: var(--font-ui);
  font-size: 12px;
}

.v-num {
  font-family: var(--font-num);
  font-size: calc(12px * var(--font-num-scale, 1.6));
}

.v-sep {
  font-family: var(--font-ui);
  font-size: 12px;
}

.update-banner {
  position: fixed;
  top: 0;
  left: var(--dock-width);
  right: 0;
  height: 40px;
  background: var(--accent);
  color: #fff;
  z-index: 99999;
  overflow: hidden;
}

.update-banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(255,255,255,0) 0%, 
    rgba(255,255,255,0.1) 25%, 
    rgba(255,255,255,0) 50%, 
    rgba(255,255,255,0.1) 75%, 
    rgba(255,255,255,0) 100%
  );
  background-size: 200% 100%;
  animation: banner-shimmer 3s ease-in-out infinite;
}

.update-banner-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  height: 100%;
  font-size: 13px;
  font-weight: 500;
}

@keyframes banner-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.update-btn {
  margin-left: auto;
  padding: 4px 16px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.update-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.3);
  transform: translateY(-1px);
}

.update-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-progress {
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}

.update-dismiss {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.update-dismiss:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
  transform: rotate(90deg);
}

.update-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.update-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}

.update-slide-enter-from {
  transform: translateY(-100%) scale(0.95);
  opacity: 0;
  filter: blur(4px);
}

.update-slide-leave-to {
  transform: translateY(-100%) scale(0.95);
  opacity: 0;
  filter: blur(2px);
}

.page-fade-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.page-forward-enter-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-forward-leave-active {
  transition: all 0.28s cubic-bezier(0.55, 0, 1, 0.45);
}

.page-forward-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.97);
  filter: blur(4px);
}

.page-forward-leave-to {
  opacity: 0;
  transform: translateX(-24px) scale(0.98);
  filter: blur(2px);
}

.page-back-enter-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-back-leave-active {
  transition: all 0.28s cubic-bezier(0.55, 0, 1, 0.45);
}

.page-back-enter-from {
  opacity: 0;
  transform: translateX(-40px) scale(0.97);
  filter: blur(4px);
}

.page-back-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.98);
  filter: blur(2px);
}

@media (max-width: 768px) {
  .app-body {
    flex-direction: column;
  }

  .app-content {
    padding-left: 56px;
  }

  .update-banner {
    left: 56px;
  }
}
</style>
