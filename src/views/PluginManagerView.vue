<template>
  <div class="plugins-view">
    <div class="page-header">
      <div>
        <h1 class="page-title"><FluentIcon icon="fluent:plug-connected-24-regular" :width="28" />{{ lang === 'en' ? 'Plugins' : '插件' }}</h1>
        <p class="page-subtitle">{{ lang === 'en' ? 'Extend CyreneNameRoller with optional, permissioned modules.' : '安装可选功能模块，插件始终通过权限化接口访问程序能力。' }}</p>
      </div>
      <div class="header-actions">
        <FluentSelect :model-value="plugins.source" :options="sourceOptions" width="170px" @update:model-value="changeSource" />
        <FluentButton variant="secondary" size="sm" @click="importLocal"><FluentIcon icon="arrow-upload-16-regular" :width="14" />{{ lang === 'en' ? 'Import .cnrp' : '导入 .cnrp' }}</FluentButton>
        <FluentButton variant="primary" size="sm" @click="refreshList" :disabled="loading"><FluentIcon icon="arrow-sync-16-regular" :width="14" />{{ lang === 'en' ? 'Refresh' : '刷新列表' }}</FluentButton>
      </div>
    </div>

    <div v-if="plugins.recovering" class="recovery-banner"><FluentIcon icon="shield-error-24-regular" :width="20" /><span>{{ lang === 'en' ? 'Plugins were disabled after an unsafe startup. Review and enable them one by one.' : '上次启动插件未能安全完成，已进入纯净模式并禁用插件。请逐个检查后再启用。' }}</span></div>
    <div v-if="plugins.lastError" class="error-banner"><FluentIcon icon="warning-16-regular" :width="16" /><span>{{ plugins.lastError }}</span></div>

    <section class="plugin-section">
      <div class="section-heading"><h2>{{ lang === 'en' ? 'Installed' : '已安装' }}</h2><span>{{ installedPlugins.length }}</span></div>
      <div v-if="installedPlugins.length" class="plugin-grid">
        <article v-for="plugin in installedPlugins" :key="plugin.manifest.id" class="plugin-card installed-card">
          <div class="plugin-card-header">
            <div class="plugin-icon"><img v-if="pluginIcon(plugin)" :src="pluginIcon(plugin)" alt="" /><FluentIcon v-else icon="plug-connected-24-regular" :width="24" /></div>
            <div class="plugin-heading"><h3>{{ plugin.manifest.name }}</h3><small>{{ plugin.manifest.id }} · v{{ plugin.manifest.version }}</small></div>
            <FluentToggle :model-value="plugin.enabled" @update:model-value="togglePlugin(plugin, $event)" />
          </div>
          <p class="plugin-description">{{ plugin.manifest.description || (lang === 'en' ? 'No description.' : '暂无说明。') }}</p>
          <div v-if="!pluginCompatibility(plugin).compatible" class="compatibility-warning"><FluentIcon icon="warning-16-regular" :width="14" /><span>{{ pluginCompatibility(plugin).reason }}</span></div>
          <div v-else-if="pluginCompatibility(plugin).degraded" class="compatibility-warning limited"><FluentIcon icon="info-16-regular" :width="14" /><span>{{ pluginCompatibility(plugin).reason }}</span></div>
          <div class="plugin-meta"><span>{{ lang === 'en' ? 'By' : '开发者' }} {{ plugin.manifest.author }}</span><span>{{ plugin.trusted ? (lang === 'en' ? 'Verified' : '已验证') : (lang === 'en' ? 'Local / unverified' : '本地 / 未验证') }}</span></div>
          <div v-if="pagesFor(plugin).length" class="plugin-pages"><span>{{ lang === 'en' ? 'Pages' : '扩展页面' }}</span><div class="plugin-page-links"><FluentButton v-for="page in pagesFor(plugin)" :key="`${plugin.manifest.id}:${page.id}`" variant="subtle" size="sm" @click="openPluginPage(page)"><FluentIcon icon="open-16-regular" :width="14" />{{ page.title }}</FluentButton></div></div>
          <div class="plugin-actions"><FluentButton variant="subtle" size="sm" @click="openDetails(plugin)">{{ lang === 'en' ? 'Details' : '详情' }}</FluentButton><FluentButton variant="danger" size="sm" @click="removePlugin(plugin)">{{ lang === 'en' ? 'Uninstall' : '卸载' }}</FluentButton></div>
        </article>
      </div>
      <div v-else class="empty-state"><FluentIcon icon="plug-disconnected-24-regular" :width="28" /><span>{{ lang === 'en' ? 'No plugins installed.' : '尚未安装插件。' }}</span></div>
    </section>

    <section class="plugin-section">
      <div class="section-heading"><h2>{{ lang === 'en' ? 'Plugin catalog' : '插件列表' }}</h2><span v-if="listUpdated">{{ listUpdated }}</span></div>
      <div v-if="plugins.list.length" class="plugin-grid">
        <article v-for="item in plugins.list" :key="item.id" class="plugin-card catalog-card">
          <div class="plugin-card-header"><div class="plugin-icon"><img v-if="item.icon" :src="item.icon" alt="" /><FluentIcon v-else icon="plug-connected-24-regular" :width="24" /></div><div class="plugin-heading"><h3>{{ item.name }}</h3><small>{{ item.id }} · v{{ item.version }}</small></div></div>
          <p class="plugin-description">{{ item.description || (lang === 'en' ? 'No description.' : '暂无说明。') }}</p>
          <div class="plugin-meta"><span>{{ lang === 'en' ? 'By' : '开发者' }} {{ item.author || '—' }}</span><span v-if="installedVersion(item.id)">{{ catalogAction(item) }}</span></div>
          <div class="plugin-actions"><FluentButton variant="subtle" size="sm" @click="openCatalogDetails(item)">{{ lang === 'en' ? 'README / Dependencies' : 'README / 依赖' }}</FluentButton><FluentButton variant="primary" size="sm" :disabled="catalogInstallDisabled(item)" @click="installCatalogItem(item)"><FluentIcon icon="arrow-download-16-regular" :width="14" />{{ catalogButtonLabel(item) }}</FluentButton></div>
        </article>
      </div>
      <div v-else class="empty-state"><FluentIcon icon="cloud-off-24-regular" :width="28" /><span>{{ loading ? (lang === 'en' ? 'Loading catalog...' : '正在获取插件列表…') : (lang === 'en' ? 'Catalog unavailable. You can still import a local .cnrp.' : '暂时无法获取插件列表，也可以导入本地 .cnrp。') }}</span></div>
    </section>

    <FluentModal v-model="showDetails" :title="detailsTitle" max-width="720px">
      <div class="details-body"><div class="readme" v-html="detailsReadmeHtml"></div><div v-if="detailsCapabilities.length" class="dependency-block"><h3>{{ lang === 'en' ? 'Platform capabilities' : '平台能力' }}</h3><div v-for="capability in detailsCapabilities" :key="capability.id" class="dependency-item capability-item"><strong>{{ capability.label }}</strong><span>{{ capability.required ? (lang === 'en' ? 'Required' : '必需') : (lang === 'en' ? 'Optional' : '可选') }}</span><small :class="{ unavailable: !capability.available }">{{ capability.available ? (lang === 'en' ? 'Available here' : '当前可用') : (lang === 'en' ? 'Unavailable here; safely skipped' : '当前不可用，将安全跳过') }}</small></div></div><div v-if="detailsOperations.length" class="dependency-block"><h3>{{ lang === 'en' ? 'Declared system operations' : '声明的系统操作' }}</h3><div v-for="operation in detailsOperations" :key="operation.id" class="operation-item"><strong>{{ operation.label }}</strong><code>{{ operation.command.program }} {{ (operation.command.args || []).join(' ') }}</code><small>{{ (operation.platforms || []).join(' / ') }}</small></div></div><div v-if="detailsPermissions.length" class="dependency-block"><h3>{{ lang === 'en' ? 'Permissions' : '权限' }}</h3><div v-for="permission in detailsPermissions" :key="permission" class="dependency-item"><strong>{{ permission }}</strong></div></div><div v-if="detailsDependencies.length" class="dependency-block"><h3>{{ lang === 'en' ? 'Dependencies' : '依赖插件' }}</h3><div v-for="dependency in detailsDependencies" :key="dependency.id" class="dependency-item"><strong>{{ dependency.id }}</strong><span>{{ dependency.range || dependency.version || '*' }}</span><small v-if="dependency.dataAccess">{{ lang === 'en' ? 'May access shared data' : '可能访问前置插件共享数据' }}</small></div></div></div>
    </FluentModal>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { usePluginsStore } from '../plugins/store'
