import { definePlugin, executeDraw } from '@starcyrene/cyrene-name-roller/plugin-sdk'

export default definePlugin({
  async activate(context) {
    this.context = context
  },
  async onCommand(commandId) {
    if (commandId === 'draw-now') return executeDraw(this.context, { count: 1 })
  },
  deactivate() {
    this.context = null
  }
})
