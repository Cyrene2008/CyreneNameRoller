<template>
  <section class="plugin-native-view" :aria-label="`${lang === 'en' ? 'Provided by plugin' : '由插件提供'}：${view.pluginName}`">
    <div class="plugin-native-source" aria-hidden="false"><FluentIcon icon="plug-connected-16-regular" :width="14" />{{ lang === 'en' ? 'Provided by plugin' : '由插件提供' }}：{{ view.pluginName }}</div>
    <NativeNode :node="view.document.root" />
  </section>
</template>

<script setup>
import { computed, defineComponent, h, ref, resolveComponent } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useNamesStore } from '../../stores/names'
import { useRecordsStore } from '../../stores/records'
import { useStatisticsStore } from '../../stores/statistics'
import { usePluginsStore } from '../../plugins/store'

const props = defineProps({ view: { type: Object, required: true } })
const settingsStore = useSettingsStore()
const namesStore = useNamesStore()
const recordsStore = useRecordsStore()
const statisticsStore = useStatisticsStore()
const plugins = usePluginsStore()
const FluentIconComponent = resolveComponent('FluentIcon')
const lang = computed(() => settingsStore.settings.language)
const localState = ref({})

const ICONS = {
  draw: 'play-24-filled', info: 'info-16-regular', warning: 'warning-16-regular', settings: 'settings-16-regular',
  filter: 'filter-16-regular', history: 'history-16-regular', check: 'checkmark-16-regular', close: 'dismiss-16-regular',
  add: 'add-16-regular', remove: 'subtract-16-regular', refresh: 'arrow-sync-16-regular'
}

function pathValue(path) {
  const source = String(path || '')
  const [namespace, ...parts] = source.split('.')
  let value = namespace === '$state' ? localState.value : namespace === '$storage' ? {} : namespace === '$resource' ? { names: namesStore.nameLists, statistics: { counts: statisticsStore.counts, totalCount: statisticsStore.totalCount }, records: recordsStore.records } : namespace === '$host' ? { theme: { language: lang.value, dark: settingsStore.darkMode } } : {}
  for (const part of parts) value = value?.[part]
  return value
}

function textFor(node, key, fallback = '') {
  const binding = node.bindings?.[key]
  if (binding) return pathValue(binding)
  return node.props?.[key] ?? fallback
}

async function runAction(node) {
  if (!node.action?.command) return
  try { await plugins.invokePluginCommand(props.view.pluginId, node.action.command, node.action.args || {}) } catch (error) { console.warn('[plugins] native view action failed', error) }
}

const NativeNode = defineComponent({
  name: 'PluginNativeNode',
  props: { node: { type: Object, required: true } },
  setup(nodeProps) {
    const value = key => textFor(nodeProps.node, key)
    return () => {
      const node = nodeProps.node
      const children = () => (node.children || []).map((child, index) => h(NativeNode, { key: index, node: child }))
      const common = { class: `plugin-native-node plugin-native-${String(node.type).toLowerCase()}` }
      if (node.type === 'Stack') return h('div', { ...common, style: { gap: node.props.gap === 'comfortable' ? '16px' : node.props.gap === 'compact' ? '6px' : '10px' } }, children())
      if (node.type === 'Grid') return h('div', { ...common, style: { display: 'grid', gap: '10px', gridTemplateColumns: `repeat(${Math.max(1, Number(node.props.columns) || 1)}, minmax(0, 1fr))` } }, children())
      if (node.type === 'Text') return h('p', common, String(value('text') || ''))
      if (node.type === 'Icon') return h(FluentIconComponent, { ...common, icon: ICONS[node.props.icon] || ICONS.info, width: 18 })
      if (node.type === 'Badge' || node.type === 'Notice') return h('div', common, String(value('text') || value('label') || ''))
      if (node.type === 'Button') return h('button', { ...common, type: 'button', onClick: () => runAction(node) }, [node.props.icon ? h(FluentIconComponent, { icon: ICONS[node.props.icon] || ICONS.info, width: 14 }) : null, String(value('label') || '')])
      if (node.type === 'Toggle') return h('label', common, [h('input', { type: 'checkbox', checked: !!localState.value[node.props.path], onChange: event => { localState.value[node.props.path] = event.target.checked } }), String(value('label') || '')])
      if (node.type === 'Select') return h('label', common, [String(value('label') || ''), h('select', { value: localState.value[node.props.path] || '', onChange: event => { localState.value[node.props.path] = event.target.value } }, (node.props.options || []).map(option => h('option', { value: String(option.value) }, String(option.label))))])
      if (node.type === 'Range') return h('label', common, [String(value('label') || ''), h('input', { type: 'range', min: node.props.min, max: node.props.max, step: node.props.step, value: localState.value[node.props.path] ?? node.props.value, onInput: event => { localState.value[node.props.path] = event.target.value } })])
      if (node.type === 'Progress') return h('progress', { ...common, max: Number(node.props.max) || 100, value: Number(value('value')) || 0 })
      if (node.type === 'Divider') return h('hr', common)
      if (node.type === 'List' || node.type === 'Table') return h('div', common, children())
      return h('div', common, children())
    }
  }
})
</script>

<style scoped>
.plugin-native-view { position: relative; display: grid; gap: 10px; padding: 12px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); }
.plugin-native-source { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 11px; }
.plugin-native-node { min-width: 0; }
.plugin-native-text { margin: 0; color: var(--text-secondary); line-height: 1.5; }
.plugin-native-badge, .plugin-native-notice { padding: 8px 10px; border-radius: var(--radius-sm); background: var(--bg-hover); color: var(--text-secondary); }
.plugin-native-button { display: inline-flex; align-items: center; gap: 6px; width: fit-content; min-height: 32px; padding: 6px 10px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: var(--bg-card-solid); color: var(--text-primary); cursor: pointer; }
.plugin-native-button:hover { background: var(--bg-hover); }
.plugin-native-toggle, .plugin-native-select, .plugin-native-range { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); }
.plugin-native-select select { min-width: 120px; }
</style>
