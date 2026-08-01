<template>
  <div class="plugin-page-view">
    <div v-if="page && plugin" class="plugin-page-shell">
      <div class="plugin-page-header">
        <div>
          <h1>{{ page.title }}</h1>
          <p>{{ plugin.manifest.name }} · v{{ plugin.manifest.version }}</p>
        </div>
        <FluentButton variant="subtle" size="sm" @click="router.push('/plugins')">
          <FluentIcon icon="arrow-left-16-regular" :width="14" />
          {{ lang === 'en' ? 'Back' : '返回插件管理' }}
        </FluentButton>
      </div>

      <div v-if="page.native?.type === 'settings'" class="native-page">
        <div v-if="loading" class="page-status">
          <FluentIcon icon="spinner-ios-20-regular" :width="20" />
          {{ lang === 'en' ? 'Loading plugin settings…' : '正在加载插件设置…' }}
        </div>
        <div v-else-if="pageError" class="page-status error">
          <FluentIcon icon="warning-20-regular" :width="20" />{{ pageError }}
        </div>
        <section v-else class="settings-card">
          <div class="settings-intro">
            <div class="settings-icon"><FluentIcon :icon="page.icon || 'settings-24-regular'" :width="25" /></div>
            <div>
              <h2>{{ page.title }}</h2>
              <p>{{ page.description || plugin.manifest.description }}</p>
            </div>
          </div>

          <div class="settings-list">
            <div v-for="control in page.native.controls" :key="control.id" class="setting-row" :class="`control-${control.type}`">
              <div class="setting-copy">
                <strong>{{ control.label }}</strong>
                <span v-if="control.description">{{ control.description }}</span>
                <span v-if="control.type === 'audio'" class="file-name">{{ valueAt(control.path)?.name || (lang === 'en' ? 'No audio selected' : '尚未选择音频') }}</span>
              </div>

              <FluentToggle
                v-if="control.type === 'toggle'"
                :model-value="!!valueAt(control.path)"
                @update:model-value="updateValue(control, $event)"
              />

              <div v-else-if="control.type === 'range'" class="range-control">
                <input
                  type="range"
                  :min="control.min"
                  :max="control.max"
                  :step="control.step"
                  :value="valueAt(control.path)"
                  @input="previewRange(control, $event)"
                  @change="commitRange(control, $event)"
                />
                <output>{{ rangeLabel(control) }}</output>
              </div>

              <FluentSelect
                v-else-if="control.type === 'select'"
                :model-value="valueAt(control.path)"
                :options="control.options"
                width="220px"
                @update:model-value="updateValue(control, $event)"
              />

              <div v-else-if="control.type === 'audio'" class="audio-actions">
                <FluentButton v-if="valueAt(control.path)?.dataUrl" variant="subtle" size="sm" @click="previewAudio(control)">
                  <FluentIcon icon="play-16-regular" :width="14" />{{ lang === 'en' ? 'Preview' : '试听' }}
                </FluentButton>
                <FluentButton variant="secondary" size="sm" @click="chooseAudio(control)">
                  <FluentIcon icon="folder-open-16-regular" :width="14" />{{ valueAt(control.path) ? (lang === 'en' ? 'Replace' : '更换') : (lang === 'en' ? 'Choose audio' : '选择音频') }}
                </FluentButton>
                <FluentButton v-if="valueAt(control.path)" variant="subtle" size="sm" icon-only @click="clearAudio(control)">
                  <FluentIcon icon="delete-16-regular" :width="14" />
                </FluentButton>
              </div>
            </div>
          </div>
          <div class="storage-note"><FluentIcon icon="lock-closed-16-regular" :width="14" />{{ lang === 'en' ? 'Audio and settings are stored only in this browser or app.' : '音频与设置仅保存在当前浏览器或客户端的插件数据中。' }}</div>
        </section>
      </div>

      <div v-else class="plugin-frame-shell">
        <div v-if="loading" class="page-status"><FluentIcon icon="spinner-ios-20-regular" :width="20" />{{ lang === 'en' ? 'Loading plugin page…' : '正在加载插件页面…' }}</div>
        <div v-else-if="pageError" class="page-status error"><FluentIcon icon="warning-20-regular" :width="20" />{{ pageError }}</div>
        <iframe v-show="!loading && !pageError" ref="frameRef" class="plugin-frame" sandbox="allow-scripts" :srcdoc="source" @load="onFrameLoad"></iframe>
      </div>
    </div>
    <div v-else class="empty-state"><FluentIcon icon="warning-16-regular" :width="18" />{{ lang === 'en' ? 'Plugin page is unavailable.' : '插件页面不可用。' }}</div>
  </div>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { usePluginsStore } from '../plugins/store'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentToggle from '../components/FluentToggle.vue'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const plugins = usePluginsStore()
