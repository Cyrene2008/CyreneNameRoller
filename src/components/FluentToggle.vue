<template>
  <label class="fluent-toggle" :class="{ checked: modelValue, disabled }">
    <span v-if="label" class="toggle-label">{{ label }}</span>
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="toggle-track">
      <span class="toggle-thumb" />
    </span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.fluent-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.fluent-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fluent-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-track {
  position: relative;
  width: 40px;
  height: 20px;
  background: var(--text-muted);
  border-radius: var(--radius-full);
  transition: background var(--duration-fast) ease;
  flex-shrink: 0;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform var(--duration-fast) var(--ease-standard);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.fluent-toggle.checked .toggle-track {
  background: var(--accent);
}

.fluent-toggle.checked .toggle-thumb {
  transform: translateX(20px);
}

.fluent-toggle:hover .toggle-track {
  opacity: 0.9;
}
</style>
