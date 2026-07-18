<template>
  <div class="fluent-select-wrapper" ref="wrapperRef">
    <button
      class="fluent-select"
      :class="{ open, disabled }"
      :style="width ? { width, minWidth: width } : null"
      @click="toggle"
      :disabled="disabled"
      ref="btnRef"
    >
      <span class="select-value">{{ displayValue }}</span>
      <FluentIcon icon="chevron-down-16-regular" :width="16" class="select-chevron" />
    </button>
    <Teleport to="body">
      <Transition name="dropdown">
        <div v-if="open" class="fluent-select-dropdown" :style="dropdownStyle">
          <button
            v-for="opt in options"
            :key="opt.value"
            class="select-option"
            :class="{ selected: opt.value === modelValue }"
            @click="select(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import FluentIcon from './FluentIcon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  disabled: { type: Boolean, default: false },
  width: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const wrapperRef = ref(null)
const btnRef = ref(null)
const dropdownStyle = ref({})

const displayValue = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue)
  return found ? found.label : props.placeholder
})

function updateDropdownPos() {
  if (!btnRef.value) return
  const rect = btnRef.value.getBoundingClientRect()
  const estItem = 34
  const estH = Math.min(260, Math.max(estItem, props.options.length * estItem + 10))
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  let style
  if (spaceBelow < estH && spaceAbove > spaceBelow) {
    const h = Math.min(estH, spaceAbove - 8)
    const top = Math.max(4, rect.top - h - 4)
    style = {
      position: 'fixed',
      top: `${top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${h}px`,
      zIndex: 99999
    }
  } else {
    style = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(estH, spaceBelow - 8)}px`,
      zIndex: 99999
    }
  }
  dropdownStyle.value = style
}

function toggle() {
  if (props.disabled) return
  if (!open.value) {
    updateDropdownPos()
    open.value = true
  } else {
    open.value = false
  }
}

function select(value) {
  emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    open.value = false
  }
}

function onScroll() {
  if (open.value) updateDropdownPos()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('scroll', onScroll, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('scroll', onScroll, true)
})
</script>

<style scoped>
.fluent-select-wrapper {
  display: inline-block;
}

.fluent-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 160px;
  padding: 5px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}

.fluent-select:hover {
  border-color: var(--text-muted);
  background: var(--bg-hover);
}

.fluent-select.open {
  border-color: var(--accent);
}

.fluent-select.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-value {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-chevron {
  color: var(--text-muted);
  transition: transform var(--duration-fast) ease;
  flex-shrink: 0;
}

.fluent-select.open .select-chevron {
  transform: rotate(180deg);
}

.dropdown-enter-active {
  transition: all var(--duration-fast) var(--ease-standard);
}

.dropdown-leave-active {
  transition: all var(--duration-fast) ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>

<style>
.fluent-select-dropdown {
  background: var(--bg-card-solid);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-8);
  padding: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.select-option {
  display: block;
  width: 100%;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: background var(--duration-fast) ease;
}

.select-option:hover {
  background: var(--bg-hover);
}

.select-option.selected {
  background: var(--accent-50);
  color: var(--accent);
}

.dark .select-option.selected {
  background: rgba(234, 94, 193, 0.12);
}
</style>
