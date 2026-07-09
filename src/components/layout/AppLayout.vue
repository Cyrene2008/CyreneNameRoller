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
      <div v-if="updateState.available" class="update-banner">
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


import { onMounted, watch, provide, ref, computed } from 'vue'
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

const router = useRouter()
const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const statisticsStore = useStatisticsStore()
const recordsStore = useRecordsStore()

const lang = computed(() => settingsStore.settings.language)

const globalToast = ref(null)
provide('toast', globalToast)

const transitionName = ref('page-slide')

// Track navigation direction for reverse animations
const routeHistory = ref([])
router.afterEach((to, from) => {
  const toDepth = to.path.split('/').length
  const fromDepth = from.path.split('/').length
  
  // Check if going back (to a parent route)
  if (toDepth < fromDepth || routeHistory.value.includes(to.path)) {
    transitionName.value = 'page-slide-reverse'
    routeHistory.value = routeHistory.value.filter(p => p !== from.path)
  } else {
    transitionName.value = 'page-slide'
    if (!routeHistory.value.includes(from.path)) {
      routeHistory.value.push(from.path)
    }
  }
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

.page-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
}

.page-slide-leave-active {
  transition: all 0.15s ease-in;
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.page-slide-reverse-enter-active {
  transition: all 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
}

.page-slide-reverse-leave-active {
  transition: all 0.15s ease-in;
}

.page-slide-reverse-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.page-slide-reverse-leave-to {
  opacity: 0;
  transform: translateX(10px);
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
