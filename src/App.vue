<template>
  <SplashScreen v-if="!isFloatingRoute && showSplash" @done="showSplash = false" />
  <router-view v-else-if="isFloatingRoute" />
  <AppLayout v-else />
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import SplashScreen from './components/SplashScreen.vue'
import { useSettingsStore } from './stores/settings'

const settingsStore = useSettingsStore()
const route = useRoute()
const isFloatingRoute = computed(() => route.path === '/floating')
const showSplash = ref(settingsStore.settings.disableSplash !== true)

onMounted(async () => {
  await nextTick()
  if (isFloatingRoute.value) return
  if (window.electronAPI?.showMainWindow) window.electronAPI.showMainWindow()
  else if (window.__TAURI_INTERNALS__) await window.__TAURI_INTERNALS__.invoke('show_main_window')
})
</script>