const showBanner = inject('banner')
const lang = computed(() => settingsStore.settings.language)
const frameRef = ref(null)
const source = ref('')
const loading = ref(true)
const pageError = ref('')
const values = reactive({})
const plugin = computed(() => plugins.pluginById(route.params.pluginId))
const page = computed(() => plugins.pageById(route.params.pluginId, route.params.pageId))

function valueAt(path) { return values[path] }
function defaultsFor(nativePage) {
  return Object.fromEntries((nativePage?.controls || []).map(control => [control.path, control.default ?? (control.type === 'toggle' ? false : '')]))
}
async function saveValues() {
  await plugins.requestPlugin(route.params.pluginId, 'storage.write', { key: page.value.native.settingsKey, value: { ...values } })
}
function notify(message, type = 'info') {
  showBanner?.({
    message,
    type,
    icon: type === 'success' ? 'checkmark-circle-16-regular' : type === 'warning' ? 'warning-16-regular' : 'info-16-regular',
    duration: 4500,
    dismissible: true
  })
}
async function updateValue(control, value) {
  values[control.path] = value
  try { await saveValues() } catch (error) { notify(error.message || String(error), 'warning') }
}
function previewRange(control, event) { values[control.path] = Number(event.target.value) }
async function commitRange(control, event) { await updateValue(control, Number(event.target.value)) }
function rangeLabel(control) {
  const value = Number(valueAt(control.path))
  return control.min === 0 && control.max === 1 ? `${Math.round(value * 100)}%` : String(value)
}
async function chooseAudio(control) {
  try {
    const selected = await plugins.requestPlugin(route.params.pluginId, 'audio.select', { accept: control.accept })
    if (!selected) return
    values[control.path] = selected
    await saveValues()
    notify(
      lang.value === 'en' ? `Selected ${selected.name}. Use Preview to test it.` : `已选择 ${selected.name}，可点击“试听”进行测试。`,
      'success'
    )
  } catch (error) { notify(error.message || String(error), 'warning') }
}
async function previewAudio(control) {
  const audio = valueAt(control.path)
  if (!audio?.dataUrl) return
  try {
    const played = await plugins.requestPlugin(route.params.pluginId, 'audio.play', { source: audio.dataUrl, volume: Number(values.volume ?? 1) })
    if (!played) throw new Error(lang.value === 'en' ? 'The browser blocked audio playback.' : '浏览器阻止了音频播放，请再次点击试听。')
  } catch (error) { notify(error.message || String(error), 'warning') }
}
async function clearAudio(control) { await updateValue(control, null) }

