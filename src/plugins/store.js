import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { dataBridge } from '../utils/dataBridge'
import { useNamesStore } from '../stores/names'
import { useRecordsStore } from '../stores/records'
import { useStatisticsStore } from '../stores/statistics'
import { ALGORITHM_NAME, ALGORITHM_VERSION, DEFAULT_CYRENE_BALANCE_SETTINGS, TARGET_GAP, normalizeCyreneBalanceSettings } from '../utils/cyrene-balance'
import { emitPluginEvent } from './eventBus'
import {
  parsePluginPackage,
  satisfiesPluginVersion
} from './package'
import {
  PLUGIN_DOWNLOAD_SOURCES,
  pluginListCandidates,
  pluginSourceCandidates
} from './constants'
import { PluginRuntime } from './runtime'
import { PluginPlatformBridge } from './platform'
import { repositorySlug, resolveCatalogRelease } from './catalog'

const STATE_KEY = 'pluginState'
const PLUGIN_DATA_KEY = 'pluginData'
const SESSION_MARKER_KEY = 'cyrene-plugin-session-pending'
const MAX_AUDIO_FILE_SIZE = 16 * 1024 * 1024
const MAX_PLUGIN_DATA_SIZE = 96 * 1024 * 1024

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

async function fetchFirstSuccessful(urls, options = {}, label = '插件资源') {
  const failures = []
  for (const url of urls) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      failures.push(`${url} → HTTP ${response.status}`)
    } catch (error) {
      failures.push(`${url} → ${error?.message || String(error)}`)
    }
  }
  throw new Error(`${label}获取失败：${failures.join('；') || '没有可用地址'}`)
}

function mimeFor(path) {
  const extension = String(path || '').split('.').pop()?.toLowerCase()
  return {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml',
    mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', flac: 'audio/flac', ogg: 'audio/ogg'
  }[extension] || 'application/octet-stream'
}

