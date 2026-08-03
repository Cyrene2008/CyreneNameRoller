import { definePlugin, PluginEvents } from '@starcyrene/cyrene-name-roller/plugin-sdk'

const defaults = { enabled: true, volume: 0.7, playbackMode: 'once', roller: null, card: null, lottery: null }
const summaryEvents = { [PluginEvents.ROLLER_RESULT]: 'roller', [PluginEvents.CARD_RESULT]: 'card', [PluginEvents.LOTTERY_RESULT]: 'lottery', [PluginEvents.LOTTERY_ASSIGN_RESULT]: 'lottery' }
const itemEvents = { [PluginEvents.ROLLER_ITEM_RESULT]: 'roller', [PluginEvents.CARD_ITEM_RESULT]: 'card', [PluginEvents.LOTTERY_ITEM_RESULT]: 'lottery' }
let request
let settings = { ...defaults }

async function readSettings() {
  settings = { ...defaults, ...((await request('storage.read', { key: 'settings' })) || {}) }
}

definePlugin({
  async activate(context) { request = context.request; await readSettings() },
  async onEvent(event, payload) {
    if (event === PluginEvents.PLUGIN_STORAGE_CHANGED && payload?.key === 'settings') {
      await readSettings()
      return
    }
    const kind = settings.playbackMode === 'each' ? itemEvents[event] : summaryEvents[event]
    if (!settings.enabled || !kind || !settings[kind]?.dataUrl) return
    await request('audio.play', { source: settings[kind].dataUrl, volume: settings.volume })
  },
  async deactivate() { request = null; settings = { ...defaults } }
})