import { PLUGIN_DOWNLOAD_SOURCES } from '../plugins/constants'
import FluentIcon from '../components/FluentIcon.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentModal from '../components/FluentModal.vue'

const settingsStore = useSettingsStore()
const router = useRouter()
const plugins = usePluginsStore()
const showBanner = inject('banner')
const lang = computed(() => settingsStore.settings.language)
const sourceOptions = PLUGIN_DOWNLOAD_SOURCES
const loading = ref(false)
const downloading = ref('')
const listUpdated = ref('')
const showDetails = ref(false)
const detailsTitle = ref('')
const detailsReadmeHtml = ref('')
const detailsDependencies = ref([])
const detailsPermissions = ref([])
const detailsCapabilities = ref([])
const detailsOperations = ref([])
const installedPlugins = computed(() => Object.values(plugins.installed))
const contributedPages = computed(() => plugins.contributedPages)

function installedVersion(id) { return plugins.installed[id]?.manifest?.version || '' }
function compareVersion(left, right) {
  const a = String(left || '0').split('.').map(value => Number(value) || 0)
  const b = String(right || '0').split('.').map(value => Number(value) || 0)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0)
    if (difference) return Math.sign(difference)
  }
  return 0
}
function catalogAction(item) {
  const installed = installedVersion(item.id)
  if (!installed) return ''
  return compareVersion(item.version, installed) > 0 ? `${lang.value === 'en' ? 'Update available' : '可更新'} · v${installed}` : `v${installed}`
}
function catalogInstallDisabled(item) { return downloading.value === item.id || (!!installedVersion(item.id) && compareVersion(item.version, installedVersion(item.id)) <= 0) }
function catalogButtonLabel(item) {
  if (downloading.value === item.id) return '...'
  const installed = installedVersion(item.id)
  if (!installed) return lang.value === 'en' ? 'Install' : '安装'
  if (compareVersion(item.version, installed) > 0) return lang.value === 'en' ? 'Update' : '更新'
  return lang.value === 'en' ? 'Installed' : '已安装'
}
function pagesFor(plugin) { return contributedPages.value.filter(page => page.pluginId === plugin.manifest.id) }
function pluginIcon(plugin) { return plugins.pluginAssetUrl(plugin) || plugin.manifest.iconDataUrl || '' }
function pluginCompatibility(plugin) { return plugins.compatibilityFor(plugin) }
function capabilityDetails(manifest = {}) {
  return Object.entries(manifest.capabilities || {}).map(([id, declaration]) => ({
    id,
    label: plugins.platformCapabilities[id]?.label || id,
    required: !!declaration.required,
    available: plugins.platformCapabilities[id]?.available === true
  }))
}
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])) }
function markdownToHtml(markdown) { return escapeHtml(markdown).replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n- (.+)/g, '<br>• $1').replace(/\n/g, '<br>') }
async function refreshList() { loading.value = true; try { await plugins.fetchList(); listUpdated.value = new Date().toLocaleTimeString() } catch (error) { showBanner({ message: error.message, icon: 'warning-16-regular', type: 'warning', duration: 8000 }) } finally { loading.value = false } }
async function changeSource(value) { await plugins.setSource(value); await refreshList() }
async function togglePlugin(plugin, enabled) { try { await plugins.setEnabled(plugin.manifest.id, enabled) } catch (error) { showBanner({ message: error.message, icon: 'warning-16-regular', type: 'warning', duration: 8000 }); plugin.enabled = false } }
async function removePlugin(plugin) { if (!window.confirm(lang.value === 'en' ? `Uninstall ${plugin.manifest.name}?` : `确定卸载「${plugin.manifest.name}」？`)) return; try { await plugins.uninstall(plugin.manifest.id) } catch (error) { showBanner({ message: error.message, icon: 'warning-16-regular', type: 'warning', duration: 8000 }) } }
function confirmPluginInstall(manifest) {
  const permissions = manifest.permissions?.length ? manifest.permissions.join('\n• ') : (lang.value === 'en' ? 'None' : '无')
  const dependencies = manifest.dependencies?.length ? manifest.dependencies.map(item => `${item.id} ${item.range || item.version || '*'}`).join('\n• ') : (lang.value === 'en' ? 'None' : '无')
  const capabilities = capabilityDetails(manifest)
  const capabilityText = capabilities.length ? capabilities.map(item => `${item.label}：${item.required ? (lang.value === 'en' ? 'required' : '必需') : (lang.value === 'en' ? 'optional' : '可选')} / ${item.available ? (lang.value === 'en' ? 'available' : '当前可用') : (lang.value === 'en' ? 'unavailable, will be skipped' : '当前不可用，将安全跳过')}`).join('\n• ') : (lang.value === 'en' ? 'None' : '无')
  const operations = manifest.systemOperations?.length ? manifest.systemOperations.map(item => `${item.label}\n  ${item.command.program} ${(item.command.args || []).join(' ')}`).join('\n• ') : (lang.value === 'en' ? 'None' : '无')
  const compatibility = plugins.compatibilityFor(manifest)
  return window.confirm(lang.value === 'en'
    ? `Install ${manifest.name} v${manifest.version}?\n\nPlatform: ${plugins.platform.runtime}/${plugins.platform.os}\nCompatibility: ${compatibility.compatible ? 'compatible' : compatibility.reason}\n\nCapabilities:\n• ${capabilityText}\n\nFixed system operations:\n• ${operations}\n\nPermissions:\n• ${permissions}\n\nDependencies:\n• ${dependencies}`
    : `安装「${manifest.name}」v${manifest.version}？\n\n当前平台：${plugins.platform.runtime}/${plugins.platform.os}\n兼容性：${compatibility.compatible ? '兼容' : compatibility.reason}\n\n平台能力：\n• ${capabilityText}\n\n固定系统操作（将按以下原样执行，插件运行时不可修改）：\n• ${operations}\n\n所需权限：\n• ${permissions}\n\n依赖插件：\n• ${dependencies}`)
}
async function installCatalogItem(item) { downloading.value = item.id; try { await plugins.downloadPlugin(item, [], confirmPluginInstall); showBanner({ message: `${lang.value === 'en' ? 'Installed' : '已安装'}：${item.name}`, icon: 'checkmark-circle-16-regular', type: 'success', duration: 5000 }) } catch (error) { if (!/取消|cancel/i.test(error.message)) showBanner({ message: error.message, icon: 'warning-16-regular', type: 'warning', duration: 8000 }) } finally { downloading.value = '' } }
async function importLocal() { const input = document.createElement('input'); input.type = 'file'; input.accept = '.cnrp,application/octet-stream'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; try { const bytes = new Uint8Array(await file.arrayBuffer()); const inspected = await plugins.inspectPackage(bytes); if (!confirmPluginInstall(inspected.manifest)) return; const installed = await plugins.installPackage(bytes, { origin: 'local' }); showBanner({ message: `${lang.value === 'en' ? 'Installed' : '已安装'}：${installed.manifest.name}`, icon: 'checkmark-circle-16-regular', type: 'success', duration: 5000 }) } catch (error) { showBanner({ message: error.message, icon: 'warning-16-regular', type: 'warning', duration: 8000 }) } }; input.click() }
function openDetails(plugin) { detailsTitle.value = `${plugin.manifest.name} v${plugin.manifest.version}`; detailsReadmeHtml.value = markdownToHtml(plugin.readme); detailsDependencies.value = plugin.manifest.dependencies || []; detailsPermissions.value = plugin.manifest.permissions || []; detailsCapabilities.value = capabilityDetails(plugin.manifest); detailsOperations.value = plugin.manifest.systemOperations || []; showDetails.value = true }
async function openCatalogDetails(item) { detailsTitle.value = item.name; detailsReadmeHtml.value = markdownToHtml(lang.value === 'en' ? 'Loading README…' : '正在获取 README…'); detailsDependencies.value = item.dependencies || []; detailsPermissions.value = item.permissions || []; detailsCapabilities.value = capabilityDetails(item); detailsOperations.value = item.systemOperations || []; showDetails.value = true; try { const details = await plugins.loadCatalogDetails(item); Object.assign(item, details); detailsTitle.value = `${details.name || item.name} v${details.version || item.version}`; detailsReadmeHtml.value = markdownToHtml(details.readme || details.readmeContent || (lang.value === 'en' ? 'README is not available.' : 'README 暂未提供。')); detailsDependencies.value = details.dependencies || []; detailsPermissions.value = details.permissions || []; detailsCapabilities.value = capabilityDetails(details); detailsOperations.value = details.systemOperations || [] } catch (error) { detailsReadmeHtml.value = markdownToHtml(error.message || String(error)) } }
function openPluginPage(page) { router.push(`/plugin/${encodeURIComponent(page.pluginId)}/${encodeURIComponent(page.id)}`) }
onMounted(async () => { await plugins.initialize(); plugins.setBannerHandler(showBanner); await refreshList() })
</script>

