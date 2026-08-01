<template>
  <div class="plugin-page-view"><div v-if="page && plugin" class="plugin-page-shell"><div class="plugin-page-header"><div><h1>{{ page.title }}</h1><p>{{ plugin.manifest.name }} · v{{ plugin.manifest.version }}</p></div><FluentButton variant="subtle" size="sm" @click="router.push('/plugins')"><FluentIcon icon="arrow-left-16-regular" :width="14" />{{ lang === 'en' ? 'Back' : '返回插件管理' }}</FluentButton></div><iframe ref="frameRef" class="plugin-frame" sandbox="allow-scripts" :srcdoc="source"></iframe></div><div v-else class="empty-state"><FluentIcon icon="warning-16-regular" :width="18" />{{ lang === 'en' ? 'Plugin page is unavailable.' : '插件页面不可用。' }}</div></div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { usePluginsStore } from '../plugins/store'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
const route = useRoute(); const router = useRouter(); const settingsStore = useSettingsStore(); const plugins = usePluginsStore(); const lang = computed(() => settingsStore.settings.language); const frameRef = ref(null); const source = ref(''); const plugin = computed(() => plugins.pluginById(route.params.pluginId)); const page = computed(() => plugins.pageById(route.params.pluginId, route.params.pageId));
async function mountPluginPage() { await nextTick(); if (!page.value || !plugin.value || !frameRef.value) return; plugins.unmountPageFrame(route.params.pluginId, route.params.pageId); plugins.mountPageFrame(frameRef.value, route.params.pluginId, route.params.pageId); source.value = plugins.pluginPageSource(route.params.pluginId, route.params.pageId) }
watch([plugin, page], mountPluginPage, { flush: 'post' })
onMounted(async () => { await plugins.initialize(); await mountPluginPage() })
onBeforeUnmount(() => plugins.unmountPageFrame(route.params.pluginId, route.params.pageId))
</script>
<style scoped>
.plugin-page-view { height: 100%; padding: 24px; }.plugin-page-shell { height: 100%; display: flex; flex-direction: column; gap: 14px; }.plugin-page-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; }.plugin-page-header h1 { margin: 0; color: var(--text-primary); font-size: 24px; }.plugin-page-header p { margin: 5px 0 0; color: var(--text-muted); font-size: 12px; }.plugin-frame { flex: 1; width: 100%; min-height: 0; border: 1px solid var(--border-default); border-radius: var(--radius-lg); background: var(--bg-card-solid); }.empty-state { display: grid; place-items: center; min-height: 240px; color: var(--text-muted); }
</style>
