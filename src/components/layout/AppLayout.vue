<template>
  <div class="app-layout" :class="{ dark: settingsStore.darkMode, 'perf-no-blur': !settingsStore.settings.perfBlur, 'perf-no-shadow': !settingsStore.settings.perfShadows, 'perf-no-anim': !settingsStore.settings.perfAnimations }" :style="{ fontSize: (14 * (settingsStore.settings.uiScale || 100) / 100) + 'px' }">
    <TitleBar />
    <div class="app-body">
      <NavigationDock />
      <main class="app-content">
        <router-view v-slot="{ Component, route }">
          <Transition :name="route.meta.transition || 'page-slide'" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </router-view>
      </main>
    </div>
    <div class="version-badge">
      <span class="v-num">{{ APP_VERSION }}</span>
      <span class="v-sep">build:</span>
      <span class="v-num">{{ APP_BUILD }}</span>
    </div>
    <FluentToast ref="globalToast" />
  </div>
</template>

<script setup>
import { onMounted, watch, provide, ref } from 'vue'
import TitleBar from './TitleBar.vue'
import NavigationDock from './NavigationDock.vue'
import FluentToast from '../FluentToast.vue'
import { useSettingsStore } from '../../stores/settings'
import { useNamesStore } from '../../stores/names'
import { useStatisticsStore } from '../../stores/statistics'
import { useRecordsStore } from '../../stores/records'
import { APP_VERSION, APP_BUILD, APP_NAME } from '../../utils/version'

const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const statisticsStore = useStatisticsStore()
const recordsStore = useRecordsStore()

const globalToast = ref(null)
provide('toast', globalToast)

document.title = APP_NAME

onMounted(async () => {
  await settingsStore.initialize()
  await namesStore.initialize()
  await statisticsStore.initialize()
  await recordsStore.initialize()
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
  bottom: 8px;
  right: 16px;
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0.5;
  pointer-events: none;
  z-index: 999999;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.v-num {
  font-family: var(--font-num);
  font-size: calc(12px * var(--font-num-scale, 1.6));
}

.v-sep {
  font-family: var(--font-ui);
  font-size: 12px;
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

@media (max-width: 768px) {
  .app-body {
    flex-direction: column;
  }

  .app-content {
    padding-left: 56px;
  }
}
</style>
