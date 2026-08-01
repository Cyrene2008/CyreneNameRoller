import { definePlugin, PluginEvents } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

const defaults = { enabled: true, volume: 0.7, playbackMode: 'once', roller: null, card: null, lottery: null }
const summaryEvents = { [PluginEvents.ROLLER_RESULT]: 'roller', [PluginEvents.CARD_RESULT]: 'card', [PluginEvents.LOTTERY_RESULT]: 'lottery', [PluginEvents.LOTTERY_ASSIGN_RESULT]: 'lottery' }
const itemEvents = { [PluginEvents.ROLLER_ITEM_RESULT]: 'roller', [PluginEvents.CARD_ITEM_RESULT]: 'card', [PluginEvents.LOTTERY_ITEM_RESULT]: 'lottery' }
let request

definePlugin({
  async activate(context) { request = context.request },
  async onEvent(event) {
    const saved = { ...defaults, ...((await request('storage.read', { key: 'settings' })) || {}) }
    const kind = saved.playbackMode === 'each' ? itemEvents[event] : summaryEvents[event]
    if (!saved.enabled || !kind || !saved[kind]?.dataUrl) return
    await request('audio.play', { source: saved[kind].dataUrl, volume: saved.volume })
  },
  async deactivate() { request = null }
})
