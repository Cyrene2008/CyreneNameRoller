<template>
  <button v-if="show" class="fullscreen-btn" @click="toggle" :title="isFullscreen ? '退出全屏' : '全屏'">
    <Icon :icon="isFullscreen ? 'fluent:full-screen-maximize-24-regular' : 'fluent:full-screen-minimize-24-regular'" :width="16" />
  </button>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { isTauri } from '../utils/tauriAPI'

const show = computed(() => !isTauri() && !window.electronAPI)
const isFullscreen = ref(false)

function toggle() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

function onChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => document.addEventListener('fullscreenchange', onChange))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onChange))
</script>

<style scoped>
.fullscreen-btn {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 99999;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.fullscreen-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
