<template>
  <div class="app-layout" :class="{ dark: settingsStore.darkMode }">
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
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import TitleBar from './TitleBar.vue'
import NavigationDock from './NavigationDock.vue'
import { useSettingsStore } from '../../stores/settings'
import { useNamesStore } from '../../stores/names'
import { useStatisticsStore } from '../../stores/statistics'

const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const statisticsStore = useStatisticsStore()

onMounted(async () => {
  await settingsStore.initialize()
  await namesStore.initialize()
  await statisticsStore.initialize()
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  overflow: hidden;
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
</style>