<style scoped>
.plugins-view { padding: 32px; max-width: 1180px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 26px; }
.page-title { margin: 0; display: flex; align-items: center; gap: 10px; color: var(--text-primary); font-size: 26px; }
.page-subtitle { margin: 8px 0 0; color: var(--text-muted); font-size: 13px; }
.header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.recovery-banner, .error-banner { display: flex; align-items: center; gap: 9px; border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border-default)); background: var(--accent-50); color: var(--text-primary); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 12px; font-size: 13px; }
.error-banner { border-color: color-mix(in srgb, var(--danger) 45%, var(--border-default)); color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--bg-card)); }
.plugin-section { margin-top: 24px; }
.section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.section-heading h2 { margin: 0; font-size: 17px; color: var(--text-primary); }
.section-heading span { color: var(--text-muted); font-size: 12px; }
.plugin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.plugin-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--border-default); border-radius: var(--radius-lg); background: var(--bg-card); box-shadow: var(--shadow-2); }
.plugin-card-header { display: flex; align-items: center; gap: 10px; }
.plugin-icon { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 10px; display: grid; place-items: center; color: var(--accent); background: var(--accent-50); overflow: hidden; }
.plugin-icon img { width: 100%; height: 100%; object-fit: cover; }
.plugin-heading { min-width: 0; flex: 1; }
.plugin-heading h3 { margin: 0; color: var(--text-primary); font-size: 15px; }
.plugin-heading small { display: block; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-muted); font-size: 11px; font-family: Consolas, monospace; }
.plugin-description { min-height: 38px; margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.55; }
.compatibility-warning { display: flex; align-items: flex-start; gap: 7px; padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--warning) 40%, var(--border-default)); border-radius: var(--radius-sm); color: var(--warning); background: color-mix(in srgb, var(--warning) 8%, var(--bg-card)); font-size: 11px; line-height: 1.45; }
.compatibility-warning.limited { border-color: color-mix(in srgb, var(--accent) 30%, var(--border-default)); color: var(--text-secondary); background: color-mix(in srgb, var(--accent) 6%, var(--bg-card)); }
.plugin-meta { display: flex; justify-content: space-between; gap: 8px; color: var(--text-muted); font-size: 11px; }
.plugin-pages { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 11px; }
.plugin-page-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.plugin-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: auto; }
.empty-state { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 120px; color: var(--text-muted); border: 1px dashed var(--border-default); border-radius: var(--radius-md); }
.details-body { max-height: 62vh; overflow-y: auto; color: var(--text-secondary); line-height: 1.65; font-size: 13px; }
.readme :deep(h1), .readme :deep(h2), .readme :deep(h3) { color: var(--text-primary); margin: 10px 0 6px; }
.readme :deep(code) { padding: 2px 4px; border-radius: 4px; background: var(--bg-hover); font-family: Consolas, monospace; }
.dependency-block { border-top: 1px solid var(--border-default); margin-top: 16px; padding-top: 12px; }
.dependency-block h3 { margin: 0 0 8px; color: var(--text-primary); }
.dependency-item { display: flex; gap: 10px; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--border-subtle); }
.dependency-item span, .dependency-item small { color: var(--text-muted); }
.dependency-item small { margin-left: auto; }
.dependency-item small.unavailable { color: var(--warning); }
.operation-item { display: grid; grid-template-columns: minmax(120px, .7fr) minmax(0, 1.6fr) auto; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle); }
.operation-item code { min-width: 0; overflow-wrap: anywhere; color: var(--text-secondary); font: 11px/1.5 Consolas, monospace; }
.operation-item small { color: var(--text-muted); }
@media (max-width: 760px) { .page-header { flex-direction: column; } .header-actions { justify-content: flex-start; } .plugins-view { padding: 20px 14px; } }
</style>
