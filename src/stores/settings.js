import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dataBridge } from '../utils/dataBridge'

const DEFAULT_SETTINGS = {
  recordCounts: true,
  rainbowNames: true,
  englishMode: false,
  language: 'zh',
  multiMode: false,
  peopleCount: 2,
  allowDuplicates: false,
  forbidDuplicates: false,
  theme: 'default',
  particles: true,
  blur: true,
  animSpeed: 1,
  uiScale: 100,
  uiScaleVersion: 2,
  nameFontSize: 1.0,
  darkMode: false,
  nameColorMode: 'gradient',
  customNameColorLight: '#d04a9d',
  customNameColorDark: '#f09bd7',
  perfBlur: true,
  perfShadows: true,
  perfAnimations: true,
  dockCollapsed: false
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
        
        // 启动时复位多人模式抽取数量到2
        settings.value.peopleCount = 2
        
        // 迁移旧版本的uiScale值（从v1到v2）
        if (!saved.uiScaleVersion || saved.uiScaleVersion < 2) {
          // 旧版本的100%对应新版本的80%（因为新版本100% * 1.25 = 125%）
          settings.value.uiScale = Math.round((saved.uiScale || 100) * 0.8)
          settings.value.uiScaleVersion = 2
          save() // 保存迁移后的设置
        }
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
