<template>
  <div class="titlebar">
    <div class="titlebar-drag">
      <img src="/cyrene.png" class="titlebar-logo" alt="" draggable="false" />
      <span class="titlebar-text">Cyreneの随机点名器</span>
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
      <button class="titlebar-btn close-btn" @click="close" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="close-icon">
          <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { isTauri } from '../../utils/tauriAPI'

const isMaximized = ref(false)

function minimize() {
  if (isTauri()) {
    import('@tauri-apps/api/window').then(w => w.getCurrentWindow().minimize())
  } else {
    window.electronAPI?.minimize()
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

function close() {
  if (isTauri()) {
    import('@tauri-apps/api/window').then(w => w.getCurrentWindow().close())
  } else {
    window.electronAPI?.close()
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
  height: var(--titlebar-height);
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

.titlebar-drag {
  -webkit-app-region: drag;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  height: 100%;
}

.titlebar-logo {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  object-fit: cover;
}

.titlebar-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.titlebar-controls {
  display: flex;
  -webkit-app-region: no-drag;
  height: 100%;
}

.titlebar-btn {
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
  transition: transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
}

.close-btn:hover .close-icon {
  transform: rotate(90deg);
}

.close-btn:not(:hover) .close-icon {
  transform: rotate(0deg);
  transition: transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
}

.restore-back {
  fill: var(--bg-acrylic);
}
</style>
