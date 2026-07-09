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
  forbidDuplicates: false,
  theme: 'default',
  particles: true,
  blur: true,
  animSpeed: 1,
  uiScale: 100,
  nameFontSize: 1.0,
  darkMode: false,
  nameColorMode: 'gradient',
  customNameColorLight: '#d04a9d',
  customNameColorDark: '#f09bd7',
  perfBlur: true,
  perfShadows: true,
  perfAnimations: true
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ ...DEFAULT_SETTINGS })
  const isLoaded = ref(false)
  const darkMode = ref(false)

  async function initialize() {
    try {
      const saved = await dataBridge.load('settings')
      if (saved && typeof saved === 'object') {
        settings.value = { ...DEFAULT_SETTINGS, ...saved }
        darkMode.value = !!saved.darkMode
      }
    } catch (e) {
      console.error('[settings] initialize failed:', e)
    }
    isLoaded.value = true
    applyUIScale()
    applyNameFontSize()
    applyDarkMode()
  }

  async function save() {
    settings.value.darkMode = darkMode.value
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
    settings.value.darkMode = darkMode.value
    save()
    applyDarkMode()
  }

  function applyDarkMode() {
    // darkMode is applied via :class binding in AppLayout
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
