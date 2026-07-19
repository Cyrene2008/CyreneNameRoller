<template>
  <div v-if="isDesktopApp" class="titlebar">
    <button class="titlebar-hamburger" @click="toggleDock" :title="dockCollapsed ? '展开' : '收起'">
      <Icon icon="fluent:line-horizontal-3-20-regular" :width="18" />
    </button>
    <img src="/cyrene.png" class="titlebar-logo" alt="" draggable="false" />
    <span class="titlebar-app-title">Cyreneの随机点名器</span>
    <div class="titlebar-drag">
    </div>
    <div class="titlebar-controls">
      <button class="titlebar-btn minimize-btn" @click="minimize" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="5.5" width="8" height="1" rx="0.5" fill="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-btn maximize-btn" @click="maximize" :title="isMaximized ? '还原' : '最大化'">
        <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1" fill="none"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="3.5" y="1" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1" fill="none"/>
          <rect x="1.5" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1" fill="none" class="restore-back"/>
        </svg>
      </button>
      <button class="titlebar-btn close-btn" @click="hideToTray" title="最小化到托盘">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="close-icon">
          <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { isTauri } from '../../utils/tauriAPI'
import { useSettingsStore } from '../../stores/settings'

const settingsStore = useSettingsStore()
const isMaximized = ref(false)
const dockCollapsed = computed(() => settingsStore.settings.dockCollapsed || false)

const isDesktopApp = computed(() => {
  return !!window.electronAPI || isTauri()
})

function toggleDock() {
  settingsStore.update('dockCollapsed', !dockCollapsed.value)
}

function minimize() {
  if (isTauri()) {
    import('@tauri-apps/api/window').then(w => w.getCurrentWindow().minimize())
  } else {
    window.electronAPI?.minimize()
  }
}

function hideToTray() {
  if (isTauri()) {
    import('@tauri-apps/api/core').then(m => m.invoke('hide_to_tray'))
  } else {
    window.electronAPI?.hide()
  }
}

async function maximize() {
  if (isTauri()) {
    const w = await import('@tauri-apps/api/window')
    const win = w.getCurrentWindow()
    const maxed = await win.isMaximized()
    maxed ? await win.unmaximize() : await win.maximize()
    isMaximized.value = await win.isMaximized()
  } else {
    window.electronAPI?.maximize()
    setTimeout(async () => {
      isMaximized.value = await window.electronAPI?.isMaximized() || false
    }, 100)
  }
}

onMounted(async () => {
  if (isTauri()) {
    const w = await import('@tauri-apps/api/window')
    isMaximized.value = await w.getCurrentWindow().isMaximized()
  } else if (window.electronAPI) {
    isMaximized.value = await window.electronAPI.isMaximized() || false
  }
})
</script>

<style scoped>
.titlebar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-acrylic);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  user-select: none;
}

.titlebar-hamburger {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  outline: none;
  -webkit-app-region: no-drag;
  flex-shrink: 0;
}

.titlebar-hamburger:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}

.dark .titlebar-hamburger:hover {
  background: rgba(255, 255, 255, 0.08);
  gap: 10px;
  padding-left: 14px;
  height: 100%;
}

.titlebar-logo {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  -webkit-app-region: drag;
  margin-right: 5px;
}

.titlebar-app-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  -webkit-app-region: drag;
  white-space: nowrap;
  margin-right: 8px;
}

.titlebar-drag {
  -webkit-app-region: drag;
  flex: 1;
  height: 100%;
}

.titlebar-controls {
  display: flex;
  -webkit-app-region: no-drag;
  height: 100%;
}

.titlebar-btn {
  width: 50px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  outline: none;
}

.titlebar-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}

.dark .titlebar-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.close-btn:hover {
  background: #c42b1c !important;
  color: #ffffff !important;
}

.close-icon {
  transition: transform 0.4s cubic-bezier(0.1, 0.9, 0.2, 1);
}

.close-btn:hover .close-icon {
  transform: rotate(90deg);
}

.close-btn:not(:hover) .close-icon {
  transform: rotate(0deg);
  transition: transform 0.4s cubic-bezier(0.1, 0.9, 0.2, 1);
}

.restore-back {
  fill: var(--bg-acrylic);
}
</style>
