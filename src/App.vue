<template>
  <SplashScreen v-if="!isFloatingRoute && showSplash" @done="showSplash = false" />
  <router-view v-else-if="isFloatingRoute" />
  <AppLayout v-else />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import SplashScreen from './components/SplashScreen.vue'
import { useSettingsStore } from './stores/settings'
import { isTauri, tauriAPI } from './utils/tauriAPI'

const settingsStore = useSettingsStore()
const route = useRoute()
const isFloatingRoute = computed(() => route.path === '/floating')
const showSplash = ref(false)
const splashPlayed = ref(false)
let unlistenMainShown

function playSplashOnce() {
  if (splashPlayed.value || settingsStore.settings.disableSplash === true) return false
  splashPlayed.value = true
  showSplash.value = true
  return true
}

function waitForPaint() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

async function prepareTauriMainWindowShow() {
  playSplashOnce()
  await nextTick()
  await waitForPaint()
  await tauriAPI.showMainWindow()
}

async function listenForMainWindowShow() {
  if (isTauri()) {
    const { listen } = await import('@tauri-apps/api/event')
    unlistenMainShown = await listen('main-window-show-requested', prepareTauriMainWindowShow)
    await tauriAPI.mainWindowReady()
  }
}

onMounted(async () => {
  await nextTick()
  if (isFloatingRoute.value) return
  if (isTauri()) {
    await listenForMainWindowShow()
    const autoStart = await tauriAPI.isAutoStartLaunch()
    if (autoStart && settingsStore.settings.autoStartToTray) {
      return
    }
    await prepareTauriMainWindowShow()
  } else {
    playSplashOnce()
  }
})
onBeforeUnmount(() => { unlistenMainShown?.() })
</script>
