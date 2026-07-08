<template>
  <div class="titlebar">
    <div class="titlebar-drag">
      <Icon icon="fluent:heart-24-filled" class="titlebar-icon" :width="14" />
      <span class="titlebar-text">CyreneNameRoller</span>
    </div>
    <div class="titlebar-controls">
      <button class="titlebar-btn" @click="minimize" title="最小化">
        <Icon icon="fluent:subtract-16-regular" :width="12" />
      </button>
      <button class="titlebar-btn" @click="maximize" title="最大化">
        <Icon :icon="isMaximized ? 'fluent:window-restore-16-regular' : 'fluent:maximize-16-regular'" :width="12" />
      </button>
      <button class="titlebar-btn close-btn" @click="close" title="关闭">
        <Icon icon="fluent:dismiss-16-regular" :width="12" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

const isMaximized = ref(false)

function minimize() {
  window.electronAPI?.minimize()
}

async function maximize() {
  window.electronAPI?.maximize()
  isMaximized.value = await window.electronAPI?.isMaximized() || false
}

function close() {
  window.electronAPI?.close()
}
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

.titlebar-icon {
  color: var(--accent);
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
  transition: background var(--duration-fast) ease;
}

.titlebar-btn:hover {
  background: var(--bg-hover);
}

.close-btn:hover {
  background: #c42b1c;
  color: #ffffff;
}
</style>
