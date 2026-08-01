<template>
  <div class="plugin-page-view"><div v-if="page && plugin" class="plugin-page-shell"><div class="plugin-page-header"><div><h1>{{ page.title }}</h1><p>{{ plugin.manifest.name }} · v{{ plugin.manifest.version }}</p></div><FluentButton variant="subtle" size="sm" @click="router.push('/plugins')"><FluentIcon icon="arrow-left-16-regular" :width="14" />{{ lang === 'en' ? 'Back' : '返回插件管理' }}</FluentButton></div><div class="plugin-frame-shell"><div v-if="loading" class="frame-status"><FluentIcon icon="spinner-ios-20-regular" :width="20" />{{ lang === 'en' ? 'Loading plugin page…' : '正在加载插件页面…' }}</div><div v-else-if="frameError" class="frame-status error"><FluentIcon icon="warning-20-regular" :width="20" />{{ frameError }}</div><iframe v-show="!loading && !frameError" ref="frameRef" class="plugin-frame" sandbox="allow-scripts" :srcdoc="source" @load="onFrameLoad"></iframe></div></div><div v-else class="empty-state"><FluentIcon icon="warning-16-regular" :width="18" />{{ lang === 'en' ? 'Plugin page is unavailable.' : '插件页面不可用。' }}</div></div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { usePluginsStore } from '../plugins/store'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
const route = useRoute(); const router = useRouter(); const settingsStore = useSettingsStore(); const plugins = usePluginsStore(); const lang = computed(() => settingsStore.settings.language); const frameRef = ref(null); const source = ref(''); const loading = ref(true); const frameError = ref(''); const plugin = computed(() => plugins.pluginById(route.params.pluginId)); const page = computed(() => plugins.pageById(route.params.pluginId, route.params.pageId));
async function mountPluginPage() {
  await nextTick()
  plugins.unmountPageFrame(route.params.pluginId, route.params.pageId)
  loading.value = true
  frameError.value = ''
  source.value = ''
  if (!page.value || !plugin.value) {
    loading.value = false
    return
  }
  try {
    // Register the iframe before assigning srcdoc. The page bootstrap can issue
    // its first RPC while the document is still loading, so registering on
    // `load` creates a race and leaves the page blank.
    if (!frameRef.value) throw new Error(lang.value === 'en' ? 'Plugin frame is unavailable.' : '插件页面容器不可用。')
    plugins.mountPageFrame(frameRef.value, route.params.pluginId, route.params.pageId)
    source.value = plugins.pluginPageSource(route.params.pluginId, route.params.pageId)
    if (!source.value) throw new Error(lang.value === 'en' ? 'The plugin page has no compatible entry.' : '插件页面没有适用于当前平台的入口。')
  } catch (error) {
    plugins.unmountPageFrame(route.params.pluginId, route.params.pageId)
    loading.value = false
    frameError.value = error.message || String(error)
  }
}
function onFrameLoad() { loading.value = false }
watch([plugin, page], mountPluginPage, { flush: 'post' })
onMounted(async () => { await plugins.initialize(); await mountPluginPage() })
onBeforeUnmount(() => plugins.unmountPageFrame(route.params.pluginId, route.params.pageId))
</script>
<style scoped>
.plugin-page-view { height: 100%; padding: 24px; }.plugin-page-shell { height: 100%; display: flex; flex-direction: column; gap: 14px; }.plugin-page-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; }.plugin-page-header h1 { margin: 0; color: var(--text-primary); font-size: 24px; }.plugin-page-header p { margin: 5px 0 0; color: var(--text-muted); font-size: 12px; }.plugin-frame-shell { flex: 1; min-height: 0; display: flex; border: 1px solid var(--border-default); border-radius: var(--radius-lg); background: var(--bg-card-solid); overflow: hidden; }.plugin-frame { flex: 1; width: 100%; min-height: 0; border: 0; background: var(--bg-card-solid); }.frame-status { flex: 1; display: flex; align-items: center; justify-content: center; gap: 9px; color: var(--text-muted); }.frame-status.error { color: var(--danger); }.empty-state { display: grid; place-items: center; min-height: 240px; color: var(--text-muted); }
</style>
