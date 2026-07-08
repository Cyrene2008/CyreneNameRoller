<template>
  <Icon :icon="fullIcon" :width="width" :height="height" :class="['fluent-icon', className]" />
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  icon: { type: String, required: true },
  width: { type: [Number, String], default: 20 },
  height: { type: [Number, String], default: undefined },
  className: { type: String, default: '' }
})

const fullIcon = computed(() => {
  if (props.icon.includes(':')) return props.icon
  return `fluent:${props.icon}`
})
</script>

<style scoped>
.fluent-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
