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
  if (splashPlayed.value || settingsStore.settings.disableSplash === true) return
  splashPlayed.value = true
  showSplash.value = true
}

async function listenForFirstMainWindowShow() {
  if (isTauri()) {
    const { listen } = await import('@tauri-apps/api/event')
    unlistenMainShown = await listen('main-window-shown', () => {
      playSplashOnce()
      unlistenMainShown?.()
      unlistenMainShown = null
    })
  } else if (window.electronAPI?.onMainWindowShown) {
    unlistenMainShown = window.electronAPI.onMainWindowShown(() => {
      playSplashOnce()
      unlistenMainShown?.()
      unlistenMainShown = null
    })
  }
}

onMounted(async () => {
  await nextTick()
  if (isFloatingRoute.value) return
  if (isTauri()) {
    const autoStart = await tauriAPI.isAutoStartLaunch()
    if (autoStart && settingsStore.settings.autoStartToTray) {
      await listenForFirstMainWindowShow()
      return
    }
    playSplashOnce()
    await nextTick()
    await tauriAPI.showMainWindow()
  } else if (window.electronAPI) {
    const autoStart = await window.electronAPI.isAutoStartLaunch?.()
    if (autoStart && settingsStore.settings.autoStartToTray) {
      await listenForFirstMainWindowShow()
      return
    }
    playSplashOnce()
    await nextTick()
    window.electronAPI?.showMainWindow?.()
  } else {
    playSplashOnce()
  }
})
onBeforeUnmount(() => { unlistenMainShown?.() })
</script>
