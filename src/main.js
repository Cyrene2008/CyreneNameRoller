import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { addCollection } from '@iconify/vue'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'
import './assets/variables.css'
import './assets/global.css'

import fluentIcons from '@iconify-json/fluent/icons.json'
addCollection(fluentIcons)

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
