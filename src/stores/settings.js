import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  animSpeed: 1
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ ...DEFAULT_SETTINGS })
  const isLoaded = ref(false)
  const darkMode = ref(false)

  async function initialize() {
    const saved = await window.electronAPI.loadData('settings')
    if (saved) {
      settings.value = { ...DEFAULT_SETTINGS, ...saved }
    }
    isLoaded.value = true
  }

  async function save() {
    await window.electronAPI.saveData('settings', settings.value)
  }

  function update(key, value) {
    settings.value[key] = value
    save()
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
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
