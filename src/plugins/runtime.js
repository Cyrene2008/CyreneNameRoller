import { decodePluginFile } from './package'
import { resolvePlatformEntry } from './platform'

function dataUrlFromBase64(base64, mime = 'application/octet-stream') {
  return `data:${mime};base64,${base64}`
}

function mimeFor(path) {
  const extension = String(path).split('.').pop()?.toLowerCase()
  return {
    html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json',
    mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', flac: 'audio/flac', ogg: 'audio/ogg',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml'
  }[extension] || 'application/octet-stream'
}

function storageKey(value) {
  const key = String(value || 'default')
  if (!/^[a-zA-Z0-9._-]{1,128}$/.test(key) || ['__proto__', 'prototype', 'constructor'].includes(key)) {
    throw new Error('插件存储键无效')
  }
  return key
}

function transferableValue(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function isDrawEvent(event) {
  return /^(draw|roller|card|lottery):/.test(String(event || ''))
}

function canReceiveEvent(plugin, event) {
  if (isDrawEvent(event)) return plugin?.manifest.permissions.includes('events:draw')
  return plugin?.manifest.permissions.includes('events:lifecycle')
}

const RUNTIME_DEACTIVATE_GRACE_MS = 250
const RUNTIME_CONTRIBUTION_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/

function visualCancellationError() {
  const error = new Error('插件视觉层激活已取消')
  error.name = 'AbortError'
  return error
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export class PluginRuntime {
  constructor({ getPlugin, savePluginData, loadPluginData, showBanner, getCoreSnapshot, executeCoreDraw, selectFile, playAudio, platformBridge, onFault }) {
    this.getPlugin = getPlugin
    this.savePluginData = savePluginData
    this.loadPluginData = loadPluginData
    this.showBanner = showBanner
    this.getCoreSnapshot = getCoreSnapshot
    this.executeCoreDraw = executeCoreDraw
    this.selectFile = selectFile
    this.playAudio = playAudio
    this.platformBridge = platformBridge
    this.onFault = onFault
    this.workers = new Map()
    this.frames = new Map()
    this.pages = new Map()
    this.visualSurfaces = new Map()
    this.visualRuntimes = new Map()
    this.deactivatingPlugins = new Set()
    this.lifecycleSnapshots = new Map()
  }

  registerPages(plugin) {
    const ids = new Set()
    const pages = []
    for (const page of plugin.manifest.contributes?.pages || []) {
      if (!RUNTIME_CONTRIBUTION_ID_PATTERN.test(page.id || '') || ids.has(page.id)) throw new Error(`插件页面 ID 无效或重复：${page.id || '空'}`)
      ids.add(page.id)
      const entry = resolvePlatformEntry(page, this.platformBridge.info())
      if (!entry && !page.native) continue
      pages.push([`${plugin.manifest.id}:${page.id}`, { pluginId: plugin.manifest.id, ...page, entry: entry || '' }])
    }
    for (const [key, page] of pages) this.pages.set(key, page)
  }

  unregisterPages(pluginId) {
    for (const [key, page] of this.pages) if (page.pluginId === pluginId) this.pages.delete(key)
  }

  unregisterFrames(pluginId) {
    for (const key of this.frames.keys()) {
      if (key.startsWith(`${pluginId}:`)) this.frames.delete(key)
    }
  }

  getContributedPages() {
    return [...this.pages.values()]
  }

  registerVisualSurfaces(plugin) {
    const ids = new Set()
    const surfaces = []
    for (const surface of plugin.manifest.contributes?.visualSurfaces || []) {
      if (!RUNTIME_CONTRIBUTION_ID_PATTERN.test(surface.id || '') || ids.has(surface.id)) throw new Error(`插件视觉层 ID 无效或重复：${surface.id || '空'}`)
      ids.add(surface.id)
      const entry = resolvePlatformEntry(surface, this.platformBridge.info())
      if (!entry || surface.defaultEnabled === false) continue
      surfaces.push([`${plugin.manifest.id}:${surface.id}`, { pluginId: plugin.manifest.id, ...surface, entry }])
    }
    for (const [key, surface] of surfaces) this.visualSurfaces.set(key, surface)
  }

  unregisterVisualSurfaces(pluginId) {
    for (const [key, surface] of this.visualSurfaces) if (surface.pluginId === pluginId) this.visualSurfaces.delete(key)
  }

  getContributedVisualSurfaces() {
    return [...this.visualSurfaces.values()]
  }

  finalizeVisualRuntime(key, runtime) {
    if (!runtime || runtime.finalized) return
    runtime.finalized = true
    if (runtime.resizeHandle !== null) {
      if (runtime.resizeHandleType === 'frame' && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(runtime.resizeHandle)
      else clearTimeout(runtime.resizeHandle)
    }
    runtime.resizeHandle = null
    runtime.pendingViewport = null
    try { runtime.worker.terminate() } catch {}
    if (runtime.workerUrl) URL.revokeObjectURL(runtime.workerUrl)
    if (this.visualRuntimes.get(key) === runtime) this.visualRuntimes.delete(key)
  }

  reportVisualRuntimeFailure(key, runtime, error) {
    if (!runtime || runtime.finalized) return
    runtime.rejectActivation?.(error)
    this.finalizeVisualRuntime(key, runtime)
    try {
      runtime.hostCanvas?.dispatchEvent(new CustomEvent('cyrene-visual-surface-error', {
        detail: { pluginId: runtime.pluginId, surfaceId: runtime.surfaceId, message: error.message || String(error) }
      }))
    } catch {}
  }

  async activate(plugin) {
    const compatibility = this.platformBridge.compatibility(plugin.manifest)
    if (!compatibility.compatible) throw new Error(compatibility.reason)
    const entry = resolvePlatformEntry(plugin.manifest, compatibility.platform)
    if (!entry) {
      try {
        this.registerPages(plugin)
        this.registerVisualSurfaces(plugin)
        return
      } catch (error) {
        this.unregisterPages(plugin.manifest.id)
        this.unregisterVisualSurfaces(plugin.manifest.id)
        throw error
      }
    }
    const source = decodePluginFile(plugin, entry)
    const workerSource = `
      'use strict';
      for (const key of ['fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'importScripts', 'Worker', 'SharedWorker']) {
        try { Object.defineProperty(self, key, { value: undefined, writable: false, configurable: false }); } catch {}
      }
      ${source}
      const pending = new Map();
      let pluginModule = null;
      const freezePayload = value => {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value);
        for (const child of Object.values(value)) freezePayload(child);
        return value;
      };
      const request = (method, args = {}) => new Promise((resolve, reject) => {
        const id = (crypto.randomUUID && crypto.randomUUID()) || ('rpc-' + Date.now() + '-' + Math.random());
        pending.set(id, { resolve, reject });
        self.postMessage({ type: 'rpc-request', id, method, args });
      });
      self.onmessage = async event => {
        const message = event.data || {};
        try {
          if (message.type === 'activate') {
            pluginModule = self.CyrenePluginModule || self.cyrenePlugin;
            if (!pluginModule || typeof pluginModule.activate !== 'function') throw new Error('插件未导出 cyrenePlugin.activate');
            await pluginModule.activate(Object.freeze({ ...message.context, request }));
            self.postMessage({ type: 'activated' });
          } else if (message.type === 'event' && pluginModule?.onEvent) {
            await pluginModule.onEvent(message.event, freezePayload(message.payload));
          } else if (message.type === 'deactivate') {
            await pluginModule?.deactivate?.();
            self.postMessage({ type: 'deactivated' });
          } else if (message.type === 'rpc-response') {
            const task = pending.get(message.id);
            if (!task) return;
            pending.delete(message.id);
            message.error ? task.reject(new Error(message.error)) : task.resolve(message.result);
          }
        } catch (error) {
          self.postMessage({ type: 'host-error', error: String(error?.stack || error) });
        }
      };
    `
    const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))
    const worker = new Worker(workerUrl)
    let activatedResolve
    let activatedReject
    let activationComplete = false
    const activated = new Promise((resolve, reject) => { activatedResolve = resolve; activatedReject = reject })
    let deactivatedResolve
    const deactivated = new Promise(resolve => { deactivatedResolve = resolve })
    const timeout = setTimeout(() => activatedReject(new Error(`${plugin.manifest.name} 激活超时`)), 10000)
    worker.onmessage = async event => {
      const message = event.data || {}
      if (message.type === 'rpc-request') {
        try {
          const result = await this.handleRpc(plugin.manifest.id, message.method, message.args)
          worker.postMessage({ type: 'rpc-response', id: message.id, result: transferableValue(result) })
        } catch (error) {
          worker.postMessage({ type: 'rpc-response', id: message.id, error: error.message || String(error) })
        }
      } else if (message.type === 'activated') activatedResolve()
      else if (message.type === 'deactivated') deactivatedResolve()
      else if (message.type === 'host-error') {
        const error = new Error(message.error || '插件 Worker 执行失败')
        if (activationComplete) this.onFault?.(plugin.manifest.id, error)
        else activatedReject(error)
      }
    }
    worker.onerror = event => {
      const error = new Error(event.message || '插件 Worker 崩溃')
      if (activationComplete) this.onFault?.(plugin.manifest.id, error)
      else activatedReject(error)
    }
    const context = {
      plugin: { id: plugin.manifest.id, version: plugin.manifest.version },
      permissions: transferableValue(plugin.manifest.permissions || []),
      platform: transferableValue(this.platformBridge.info()),
      capabilities: transferableValue(this.platformBridge.capabilities()),
      request: true
    }
    this.workers.set(plugin.manifest.id, { worker, workerUrl, deactivated })
    worker.postMessage({ type: 'activate', context })
    try {
      await activated
      activationComplete = true
      this.registerPages(plugin)
      this.registerVisualSurfaces(plugin)
    } catch (error) {
      worker.terminate()
      URL.revokeObjectURL(workerUrl)
      this.workers.delete(plugin.manifest.id)
      this.unregisterPages(plugin.manifest.id)
      this.unregisterVisualSurfaces(plugin.manifest.id)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  async deactivate(pluginId) {
    this.deactivatingPlugins.add(pluginId)
    try {
      const runtime = this.workers.get(pluginId)
      if (runtime) {
        try { runtime.worker.postMessage({ type: 'deactivate' }) } catch {}
        await Promise.race([runtime.deactivated, wait(RUNTIME_DEACTIVATE_GRACE_MS)])
        runtime.worker.terminate()
        if (runtime.workerUrl) URL.revokeObjectURL(runtime.workerUrl)
        this.workers.delete(pluginId)
      }
      this.unregisterPages(pluginId)
      this.unregisterFrames(pluginId)
      await Promise.all([...this.visualRuntimes.keys()]
        .filter(key => key.startsWith(`${pluginId}:`))
        .map(key => this.unmountVisualSurface(...key.split(':'))))
      this.unregisterVisualSurfaces(pluginId)
    } finally {
      this.deactivatingPlugins.delete(pluginId)
    }
  }

  async dispatch(event, payload) {
    const transferredPayload = transferableValue(payload)
    if (String(event || '').startsWith('app:')) this.lifecycleSnapshots.set(event, transferredPayload)
    for (const [pluginId, runtime] of this.workers) {
      const plugin = this.getPlugin(pluginId)
      if (!canReceiveEvent(plugin, event)) continue
      try { runtime.worker.postMessage({ type: 'event', event, payload: transferredPayload }) } catch {}
    }
    for (const [key, frame] of this.frames) {
      const pluginId = key.split(':')[0]
      const plugin = this.getPlugin(pluginId)
      if (!canReceiveEvent(plugin, event)) continue
      try { frame.contentWindow?.postMessage({ type: 'event', event, payload: transferredPayload }, '*') } catch {}
    }
    for (const [key, runtime] of this.visualRuntimes) {
      if (!runtime.activationComplete || runtime.cancelled || runtime.finalized) continue
      const pluginId = key.split(':')[0]
      const plugin = this.getPlugin(pluginId)
      const surface = this.visualSurfaces.get(key)
      if (!canReceiveEvent(plugin, event) || (surface?.events?.length && !surface.events.includes(event))) continue
      try { runtime.worker.postMessage({ type: 'event', event, payload: transferredPayload }) } catch {}
    }
  }

  replayLifecycleEventsToVisualRuntime(key, runtime) {
    const plugin = this.getPlugin(runtime?.pluginId)
    const surface = this.visualSurfaces.get(key)
    if (!runtime?.activationComplete || runtime.cancelled || runtime.finalized || !canReceiveEvent(plugin, 'app:ready')) return 0
    let replayed = 0
    for (const [event, payload] of this.lifecycleSnapshots) {
      if (surface?.events?.length && !surface.events.includes(event)) continue
      try {
        runtime.worker.postMessage({ type: 'event', event, payload: transferableValue(payload) })
        replayed += 1
      } catch (error) {
        this.reportVisualRuntimeFailure(key, runtime, error)
        break
      }
    }
    return replayed
  }

  async mountVisualSurface(canvas, pluginId, surfaceId, viewport = {}) {
    const key = `${pluginId}:${surfaceId}`
    const plugin = this.getPlugin(pluginId)
    const surface = this.visualSurfaces.get(key)
    if (!plugin || !surface) throw new Error('插件视觉层不存在或尚未启用')
    if (!plugin.manifest.permissions.includes('ui:visual-surfaces')) throw new Error('插件未获授权：ui:visual-surfaces')
    if (!canvas?.transferControlToOffscreen) throw new Error('当前环境不支持插件 Canvas 视觉层')
    await this.unmountVisualSurface(pluginId, surfaceId)
    const source = decodePluginFile(plugin, surface.entry)
    const workerSource = `
      'use strict';
      for (const key of ['fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'importScripts', 'Worker', 'SharedWorker']) {
        try { Object.defineProperty(self, key, { value: undefined, writable: false, configurable: false }); } catch {}
      }
      ${source}
      const pending = new Map();
      let visualModule = null;
      let canvas = null;
      let activationPromise = null;
      let deactivateRequested = false;
      let deactivated = false;
      let pendingViewport = null;
      let resizePromise = null;
      const freezePayload = value => {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value);
        for (const child of Object.values(value)) freezePayload(child);
        return value;
      };
      const request = (method, args = {}) => new Promise((resolve, reject) => {
        const id = (crypto.randomUUID && crypto.randomUUID()) || ('rpc-' + Date.now() + '-' + Math.random());
        pending.set(id, { resolve, reject });
        self.postMessage({ type: 'rpc-request', id, method, args });
      });
      const applyResize = async viewport => {
        if (!canvas) return;
        const dpr = Math.max(1, Math.min(3, Number(viewport.dpr) || 1));
        canvas.width = Math.max(1, Math.round((Number(viewport.width) || 1) * dpr));
        canvas.height = Math.max(1, Math.round((Number(viewport.height) || 1) * dpr));
        await visualModule?.onResize?.(Object.freeze({ ...viewport, dpr, pixelWidth: canvas.width, pixelHeight: canvas.height }));
      };
      const queueResize = viewport => {
        pendingViewport = viewport;
        if (resizePromise) return resizePromise;
        resizePromise = (async () => {
          while (pendingViewport) {
            const next = pendingViewport;
            pendingViewport = null;
            await applyResize(next);
          }
        })().finally(() => { resizePromise = null; });
        return resizePromise;
      };
      const deactivateVisual = async () => {
        if (deactivated) return;
        deactivated = true;
        try { await visualModule?.deactivate?.(); }
        finally { self.postMessage({ type: 'deactivated' }); }
      };
      self.onmessage = async event => {
        const message = event.data || {};
        try {
          if (message.type === 'activate') {
            activationPromise = (async () => {
              visualModule = self.CyreneVisualSurfaceModule || self.cyreneVisualSurface;
              if (!visualModule || typeof visualModule.activate !== 'function') throw new Error('视觉层未导出 defineVisualSurface() 模块');
              canvas = message.canvas;
              await visualModule.activate(Object.freeze({ ...message.context, canvas, request }));
              if (deactivateRequested) return;
              await queueResize(message.viewport || {});
            })();
            await activationPromise;
            if (deactivateRequested) await deactivateVisual();
            else self.postMessage({ type: 'activated' });
          } else if (message.type === 'resize') {
            if (!deactivateRequested) await queueResize(message.viewport || {});
          } else if (message.type === 'event' && visualModule?.onEvent) {
            if (!deactivateRequested) await visualModule.onEvent(message.event, freezePayload(message.payload));
          } else if (message.type === 'deactivate') {
            deactivateRequested = true;
            if (activationPromise) {
              try { await activationPromise; } catch {}
            }
            await deactivateVisual();
          } else if (message.type === 'rpc-response') {
            const task = pending.get(message.id);
            if (!task) return;
            pending.delete(message.id);
            message.error ? task.reject(new Error(message.error)) : task.resolve(message.result);
          }
        } catch (error) {
          self.postMessage({ type: 'host-error', error: String(error?.stack || error) });
          if (deactivateRequested) await deactivateVisual();
        }
      };
    `
    const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))
    const worker = new Worker(workerUrl)
    let resolveActivation
    let rejectActivation
    let activationComplete = false
    const activated = new Promise((resolve, reject) => { resolveActivation = resolve; rejectActivation = reject })
    let resolveDeactivated
    const deactivated = new Promise(resolve => { resolveDeactivated = resolve })
    const timeout = setTimeout(() => rejectActivation(new Error(`${plugin.manifest.name} 视觉层激活超时`)), 10000)
    const runtime = {
      worker, workerUrl, pluginId, surfaceId, hostCanvas: canvas,
      rejectActivation, deactivated, resolveDeactivated,
      activationComplete: false, cancelled: false, finalized: false,
      pendingViewport: null, resizeHandle: null, resizeHandleType: ''
    }
    worker.onmessage = async event => {
      const message = event.data || {}
      if (message.type === 'rpc-request') {
        try {
          const result = await this.handleRpc(pluginId, message.method, message.args)
          worker.postMessage({ type: 'rpc-response', id: message.id, result: transferableValue(result) })
        } catch (error) {
          worker.postMessage({ type: 'rpc-response', id: message.id, error: error.message || String(error) })
        }
      } else if (message.type === 'activated') {
        if (runtime.cancelled) rejectActivation(visualCancellationError())
        else resolveActivation()
      } else if (message.type === 'deactivated') resolveDeactivated()
      else if (message.type === 'host-error') {
        const error = new Error(message.error || '插件视觉层执行失败')
        if (activationComplete) this.reportVisualRuntimeFailure(key, runtime, error)
        else rejectActivation(error)
      }
    }
    worker.onerror = event => {
      const error = new Error(event.message || '插件视觉层崩溃')
      if (activationComplete) this.reportVisualRuntimeFailure(key, runtime, error)
      else rejectActivation(error)
    }
    const offscreen = canvas.transferControlToOffscreen()
    this.visualRuntimes.set(key, runtime)
    worker.postMessage({
      type: 'activate',
      canvas: offscreen,
      viewport: transferableValue(viewport),
      context: {
        plugin: { id: plugin.manifest.id, version: plugin.manifest.version },
        surface: { id: surface.id, placement: surface.placement },
        permissions: transferableValue(plugin.manifest.permissions || []),
        platform: transferableValue(this.platformBridge.info()),
        capabilities: transferableValue(this.platformBridge.capabilities())
      }
    }, [offscreen])
    try {
      await activated
      if (runtime.cancelled || this.visualRuntimes.get(key) !== runtime) throw visualCancellationError()
      activationComplete = true
      runtime.activationComplete = true
      this.replayLifecycleEventsToVisualRuntime(key, runtime)
      return true
    } catch (error) {
      await this.unmountVisualSurface(pluginId, surfaceId)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  resizeVisualSurface(pluginId, surfaceId, viewport) {
    const runtime = this.visualRuntimes.get(`${pluginId}:${surfaceId}`)
    if (!runtime || runtime.cancelled || runtime.finalized || !runtime.activationComplete) return false
    runtime.pendingViewport = transferableValue(viewport)
    if (runtime.resizeHandle !== null) return true
    const flush = () => {
      runtime.resizeHandle = null
      runtime.resizeHandleType = ''
      if (runtime.cancelled || runtime.finalized || !runtime.pendingViewport) return
      const next = runtime.pendingViewport
      runtime.pendingViewport = null
      try { runtime.worker.postMessage({ type: 'resize', viewport: next }) }
      catch (error) { this.reportVisualRuntimeFailure(`${pluginId}:${surfaceId}`, runtime, error) }
    }
    if (typeof requestAnimationFrame === 'function') {
      runtime.resizeHandleType = 'frame'
      runtime.resizeHandle = requestAnimationFrame(flush)
    } else {
      runtime.resizeHandleType = 'timeout'
      runtime.resizeHandle = setTimeout(flush, 16)
    }
    return true
  }

  async unmountVisualSurface(pluginId, surfaceId) {
    const key = `${pluginId}:${surfaceId}`
    const runtime = this.visualRuntimes.get(key)
    if (!runtime) return
    if (runtime.cleanupPromise) return runtime.cleanupPromise
    runtime.cancelled = true
    runtime.rejectActivation?.(visualCancellationError())
    runtime.cleanupPromise = (async () => {
      try { runtime.worker.postMessage({ type: 'deactivate' }) } catch {}
      await Promise.race([runtime.deactivated, wait(RUNTIME_DEACTIVATE_GRACE_MS)])
      this.finalizeVisualRuntime(key, runtime)
    })()
    return runtime.cleanupPromise
  }

  dispatchVisualForPlugin(pluginId, event, payload) {
    for (const [key, runtime] of this.visualRuntimes) {
      if (!key.startsWith(`${pluginId}:`)) continue
      if (!runtime.activationComplete || runtime.cancelled || runtime.finalized) continue
      try { runtime.worker.postMessage({ type: 'event', event, payload: transferableValue(payload) }) } catch {}
    }
  }

  async handleRpc(pluginId, method, args = {}) {
    const plugin = this.getPlugin(pluginId)
    if (!plugin) throw new Error('插件不存在')
    if (plugin.enabled === false || this.deactivatingPlugins.has(pluginId)) throw new Error('插件已禁用')
    const permissionFor = method => ({
      'storage.read': 'storage:read', 'storage.write': 'storage:write',
      'names.read': 'names:read', 'records.read': 'records:read', 'statistics.read': 'statistics:read', 'balance.read': 'balance:read',
      'draw.execute': 'draw:execute',
      'notifications.show': 'notifications:show',
      'audio.select': 'audio:select', 'audio.play': 'audio:play',
      'system.open-url': 'system:open-url', 'system.select-file': 'system:select-file',
      'system.select-directory': 'system:select-directory',
      'system.clipboard-read': 'system:clipboard-read', 'system.clipboard-write': 'system:clipboard-write',
      'system.reveal-file': 'system:reveal-file', 'system.execute': 'system:execute'
    }[method])
    const permission = permissionFor(method)
    if (permission && !plugin.manifest.permissions.includes(permission)) throw new Error(`插件未获授权：${permission}`)
    switch (method) {
      case 'runtime.platform': return this.platformBridge.info()
      case 'runtime.capabilities': return this.platformBridge.capabilities()
      case 'storage.read': return this.loadPluginData(pluginId, storageKey(args.key))
      case 'storage.write': {
        const key = storageKey(args.key)
        const result = await this.savePluginData(pluginId, key, args.value)
        this.dispatchVisualForPlugin(pluginId, 'plugin:storage-changed', { key })
        return result
      }
      case 'names.read': return this.getCoreSnapshot('names')
      case 'records.read': return this.getCoreSnapshot('records')
      case 'statistics.read': return this.getCoreSnapshot('statistics')
      case 'balance.read': return this.getCoreSnapshot('balance')
      case 'draw.execute': return this.executeCoreDraw?.(plugin, transferableValue(args))
      case 'notifications.show': return this.showBanner?.({ message: String(args.message || '').slice(0, 1000), type: ['info', 'success', 'warning'].includes(args.type) ? args.type : 'info', duration: Math.max(0, Math.min(30000, Number(args.duration) || 5000)), icon: args.icon || 'info-16-regular' })
      case 'audio.select': return this.selectFile?.('audio/*,.mp3,.m4a,.wav,.flac,.ogg')
      case 'audio.play': {
        const source = String(args.source || '')
        if (!/^data:audio\/[a-z0-9.+-]+;base64,/i.test(source)) throw new Error('插件只能播放经用户选择的本地音频')
        const volume = Number(args.volume)
        return this.playAudio?.(source, Number.isFinite(volume) ? volume : 1)
      }
      case 'system.open-url':
      case 'system.select-file':
      case 'system.select-directory':
      case 'system.clipboard-read':
      case 'system.clipboard-write':
      case 'system.reveal-file':
      case 'system.execute':
        return this.platformBridge.request(plugin, method, args)
      case 'dependency.storage.read': {
        const dependency = plugin.manifest.dependencies.find(item => item.id === args.pluginId && item.dataAccess)
        if (!dependency) throw new Error('未声明此前置插件的数据访问权限')
        const target = this.getPlugin(args.pluginId)
        if (!target?.manifest.shareData) throw new Error('前置插件未开放数据共享')
        return this.loadPluginData(args.pluginId, storageKey(args.key))
      }
      default: throw new Error(`不支持的插件请求：${method}`)
    }
  }

  frameSource(plugin, page) {
    let html = decodePluginFile(plugin, page.entry)
    const basePath = page.entry.split('/').slice(0, -1).join('/')
    html = html.replace(/(src|href)=(['"])(?!https?:|data:|#)([^'"]+)\2/gi, (match, attr, quote, path) => {
      const fullPath = [basePath, path].filter(Boolean).join('/').replace(/\/+/g, '/')
      const encoded = plugin.files[fullPath]
      return encoded ? `${attr}=${quote}${dataUrlFromBase64(encoded, mimeFor(fullPath))}${quote}` : match
    })
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' data:; style-src 'unsafe-inline' data:; img-src data:; media-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">`
    const platform = this.platformBridge.info()
    const capabilities = this.platformBridge.capabilities()
    const bootstrap = `<script>
      (() => {
        const pluginId = ${JSON.stringify(plugin.manifest.id)};
        const platform = Object.freeze(${JSON.stringify(platform)});
        const capabilities = Object.freeze(${JSON.stringify(capabilities)});
        const pending = new Map();
        const request = (method, args = {}) => new Promise((resolve, reject) => {
          const id = (crypto.randomUUID && crypto.randomUUID()) || ('rpc-' + Date.now() + '-' + Math.random());
          pending.set(id, { resolve, reject });
          parent.postMessage({ type: 'rpc-request', pluginId, id, method, args }, '*');
        });
        window.CyrenePlugin = Object.freeze({ pluginId, platform, capabilities, request });
        addEventListener('message', event => {
          const message = event.data || {};
          if (message.type === 'rpc-response') {
            const task = pending.get(message.id);
            if (!task) return;
            pending.delete(message.id);
            message.error ? task.reject(new Error(message.error)) : task.resolve(message.result);
          } else if (message.type === 'event') {
            dispatchEvent(new CustomEvent('cyrene-plugin-event', { detail: message }));
          }
        });
      })();
    <\/script>`
    return /<head(?:\s[^>]*)?>/i.test(html)
      ? html.replace(/<head(\s[^>]*)?>/i, match => `${match}${csp}${bootstrap}`)
      : `${csp}${bootstrap}${html}`
  }

  mountFrame(frame, pluginId, pageId) {
    const key = `${pluginId}:${pageId}`
    this.frames.set(key, frame)
  }

  unmountFrame(pluginId, pageId) { this.frames.delete(`${pluginId}:${pageId}`) }

  ownsFrameSource(source, pluginId) {
    if (!source || !pluginId) return false
    for (const [key, frame] of this.frames) {
      if (key.startsWith(`${pluginId}:`) && frame.contentWindow === source) return true
    }
    return false
  }
}
