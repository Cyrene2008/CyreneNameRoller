<template>
  <div class="app-layout" :class="{ dark: settingsStore.darkMode, 'perf-no-blur': !settingsStore.settings.perfBlur, 'perf-no-shadow': !settingsStore.settings.perfShadows, 'perf-no-anim': !settingsStore.settings.perfAnimations }" :style="{ fontSize: (14 * (settingsStore.settings.uiScale || 100) / 100) + 'px' }">
    <TitleBar />
    <div class="app-body">
      <NavigationDock />
      <main class="app-content">
        <router-view v-slot="{ Component, route }">
          <Transition name="page-fade" mode="out-in">
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
        <FluentIcon icon="arrow-download-24-regular" :width="18" />
        <span>{{ lang === 'en' ? 'Update available:' : '发现新版本：' }}{{ updateState.version }}</span>
        <button class="update-btn" @click="downloadUpdate">{{ lang === 'en' ? 'Download' : '下载' }}</button>
        <button class="update-dismiss" @click="updateState.available = false">
          <FluentIcon icon="dismiss-16-regular" :width="14" />
        </button>
      </div>
    </Transition>

    <FluentToast ref="globalToast" />
  </div>
</template>

<script setup>


import { onMounted, watch, provide, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
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
const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const statisticsStore = useStatisticsStore()
const recordsStore = useRecordsStore()

const lang = computed(() => settingsStore.settings.language)
const isDesktopApp = computed(() => !!window.electronAPI || isTauri())

const globalToast = ref(null)
provide('toast', globalToast)

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
  checkForUpdates()
})

watch(() => settingsStore.settings.uiScale, (val) => {
  document.documentElement.style.setProperty('--ui-scale', (val || 100) / 100)
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
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  z-index: 99999;
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
}

.update-btn:hover {
  background: rgba(255,255,255,0.3);
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
}

.update-dismiss:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
}

.update-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
}

.update-slide-leave-active {
  transition: all 0.2s ease-in;
}

.update-slide-enter-from,
.update-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
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
