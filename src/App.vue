<template>
  <SplashScreen v-if="!isFloatingRoute && showSplash" @done="showSplash = false" />
  <router-view v-else-if="isFloatingRoute" />
  <AppLayout v-else />
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import SplashScreen from './components/SplashScreen.vue'
import { useSettingsStore } from './stores/settings'

const settingsStore = useSettingsStore()
const route = useRoute()
const isFloatingRoute = computed(() => route.path === '/floating')
const showSplash = ref(true)

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const raw = window.localStorage.getItem('settings')
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.disableSplash === true) showSplash.value = false
    }
  } catch {}
}

onMounted(async () => {
  if (!settingsStore.isLoaded) {
    await new Promise((resolve) => {
      const stop = watch(
        () => settingsStore.isLoaded,
        (v) => {
          if (v) {
            stop()
            resolve()
          }
        },
        { immediate: true }
      )
      setTimeout(resolve, 2000)
    })
  }
  showSplash.value = settingsStore.settings.disableSplash !== true
})
</script>
