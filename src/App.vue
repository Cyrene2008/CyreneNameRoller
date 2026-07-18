<template>
  <SplashScreen v-if="showSplash" @done="showSplash = false" />
  <AppLayout />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AppLayout from './components/layout/AppLayout.vue'
import SplashScreen from './components/SplashScreen.vue'
import { useSettingsStore } from './stores/settings'

const settingsStore = useSettingsStore()
// 默认为显示；加载完成后按设置校正
const showSplash = ref(true)

// 浏览器环境可同步读取，避免已关闭动画时的闪烁；桌面端将在初始化后校正
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
  // 单进程限制 / 托盘右键启动不会重载页面，故本组件仅在首次加载或刷新时挂载，天然排除这两种情况
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
      setTimeout(resolve, 2000) // 兜底，避免设置加载异常时卡住
    })
  }
  showSplash.value = settingsStore.settings.disableSplash !== true
})
</script>
