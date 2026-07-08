<template>
  <div class="app-layout" :class="{ dark: settingsStore.darkMode }">
    <TitleBar />
    <div class="app-body">
      <NavigationDock />
      <main class="app-content">
        <router-view />
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
}
</style>
