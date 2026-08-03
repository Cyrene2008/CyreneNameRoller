import { definePlugin, PluginEvents } from '@starcyrene/cyrene-name-roller/plugin-sdk'

definePlugin({
  async activate(context) {
    this.request = context.request
  },
  async onEvent(event, payload) {
    if (event !== PluginEvents.ROLLER_RESULT) return
    await this.request('notifications.show', {
      message: `插件收到了 ${payload.results.length} 个结果`,
      type: 'info'
    })
  },
  async onCommand(commandId) {
    if (commandId !== 'refresh') return { handled: false }
    const settings = await this.request('storage.read', { key: 'settings' })
    return { handled: true, message: '插件数据已刷新', settings }
  },
  async deactivate() {
    this.request = null
  }
})
