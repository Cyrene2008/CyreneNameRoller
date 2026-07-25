<template>
  <div class="fluent-tabs" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      class="fluent-tab"
      :class="{ active: modelValue === option.value }"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      @click="$emit('update:modelValue', option.value)"
    >
      <FluentIcon v-if="option.icon" :icon="option.icon" :width="16" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup>
import FluentIcon from './FluentIcon.vue'

defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, default: () => [] }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.fluent-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-hover); border: 1px solid var(--border-default); border-radius: var(--radius-md); }
.fluent-tab { position: relative; min-height: 34px; flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 12px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--text-secondary); font: inherit; font-size: 13px; cursor: pointer; transition: color var(--duration-normal) var(--ease-standard), background var(--duration-normal) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
.fluent-tab::before { content: ''; position: absolute; left: 4px; top: 8px; bottom: 8px; width: 3px; border-radius: 2px; background: var(--accent); transform: scaleY(0); transform-origin: center; transition: transform var(--duration-normal) var(--ease-standard); }
.fluent-tab:hover { background: var(--bg-card); color: var(--text-primary); }
.fluent-tab:active { transform: scale(0.98); }
.fluent-tab.active { background: var(--bg-card-solid); color: var(--text-primary); box-shadow: var(--shadow-2); }
.fluent-tab.active::before { transform: scaleY(1); }
</style>
