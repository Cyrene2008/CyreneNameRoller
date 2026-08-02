<template>
  <div v-if="surfaces.length" class="plugin-visual-layers" aria-hidden="true">
    <PluginVisualSurface v-for="surface in surfaces" :key="`${surface.pluginId}:${surface.id}`" :surface="surface" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePluginsStore } from '../../plugins/store'
import PluginVisualSurface from './PluginVisualSurface.vue'

const plugins = usePluginsStore()
const surfaces = computed(() => plugins.contributedVisualSurfaces.filter(surface => surface.placement === 'background'))
</script>

<style scoped>
.plugin-visual-layers { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; contain: strict; }
</style>
