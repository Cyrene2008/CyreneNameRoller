import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dataBridge } from '../utils/dataBridge'
import { DEFAULT_SETTINGS, normalizeStoredSettings } from '../../packages/cyrene-core/src/storage.js'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ ...DEFAULT_SETTINGS })
  const isLoaded = ref(false)
  const darkMode = ref(false)

  async function initialize() {
    try {
      const saved = await dataBridge.load('settings')
      if (saved && typeof saved === 'object') {
        const needsUiScalePersist = !saved.uiScaleVersion || saved.uiScaleVersion < 2
        settings.value = normalizeStoredSettings(saved)
        darkMode.value = !!saved.darkMode

        if (needsUiScalePersist) save()
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
    const saving = save()
    if (key === 'uiScale') applyUIScale()
    if (key === 'nameFontSize') applyNameFontSize()
    return saving
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    settings.value.darkMode = darkMode.value
    save()
    applyDarkMode()
  }

  function applyDarkMode() {
    const root = typeof document !== 'undefined' ? document.documentElement : null
    if (!root) return
    root.classList.toggle('light', !darkMode.value)
    root.classList.toggle('dark', darkMode.value)
  }

  function applyUIScale() {
    const scale = (settings.value.uiScale || 100) / 100 * 1.25
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
