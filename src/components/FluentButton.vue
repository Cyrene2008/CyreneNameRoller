<template>
  <button
    :class="['fluent-btn', variant, size, { icon-only: iconOnly, disabled: disabled }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'subtle', 'danger'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  iconOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.fluent-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) ease;
  white-space: nowrap;
  user-select: none;
  position: relative;
  outline: none;
}

.fluent-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Sizes */
.sm {
  padding: 4px 12px;
  font-size: 12px;
  min-height: 28px;
}

.md {
  padding: 6px 16px;
  font-size: 14px;
  min-height: 32px;
}

.lg {
  padding: 8px 24px;
  font-size: 14px;
  min-height: 40px;
}

.icon-only.sm {
  width: 28px;
  padding: 0;
}

.icon-only.md {
  width: 32px;
  padding: 0;
}

.icon-only.lg {
  width: 40px;
  padding: 0;
}

/* Variants */
.primary {
  background: var(--accent);
  color: var(--text-on-accent);
  box-shadow: var(--shadow-2);
}

.primary:hover {
  background: var(--accent-dark);
  box-shadow: var(--shadow-4);
}

.primary:active {
  background: var(--accent-hover);
  box-shadow: var(--shadow-2);
  transform: scale(0.98);
}

.secondary {
  background: var(--bg-card-solid);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
}

.secondary:hover {
  background: var(--bg-hover);
  border-color: var(--text-muted);
}

.secondary:active {
  background: var(--bg-card);
  transform: scale(0.98);
}

.subtle {
  background: transparent;
  color: var(--text-secondary);
}

.subtle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.subtle:active {
  background: var(--bg-card);
  transform: scale(0.98);
}

.danger {
  background: #c42b1c;
  color: #ffffff;
  box-shadow: var(--shadow-2);
}

.danger:hover {
  background: #a61b10;
}

.danger:active {
  background: #8e1510;
  transform: scale(0.98);
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
