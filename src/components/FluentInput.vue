<template>
  <div class="fluent-input-wrapper" :class="{ focused, disabled }">
    <span v-if="$slots.prefix" class="input-prefix">
      <slot name="prefix" />
    </span>
    <input
      ref="inputRef"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      class="fluent-input"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focused = true"
      @blur="focused = false"
      @keydown.enter="$emit('enter')"
    />
    <span v-if="$slots.suffix" class="input-suffix">
      <slot name="suffix" />
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  step: { type: [Number, String], default: undefined }
})

defineEmits(['update:modelValue', 'enter'])

const focused = ref(false)
const inputRef = ref(null)

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.fluent-input-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) ease;
  min-height: 32px;
}

.fluent-input-wrapper:hover {
  border-color: var(--text-muted);
}

.fluent-input-wrapper.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.fluent-input-wrapper.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fluent-input {
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  width: 100%;
}

.fluent-input::placeholder {
  color: var(--text-muted);
}

.fluent-input:disabled {
  cursor: not-allowed;
}

.input-prefix,
.input-suffix {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
