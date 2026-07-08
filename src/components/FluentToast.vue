<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="fluent-toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="fluent-toast">
        <div class="toast-icon">
          <FluentIcon icon="info-16-regular" :width="16" />
        </div>
        <div class="toast-body">
          <p class="toast-title">{{ toast.title }}</p>
          <p v-if="toast.message" class="toast-msg">{{ toast.message }}</p>
        </div>
        <div class="toast-actions">
          <button v-if="toast.action" class="toast-action-btn" @click="toast.action.fn(); remove(toast.id)">
            {{ toast.action.label }}
          </button>
          <button class="toast-close" @click="remove(toast.id)">
            <FluentIcon icon="dismiss-16-regular" :width="14" />
          </button>
        </div>
        <div class="toast-timer" :style="{ animationDuration: (toast.duration || 10000) + 'ms' }" />
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import FluentIcon from './FluentIcon.vue'

const toasts = ref([])
let nextId = 0

function add({ title, message, duration = 10000, action }) {
  const id = nextId++
  toasts.value.push({ id, title, message, duration, action })
  if (duration > 0) {
    setTimeout(() => remove(id), duration)
  }
  return id
}

function remove(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

defineExpose({ add, remove })
</script>

<style scoped>
.fluent-toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  pointer-events: none;
}

.fluent-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card-solid);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-8);
  min-width: 300px;
  max-width: 420px;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
}

.toast-icon { flex-shrink: 0; color: var(--accent); }
.toast-body { flex: 1; min-width: 0; }
.toast-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.toast-msg { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.toast-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.toast-action-btn {
  padding: 4px 12px; background: var(--accent); color: #fff; border: none;
  border-radius: var(--radius-sm); font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: var(--font-ui); transition: background 0.15s;
}
.toast-action-btn:hover { background: var(--accent-dark); }
.toast-close {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--text-muted); cursor: pointer;
  border-radius: var(--radius-sm); transition: background 0.15s;
}
.toast-close:hover { background: var(--bg-hover); }

.toast-timer {
  position: absolute; bottom: 0; left: 0; height: 2px;
  background: var(--accent); animation: timer-shrink linear forwards;
}
@keyframes timer-shrink { from { width: 100%; } to { width: 0%; } }

.toast-enter-active { animation: toast-in 0.3s cubic-bezier(0.1, 0.9, 0.2, 1); }
.toast-leave-active { animation: toast-in 0.2s ease-in reverse; }
@keyframes toast-in { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
</style>
