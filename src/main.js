import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { addCollection } from '@iconify/vue'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'
import './assets/variables.css'
import './assets/global.css'

import fluentIcons from 'virtual:fluent-icons'
addCollection(fluentIcons)

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', event => {
    event.preventDefault()
    const reloadKey = 'cyrene:stale-chunk-reload'
    const lastReload = Number(sessionStorage.getItem(reloadKey) || 0)
    if (Date.now() - lastReload < 30000) return
    sessionStorage.setItem(reloadKey, String(Date.now()))
    window.location.reload()
  })
}

async function bootstrap() {
  const pinia = createPinia()
  const settingsStore = useSettingsStore(pinia)
  await settingsStore.initialize()

  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.mount('#app')
}

bootstrap()
