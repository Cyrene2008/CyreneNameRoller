import { definePlugin, executeDraw } from '@starcyrene/cyrene-name-roller/plugin-sdk'

export default definePlugin({
  async activate(context) {
    this.context = context
  },
  async onCommand(commandId) {
    if (commandId === 'draw-now') return executeDraw(this.context, { count: 1 })
    if (commandId === 'desktop-check') {
      if (this.context.platform?.runtime !== 'tauri' || this.context.platform?.os !== 'windows') {
        return { ok: false, code: 'UNSUPPORTED_PLATFORM' }
      }
      return this.context.request('system.execute', { operation: 'desktop-check' })
    }
  },
  deactivate() {
    this.context = null
  }
})
