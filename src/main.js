import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { addCollection } from '@iconify/vue'
import App from './App.vue'
import router from './router'
import { vNum } from './directives/num'
import './assets/variables.css'
import './assets/global.css'

import fluentIcons from '@iconify-json/fluent/icons.json'
addCollection(fluentIcons)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('num', vNum)
app.mount('#app')
