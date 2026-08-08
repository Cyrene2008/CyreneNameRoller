<template>
  <div v-if="available" class="plugin-slot" :data-plugin-slot="slot">
    <PluginNativeView v-for="view in views" :key="`${view.pluginId}:${view.id}`" :view="view" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePluginsStore } from '../../plugins/store'
import PluginNativeView from './PluginNativeView.vue'

const props = defineProps({ slot: { type: String, required: true } })
const plugins = usePluginsStore()
const available = computed(() => ['slot:roller.side-panel', 'slot:roller.below-result', 'slot:records.toolbar'].includes(props.slot))
const views = computed(() => available.value ? plugins.nativeViewsForSlot(props.slot) : [])
</script>

<style scoped>
.plugin-slot { display: grid; gap: 10px; }
</style>
