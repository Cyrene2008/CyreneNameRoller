<template>
  <div :class="['fluent-card', { hoverable, padding: true }]" @click="$emit('click', $event)">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  hoverable: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.fluent-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-4);
  transition: all var(--duration-normal) var(--ease-standard);
}

.fluent-card.padding {
  padding: 20px;
}

.fluent-card.hoverable:hover {
  box-shadow: var(--shadow-8);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.fluent-card.hoverable:active {
  transform: translateY(0);
  box-shadow: var(--shadow-4);
}
</style>
