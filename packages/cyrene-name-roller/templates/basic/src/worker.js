import { definePlugin, PluginEvents } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

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
  async deactivate() {
    this.request = null
  }
})