function decodeBase64Utf8(value) {
  const bytes = Uint8Array.from(atob(String(value || '').replace(/\s/g, '')), character => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export const usePluginsStore = defineStore('plugins', () => {
  const installed = ref({})
  const list = ref([])
  const source = ref('cyrene')
  const initialized = ref(false)
  const recovering = ref(false)
  const lastError = ref('')
  const pagesRevision = ref(0)
  const platformBridge = new PluginPlatformBridge()

  const runtime = new PluginRuntime({
    getPlugin: pluginId => installed.value[pluginId],
    savePluginData,
    loadPluginData,
    showBanner: null,
    getCoreSnapshot: async kind => {
      const namesStore = useNamesStore()
      if (kind === 'names') return clone({ currentListId: namesStore.currentListId, lists: namesStore.nameLists })
      if (kind === 'records') return clone(useRecordsStore().records)
      if (kind === 'statistics') {
        const statisticsStore = useStatisticsStore()
        return clone({ counts: statisticsStore.counts, totalCount: statisticsStore.totalCount })
      }
      if (kind === 'balance') {
        const balance = normalizeCyreneBalanceSettings(await dataBridge.load('balance'))
        return clone({
          enabled: balance.enabled,
          algorithm: ALGORITHM_NAME,
          version: ALGORITHM_VERSION,
          targetGap: TARGET_GAP,
          defaults: DEFAULT_CYRENE_BALANCE_SETTINGS
        })
      }
      return null
    },
    selectFile,
    playAudio,
    platformBridge,
    onFault: handleRuntimeFault
  })

  const enabledPlugins = computed(() => Object.values(installed.value).filter(plugin => plugin.enabled))
  const contributedPages = computed(() => {
    pagesRevision.value
    return runtime.getContributedPages()
  })

  function refreshPages() { pagesRevision.value += 1 }
  function syncSessionMarker() {
    if (Object.values(installed.value).some(plugin => plugin.enabled)) localStorage.setItem(SESSION_MARKER_KEY, '1')
    else localStorage.removeItem(SESSION_MARKER_KEY)
  }

  async function initialize() {
    if (initialized.value) return
    const saved = await dataBridge.load(STATE_KEY)
    if (saved && typeof saved === 'object') {
      installed.value = saved.installed || {}
      source.value = PLUGIN_DOWNLOAD_SOURCES.some(item => item.value === saved.source) ? saved.source : 'cyrene'
      const crashedSession = localStorage.getItem(SESSION_MARKER_KEY) === '1'
      if (saved.pendingStartup || crashedSession) {
        recovering.value = true
        lastError.value = '上次启动未能完成插件激活，已自动禁用全部插件。'
        for (const plugin of Object.values(installed.value)) {
          plugin.enabled = false
          plugin.recoveryDisabled = true
        }
        await dataBridge.save(STATE_KEY, {
          ...saved,
          installed: installed.value,
          source: source.value,
          pendingStartup: false
        })
        localStorage.removeItem(SESSION_MARKER_KEY)
      }
    }
    initialized.value = true
  }

  function setBannerHandler(handler) { runtime.showBanner = handler }

  async function saveState(pendingStartup = undefined) {
    const current = await dataBridge.load(STATE_KEY) || {}
    await dataBridge.save(STATE_KEY, {
      ...current,
      installed: installed.value,
      source: source.value,
      pendingStartup: pendingStartup === undefined ? !!current.pendingStartup : !!pendingStartup
    })
  }

  function dependenciesFor(plugin) {
    return Array.isArray(plugin?.manifest?.dependencies) ? plugin.manifest.dependencies : []
  }

  function assertDependencies(plugin) {
    for (const dependency of dependenciesFor(plugin)) {
      const target = installed.value[dependency.id]
      if (!target) throw new Error(`${plugin.manifest.name} 依赖尚未安装的插件 ${dependency.id}`)
      const range = dependency.range || dependency.version || '*'
      if (!satisfiesPluginVersion(target.manifest.version, range)) {
        throw new Error(`${plugin.manifest.name} 需要 ${dependency.id} ${range}，当前为 ${target.manifest.version}`)
      }
      if (!target.enabled) throw new Error(`${plugin.manifest.name} 依赖已禁用的插件 ${dependency.id}`)
    }
  }

  function compatibilityFor(pluginOrManifest) {
    return platformBridge.compatibility(pluginOrManifest?.manifest || pluginOrManifest)
  }

  function assertPlatformCompatibility(plugin) {
    const compatibility = compatibilityFor(plugin)
    if (!compatibility.compatible) throw new Error(compatibility.reason)
    return compatibility
  }

  function activationOrder(plugins) {
    const targets = new Map(plugins.map(plugin => [plugin.manifest.id, plugin]))
    const visiting = new Set()
    const visited = new Set()
    const result = []
    const visit = plugin => {
      const id = plugin.manifest.id
      if (visited.has(id)) return
      if (visiting.has(id)) throw new Error(`检测到插件依赖环：${[...visiting, id].join(' → ')}`)
      visiting.add(id)
      for (const dependency of dependenciesFor(plugin)) {
        const target = installed.value[dependency.id]
        if (!target || !target.enabled) throw new Error(`${plugin.manifest.name} 依赖 ${dependency.id}`)
        const range = dependency.range || dependency.version || '*'
        if (!satisfiesPluginVersion(target.manifest.version, range)) {
          throw new Error(`${plugin.manifest.name} 需要 ${dependency.id} ${range}`)
        }
        if (targets.has(dependency.id)) visit(target)
      }
      visiting.delete(id)
      visited.add(id)
      result.push(plugin)
    }
    plugins.forEach(visit)
    return result
  }

  async function activateEnabled() {
    const plugins = []
    for (const plugin of Object.values(installed.value).filter(item => item.enabled)) {
      const compatibility = compatibilityFor(plugin)
      plugin.platformCompatibility = compatibility
      if (!compatibility.compatible) {
        plugin.enabled = false
        plugin.runtimeError = compatibility.reason
        continue
      }
      plugins.push(plugin)
    }
    if (!plugins.length) {
      localStorage.removeItem(SESSION_MARKER_KEY)
      await saveState(false)
      return
    }
    await saveState(true)
    const activated = []
    try {
      for (const plugin of activationOrder(plugins)) {
        await runtime.activate(plugin)
        activated.push(plugin.manifest.id)
      }
      refreshPages()
      await saveState(false)
      syncSessionMarker()
      lastError.value = ''
    } catch (error) {
      lastError.value = error.message || String(error)
      for (const pluginId of activated.reverse()) await runtime.deactivate(pluginId)
      for (const plugin of plugins) {
        plugin.enabled = false
        plugin.runtimeError = lastError.value
        plugin.recoveryDisabled = true
      }
      refreshPages()
      recovering.value = true
      localStorage.removeItem(SESSION_MARKER_KEY)
      await saveState(false)
      throw error
    }
  }

  async function installPackage(input, {
    enable = true,
    origin = 'local',
    expectedPublisherKey = '',
    expectedPackageHash = ''
  } = {}) {
    const parsed = await parsePluginPackage(input, { expectedPublisherKey })
    if (expectedPackageHash && parsed.packageHash !== String(expectedPackageHash).toLowerCase()) {
      throw new Error('插件包哈希与目录登记不一致')
    }
    const pluginId = parsed.manifest.id
    const existing = installed.value[pluginId]
    if (existing && existing.manifest.version === parsed.manifest.version && existing.packageHash === parsed.packageHash) return existing

    const wasEnabled = !!existing?.enabled
    if (existing) await runtime.deactivate(pluginId)
    const candidate = {
      ...parsed,
      enabled: !!enable,
      origin,
      trusted: !!(parsed.publisherVerified && expectedPublisherKey),
      signed: !!parsed.publisherVerified,
      installedAt: existing?.installedAt || Date.now(),
      updatedAt: Date.now(),
      runtimeError: '',
      recoveryDisabled: false
    }
    const compatibility = compatibilityFor(candidate)
    candidate.platformCompatibility = compatibility
    if (!compatibility.compatible) {
      candidate.enabled = false
      candidate.runtimeError = compatibility.reason
    }
    installed.value[pluginId] = candidate
    try {
      if (candidate.enabled) {
        localStorage.setItem(SESSION_MARKER_KEY, '1')
        assertPlatformCompatibility(candidate)
        assertDependencies(candidate)
        await runtime.activate(candidate)
      }
      refreshPages()
      syncSessionMarker()
      recovering.value = false
      await saveState(false)
      return candidate
    } catch (error) {
      await runtime.deactivate(pluginId)
      if (existing) {
        installed.value[pluginId] = existing
        existing.enabled = wasEnabled
        if (wasEnabled) await runtime.activate(existing).catch(() => { existing.enabled = false })
      } else {
        delete installed.value[pluginId]
      }
      refreshPages()
      syncSessionMarker()
      await saveState(false)
      throw error
    }
  }

  function enabledDependents(pluginId) {
    return Object.values(installed.value).filter(plugin => plugin.enabled && dependenciesFor(plugin).some(dep => dep.id === pluginId))
  }

  async function uninstall(pluginId) {
    const dependents = enabledDependents(pluginId)
    if (dependents.length) throw new Error(`请先禁用依赖此插件的项目：${dependents.map(item => item.manifest.name).join('、')}`)
    await runtime.deactivate(pluginId)
    platformBridge.forgetPlugin(pluginId)
    delete installed.value[pluginId]
    await removePluginData(pluginId)
    refreshPages()
    syncSessionMarker()
    await saveState(false)
  }

  async function setEnabled(pluginId, value) {
    const plugin = installed.value[pluginId]
    if (!plugin) return false
    if (!value) {
      const dependents = enabledDependents(pluginId)
      if (dependents.length) throw new Error(`请先禁用：${dependents.map(item => item.manifest.name).join('、')}`)
      await runtime.deactivate(pluginId)
      plugin.enabled = false
      refreshPages()
      syncSessionMarker()
      await saveState(false)
      return true
    }
    try {
      assertPlatformCompatibility(plugin)
      assertDependencies(plugin)
      plugin.enabled = true
      plugin.runtimeError = ''
      plugin.recoveryDisabled = false
      localStorage.setItem(SESSION_MARKER_KEY, '1')
      await runtime.activate(plugin)
      recovering.value = false
      refreshPages()
      syncSessionMarker()
      await saveState(false)
    } catch (error) {
      plugin.enabled = false
      plugin.runtimeError = error.message || String(error)
      await runtime.deactivate(pluginId)
      refreshPages()
      syncSessionMarker()
      await saveState(false)
      throw error
    }
    return true
  }

  async function setSource(value) {
    source.value = PLUGIN_DOWNLOAD_SOURCES.some(item => item.value === value) ? value : 'cyrene'
    await saveState(false)
  }

  async function fetchList() {
    const response = await fetchFirstSuccessful(
      pluginListCandidates(source.value),
      { cache: 'no-store', headers: { Accept: 'application/json' } },
      '插件列表'
    )
    const payload = await response.json()
    if (!Array.isArray(payload.plugins)) throw new Error('插件列表格式无效')
    const ids = new Set()
    const entries = payload.plugins.map(item => {
      if (!item?.id || (!item?.version && !item?.release) || ids.has(item.id)) throw new Error(`插件目录条目无效：${item?.id || '未知'}`)
      ids.add(item.id)
      return { ...item, dependencies: Array.isArray(item.dependencies) ? item.dependencies : [] }
    })
    list.value = await Promise.all(entries.map(async item => {
      if (!item.release) return item
      try {
        return await resolveCatalogRelease(item, { source: source.value })
      } catch (error) {
        return { ...item, version: item.version || '', releaseError: error.message || String(error) }
      }
    }))
    return list.value
  }

  async function fetchPackage(item) {
    const original = item.downloadUrl || item.packageUrl
    if (!original) throw new Error(`${item.name || item.id} 没有可下载地址`)
    const response = await fetchFirstSuccessful(
      pluginSourceCandidates(original, source.value),
      { cache: 'no-store' },
      `${item.name || item.id} 插件包`
    )
    return new Uint8Array(await response.arrayBuffer())
  }

  async function inspectPackage(input, options = {}) {
    return parsePluginPackage(input, options)
  }

  async function downloadPlugin(item, trail = [], authorize = null) {
    if (trail.includes(item.id)) throw new Error(`检测到插件目录依赖环：${[...trail, item.id].join(' → ')}`)
    if (item.release) {
      const resolved = await resolveCatalogRelease(item, { source: source.value })
      Object.assign(item, resolved, { releaseError: '' })
    }
    const nextTrail = [...trail, item.id]
    const bytes = await fetchPackage(item)
    const expectedPublisherKey = item.publisherKey || ''
    const parsed = await parsePluginPackage(bytes, { expectedPublisherKey })
    if (parsed.manifest.id !== item.id || parsed.manifest.version !== item.version) {
      throw new Error('插件包身份或版本与目录条目不一致')
    }
    const expectedHash = String(item.sha256 || item.packageHash || '').toLowerCase()
    if (expectedHash && parsed.packageHash !== expectedHash) throw new Error('插件包哈希与目录登记不一致')
    if (authorize && await authorize(parsed.manifest, item) === false) throw new Error('用户取消了插件安装')

    for (const dependency of parsed.manifest.dependencies || []) {
      const range = dependency.range || dependency.version || '*'
      const current = installed.value[dependency.id]
      if (current && satisfiesPluginVersion(current.manifest.version, range)) {
        if (!current.enabled) await setEnabled(dependency.id, true)
        continue
      }
      const catalogDependency = list.value.find(candidate => candidate.id === dependency.id)
      if (!catalogDependency) throw new Error(`目录缺少依赖插件：${dependency.id}`)
      await downloadPlugin(catalogDependency, nextTrail, authorize)
      const installedDependency = installed.value[dependency.id]
      if (!installedDependency || !satisfiesPluginVersion(installedDependency.manifest.version, range)) {
        throw new Error(`依赖 ${dependency.id} 的版本不满足 ${range}`)
      }
    }
    return installPackage(bytes, {
      enable: item.defaultEnabled !== false,
      origin: 'catalog',
      expectedPublisherKey,
      expectedPackageHash: expectedHash
    })
  }

  async function loadCatalogDetails(item) {
    const details = { ...item }
    if (details.readme || details.readmeContent) return details
    if (details.readmeUrl) {
      const response = await fetchFirstSuccessful(
        pluginSourceCandidates(details.readmeUrl, source.value),
        { cache: 'no-store' },
        `${details.name || details.id} README`
      )
      details.readme = await response.text()
      return details
    }
    const slug = repositorySlug(details.repository)
    if (!slug) return details
    try {
      const repoResponse = await fetchFirstSuccessful(pluginSourceCandidates(`https://api.github.com/repos/${slug}`, source.value), {
        cache: 'no-store', headers: { Accept: 'application/vnd.github+json' }
      }, '插件仓库信息')
      const repository = await repoResponse.json()
      details.author ||= repository.owner?.login || ''
      details.icon ||= repository.owner?.avatar_url || ''
      details.description ||= repository.description || ''
      const readmeResponse = await fetchFirstSuccessful(pluginSourceCandidates(`https://api.github.com/repos/${slug}/readme`, source.value), {
        cache: 'no-store', headers: { Accept: 'application/vnd.github+json' }
      }, '插件 README')
      const readme = await readmeResponse.json()
      if (readme.content) details.readme = decodeBase64Utf8(readme.content)
    } catch (error) {
      console.warn('[plugins] catalog metadata unavailable', error)
    }
    return details
  }

  function pageById(pluginId, pageId) {
    pagesRevision.value
    return runtime.getContributedPages().find(page => page.pluginId === pluginId && page.id === pageId)
  }

  function pluginById(pluginId) { return installed.value[pluginId] }

  function pluginAssetUrl(pluginOrId, path = '') {
    const plugin = typeof pluginOrId === 'string' ? pluginById(pluginOrId) : pluginOrId
    const assetPath = path || plugin?.manifest?.icon
    const encoded = plugin?.files?.[assetPath]
    return encoded ? `data:${mimeFor(assetPath)};base64,${encoded}` : ''
  }

  function pluginPageSource(pluginId, pageId) {
    const plugin = pluginById(pluginId)
    const page = pageById(pluginId, pageId)
    return plugin && page ? runtime.frameSource(plugin, page) : ''
  }

  async function requestPlugin(pluginId, method, args = {}) {
    return runtime.handleRpc(pluginId, method, args)
  }

  function mountPageFrame(frame, pluginId, pageId) { runtime.mountFrame(frame, pluginId, pageId) }
  function unmountPageFrame(pluginId, pageId) { runtime.unmountFrame(pluginId, pageId) }

  async function dispatchEvent(event, payload) {
    emitPluginEvent(event, payload)
    await runtime.dispatch(event, clone(payload))
  }

  async function handlePluginMessage(event) {
    const message = event.data || {}
    if (!message.pluginId || message.type !== 'rpc-request') return
    if (!runtime.ownsFrameSource(event.source, message.pluginId)) return
    try {
      const result = await runtime.handleRpc(message.pluginId, message.method, message.args)
      event.source?.postMessage({ type: 'rpc-response', id: message.id, result: clone(result) }, '*')
    } catch (error) {
      event.source?.postMessage({ type: 'rpc-response', id: message.id, error: error.message || String(error) }, '*')
    }
  }

  async function handleRuntimeFault(pluginId, error) {
    const plugin = installed.value[pluginId]
    if (!plugin) return
    plugin.enabled = false
    plugin.runtimeError = error.message || String(error)
    lastError.value = `${plugin.manifest.name} 已因运行异常被禁用：${plugin.runtimeError}`
    await runtime.deactivate(pluginId)
    refreshPages()
    syncSessionMarker()
    await saveState(false)
    runtime.showBanner?.({ message: lastError.value, icon: 'shield-error-24-regular', type: 'warning', duration: 0, dismissible: true })
  }

  function markCleanShutdown() {
    localStorage.removeItem(SESSION_MARKER_KEY)
  }

  return {
    installed, list, source, initialized, recovering, lastError, enabledPlugins, contributedPages,
    initialize, setBannerHandler, saveState, activateEnabled, inspectPackage, installPackage, uninstall, setEnabled,
    setSource, fetchList, downloadPlugin, loadCatalogDetails, pageById, pluginById, pluginAssetUrl,
    pluginPageSource, requestPlugin, mountPageFrame, unmountPageFrame, dispatchEvent, handlePluginMessage, markCleanShutdown,
    compatibilityFor, platform: platformBridge.info(), platformCapabilities: platformBridge.capabilities()
  }
})

async function loadPluginData(pluginId, key) {
  const all = await dataBridge.load(PLUGIN_DATA_KEY) || {}
  return clone(all?.[pluginId]?.[key])
}

async function savePluginData(pluginId, key, value) {
  const all = await dataBridge.load(PLUGIN_DATA_KEY) || {}
  if (!all[pluginId]) all[pluginId] = {}
  all[pluginId][key] = clone(value)
  const serialized = JSON.stringify(all[pluginId])
  if (new TextEncoder().encode(serialized).byteLength > MAX_PLUGIN_DATA_SIZE) throw new Error('插件数据超过 96 MB 配额')
  await dataBridge.save(PLUGIN_DATA_KEY, all)
  return true
}

async function removePluginData(pluginId) {
  const all = await dataBridge.load(PLUGIN_DATA_KEY) || {}
  delete all[pluginId]
  await dataBridge.save(PLUGIN_DATA_KEY, all)
}

function selectFile(accept = 'audio/*') {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      if (file.size > MAX_AUDIO_FILE_SIZE) return reject(new Error('音频文件不能超过 16 MB'))
      const bytes = new Uint8Array(await file.arrayBuffer())
      let binary = ''
      for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
      const type = file.type || mimeFor(file.name)
      resolve({ name: file.name, type, size: file.size, dataUrl: `data:${type};base64,${btoa(binary)}` })
    }
    input.click()
  })
}

const playingAudio = new Set()
function playAudio(source, volume = 1) {
  if (!source) return false
  const audio = new Audio(source)
  audio.volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 1))
  playingAudio.add(audio)
  const release = () => playingAudio.delete(audio)
  audio.onended = release
  audio.onerror = release
  return audio.play().then(() => true).catch(() => { release(); return false })
}
