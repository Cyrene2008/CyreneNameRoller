export function buildPluginWorkerProtocol(pluginSource) {
  return `
      'use strict';
      for (const key of ['fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'importScripts', 'Worker', 'SharedWorker']) {
        try { Object.defineProperty(self, key, { value: undefined, writable: false, configurable: false }); } catch {}
      }
      ${pluginSource}
      const pending = new Map();
      let pluginModule = null;
      let activeCommandId = null;
      const freezePayload = value => {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value);
        for (const child of Object.values(value)) freezePayload(child);
        return value;
      };
      const request = (method, args = {}) => new Promise((resolve, reject) => {
        const id = (crypto.randomUUID && crypto.randomUUID()) || ('rpc-' + Date.now() + '-' + Math.random());
        pending.set(id, { resolve, reject });
        self.postMessage({ type: 'rpc-request', id, method, args, commandId: activeCommandId });
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
          } else if (message.type === 'command') {
            if (typeof pluginModule?.onCommand !== 'function') throw new Error('插件未实现 onCommand()');
            activeCommandId = message.id;
            try {
              const result = await pluginModule.onCommand(message.commandId, freezePayload(message.args || {}));
              self.postMessage({ type: 'command-result', id: message.id, result });
            } catch (error) {
              self.postMessage({ type: 'command-result', id: message.id, error: String(error?.message || error) });
            } finally { activeCommandId = null; }
          } else if (message.type === 'deactivate') {
            await pluginModule?.deactivate?.();
            self.postMessage({ type: 'deactivated' });
          } else if (message.type === 'rpc-response') {
            const task = pending.get(message.id);
            if (!task) return;
            pending.delete(message.id);
            message.error ? task.reject(Object.assign(new Error(message.error), { code: message.code })) : task.resolve(message.result);
          }
        } catch (error) {
          self.postMessage({ type: 'host-error', error: String(error?.stack || error) });
        }
      };
    `
}
