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

export class PluginRuntime {
  constructor({ getPlugin, savePluginData, loadPluginData, showBanner, getNames, selectFile, playAudio, platformBridge, onFault }) {
    this.getPlugin = getPlugin
    this.savePluginData = savePluginData
    this.loadPluginData = loadPluginData
    this.showBanner = showBanner
    this.getNames = getNames
    this.selectFile = selectFile
    this.playAudio = playAudio
    this.platformBridge = platformBridge
    this.onFault = onFault
    this.workers = new Map()
    this.frames = new Map()
    this.pages = new Map()
  }

  registerPages(plugin) {
    for (const page of plugin.manifest.contributes?.pages || []) {
      const entry = resolvePlatformEntry(page, this.platformBridge.info())
      if (!entry) continue
      this.pages.set(`${plugin.manifest.id}:${page.id}`, { pluginId: plugin.manifest.id, ...page, entry })
    }
  }

  unregisterPages(pluginId) {
    for (const [key, page] of this.pages) if (page.pluginId === pluginId) this.pages.delete(key)
  }

  getContributedPages() {
    return [...this.pages.values()]
  }

  async activate(plugin) {
    const compatibility = this.platformBridge.compatibility(plugin.manifest)
    if (!compatibility.compatible) throw new Error(compatibility.reason)
    const entry = resolvePlatformEntry(plugin.manifest, compatibility.platform)
    if (!entry) {
      this.registerPages(plugin)
      return
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
            await pluginModule.onEvent(message.event, message.payload);
          } else if (message.type === 'deactivate') {
            await pluginModule?.deactivate?.();
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
    this.workers.set(plugin.manifest.id, { worker, workerUrl })
    worker.postMessage({ type: 'activate', context })
    try {
      await activated
      activationComplete = true
      this.registerPages(plugin)
    } catch (error) {
      worker.terminate()
      URL.revokeObjectURL(workerUrl)
      this.workers.delete(plugin.manifest.id)
      this.unregisterPages(plugin.manifest.id)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  async deactivate(pluginId) {
    const runtime = this.workers.get(pluginId)
    if (runtime) {
      try { runtime.worker.postMessage({ type: 'deactivate' }) } catch {}
      runtime.worker.terminate()
      if (runtime.workerUrl) URL.revokeObjectURL(runtime.workerUrl)
      this.workers.delete(pluginId)
    }
    this.unregisterPages(pluginId)
  }

  async dispatch(event, payload) {
    for (const [pluginId, runtime] of this.workers) {
      const plugin = this.getPlugin(pluginId)
      if (!plugin?.manifest.permissions.includes('events:draw')) continue
      try { runtime.worker.postMessage({ type: 'event', event, payload: transferableValue(payload) }) } catch {}
    }
    for (const [key, frame] of this.frames) {
      const pluginId = key.split(':')[0]
      const plugin = this.getPlugin(pluginId)
      if (!plugin?.manifest.permissions.includes('events:draw')) continue
      try { frame.contentWindow?.postMessage({ type: 'event', event, payload: transferableValue(payload) }, '*') } catch {}
    }
  }

  async handleRpc(pluginId, method, args = {}) {
    const plugin = this.getPlugin(pluginId)
    if (!plugin) throw new Error('插件不存在')
    const permissionFor = method => ({
      'storage.read': 'storage:read', 'storage.write': 'storage:write',
      'names.read': 'names:read', 'notifications.show': 'notifications:show',
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
      case 'storage.write': return this.savePluginData(pluginId, storageKey(args.key), args.value)
      case 'names.read': return this.getNames()
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