async function mountPluginPage() {
  await nextTick()
  plugins.unmountPageFrame(route.params.pluginId, route.params.pageId)
  loading.value = true
  pageError.value = ''
  source.value = ''
  Object.keys(values).forEach(key => delete values[key])
  if (!page.value || !plugin.value) { loading.value = false; return }
  try {
    if (page.value.native?.type === 'settings') {
      const defaults = defaultsFor(page.value.native)
      const saved = await plugins.requestPlugin(route.params.pluginId, 'storage.read', { key: page.value.native.settingsKey })
      Object.assign(values, defaults, saved || {})
      loading.value = false
      return
    }
    if (!frameRef.value) throw new Error(lang.value === 'en' ? 'Plugin frame is unavailable.' : '插件页面容器不可用。')
    plugins.mountPageFrame(frameRef.value, route.params.pluginId, route.params.pageId)
    source.value = plugins.pluginPageSource(route.params.pluginId, route.params.pageId)
    if (!source.value) throw new Error(lang.value === 'en' ? 'The plugin page has no compatible entry.' : '插件页面没有适用于当前平台的入口。')
  } catch (error) { plugins.unmountPageFrame(route.params.pluginId, route.params.pageId); loading.value = false; pageError.value = error.message || String(error) }
}
function onFrameLoad() { loading.value = false }
watch([plugin, page], mountPluginPage, { flush: 'post' })
onMounted(async () => { await plugins.initialize(); await mountPluginPage() })
onBeforeUnmount(() => plugins.unmountPageFrame(route.params.pluginId, route.params.pageId))
</script>

<style scoped>
.plugin-page-view { height: 100%; padding: 28px 32px 32px; overflow: auto; }
.plugin-page-shell { min-height: 100%; display: flex; flex-direction: column; gap: 22px; }
.plugin-page-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.plugin-page-header h1 { margin: 0; color: var(--text-primary); font-size: 26px; }
.plugin-page-header p { margin: 6px 0 0; color: var(--text-muted); font-size: 12px; }
.native-page { flex: 1; min-height: 0; }
.settings-card { max-width: 980px; margin: 0 auto; border: 1px solid var(--border-default); border-radius: var(--radius-lg); background: var(--bg-card); box-shadow: var(--shadow-2); overflow: hidden; }
.settings-intro { display: flex; align-items: center; gap: 14px; padding: 22px 24px; border-bottom: 1px solid var(--border-subtle); background: linear-gradient(135deg, var(--accent-50), transparent 68%); }
.settings-icon { width: 46px; height: 46px; border-radius: var(--radius-md); display: grid; place-items: center; color: var(--accent); background: var(--bg-card-solid); border: 1px solid var(--border-default); box-shadow: var(--shadow-2); }
.settings-intro h2 { margin: 0; color: var(--text-primary); font-size: 18px; }
.settings-intro p { margin: 5px 0 0; color: var(--text-secondary); font-size: 13px; }
.settings-list { padding: 4px 24px; }
.setting-row { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid var(--border-subtle); }
.setting-row:last-child { border-bottom: 0; }
.setting-copy { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.setting-copy strong { color: var(--text-primary); font-size: 14px; font-weight: 600; }
.setting-copy span { color: var(--text-muted); font-size: 12px; line-height: 1.45; }
.setting-copy .file-name { color: var(--accent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 520px; }
.range-control { min-width: 360px; display: flex; align-items: center; gap: 14px; }
.range-control input { flex: 1; accent-color: var(--accent); cursor: pointer; }
.range-control output { width: 42px; color: var(--text-primary); text-align: right; font-size: 13px; font-variant-numeric: tabular-nums; }
.audio-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-shrink: 0; }
.storage-note { display: flex; align-items: center; gap: 7px; padding: 12px 24px; color: var(--text-muted); background: var(--bg-hover); border-top: 1px solid var(--border-subtle); font-size: 11px; }
.plugin-frame-shell { flex: 1; min-height: 420px; display: flex; border: 1px solid var(--border-default); border-radius: var(--radius-lg); background: var(--bg-card-solid); overflow: hidden; }
.plugin-frame { flex: 1; width: 100%; min-height: 0; border: 0; background: var(--bg-card-solid); }
.page-status, .empty-state { flex: 1; min-height: 240px; display: flex; align-items: center; justify-content: center; gap: 9px; color: var(--text-muted); }
.page-status.error { color: var(--danger); }
@media (max-width: 760px) { .plugin-page-view { padding: 20px 14px; } .plugin-page-header { align-items: flex-start; } .setting-row { align-items: flex-start; flex-direction: column; gap: 12px; padding: 16px 0; } .range-control { width: 100%; min-width: 0; } .audio-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; } }
</style>
