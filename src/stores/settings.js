import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dataBridge } from '../utils/dataBridge'

const DEFAULT_SETTINGS = {
  recordCounts: true,
  rainbowNames: true,
  englishMode: false,
  multiMode: false,
  peopleCount: 2,
  allowDuplicates: false,
  theme: 'default',
  particles: true,
  blur: true,
  animSpeed: 1,
  uiScale: 100,
  nameFontSize: 1.0
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ ...DEFAULT_SETTINGS })
  const isLoaded = ref(false)
  const darkMode = ref(false)

  async function initialize() {
    const saved = await dataBridge.load('settings')
    if (saved) {
      settings.value = { ...DEFAULT_SETTINGS, ...saved }
    }
    isLoaded.value = true
    applyUIScale()
    applyNameFontSize()
  }

  async function save() {
    await dataBridge.save('settings', settings.value)
  }

  function update(key, value) {
    settings.value[key] = value
    save()
    if (key === 'uiScale') applyUIScale()
    if (key === 'nameFontSize') applyNameFontSize()
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function applyUIScale() {
    const scale = (settings.value.uiScale || 100) / 100
    document.documentElement.style.setProperty('--ui-scale', scale)
  }

  function applyNameFontSize() {
    const factor = settings.value.nameFontSize || 1.0
    document.documentElement.style.setProperty('--name-font-factor', factor)
  }

  return {
    settings,
    isLoaded,
    darkMode,
    initialize,
    save,
    update,
    toggleDarkMode
  }
})
