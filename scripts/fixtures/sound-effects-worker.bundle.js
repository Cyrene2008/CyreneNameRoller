// 由 scripts/build-plugin-worker-fixture.mjs 生成，请勿手改。
(() => {
  // packages/cyrene-name-roller/src/plugin-sdk.mjs
  var PluginEvents = Object.freeze({
    APP_READY: "app:ready",
    APP_ROUTE_CHANGED: "app:route-changed",
    APP_THEME_CHANGED: "app:theme-changed",
    APP_RESIZE: "app:resize",
    PLUGIN_STORAGE_CHANGED: "plugin:storage-changed",
    DRAW_ITEM_RESULT: "draw:item-result",
    DRAW_RESULT: "draw:result",
    ROLLER_START: "roller:start",
    ROLLER_ITEM_RESULT: "roller:item-result",
    ROLLER_RESULT: "roller:result",
    CARD_ITEM_RESULT: "card:item-result",
    CARD_RESULT: "card:result",
    LOTTERY_RESULT: "lottery:result",
    LOTTERY_ITEM_RESULT: "lottery:item-result",
    LOTTERY_ASSIGN_RESULT: "lottery:assign-result"
  });
  var PluginPermissions = Object.freeze({
    STORAGE_READ: "storage:read",
    STORAGE_WRITE: "storage:write",
    EVENTS_DRAW: "events:draw",
    NOTIFICATIONS_SHOW: "notifications:show",
    AUDIO_SELECT: "audio:select",
    AUDIO_PLAY: "audio:play",
    NAMES_READ: "names:read",
    RECORDS_READ: "records:read",
    STATISTICS_READ: "statistics:read",
    BALANCE_READ: "balance:read",
    EVENTS_LIFECYCLE: "events:lifecycle",
    DRAW_EXECUTE: "draw:execute",
    UI_ANIMATIONS: "ui:animations",
    UI_VISUAL_SURFACES: "ui:visual-surfaces",
    UI_APPEARANCE: "ui:appearance",
    UI_COMPONENT_STYLES: "ui:component-styles",
    UI_COMPONENT_OVERRIDES: "ui:component-overrides",
    UI_NATIVE_VIEWS: "ui:native-views",
    UI_RESULT_PRESENTATIONS: "ui:result-presentations",
    UI_FONTS: "ui:fonts",
    SYSTEM_OPEN_URL: "system:open-url",
    SYSTEM_SELECT_FILE: "system:select-file",
    SYSTEM_SELECT_DIRECTORY: "system:select-directory",
    SYSTEM_CLIPBOARD_READ: "system:clipboard-read",
    SYSTEM_CLIPBOARD_WRITE: "system:clipboard-write",
    SYSTEM_REVEAL_FILE: "system:reveal-file",
    SYSTEM_EXECUTE: "system:execute"
  });
  var AnimationTargets = Object.freeze({
    PAGE_TRANSITION: "page.transition",
    ROLLER_FINISH: "roller.finish",
    CARD_DEAL: "card.deal",
    CARD_FLIP: "card.flip",
    LOTTERY_FINISH: "lottery.finish",
    GLOBAL_TRANSITION: "global.transition"
  });
  var PluginPageLocations = Object.freeze({
    PLUGINS: "plugins",
    DOCK: "dock"
  });
  var PluginCommandLocations = Object.freeze({
    COMMAND_PALETTE: "command-palette",
    PAGE_HEADER: "page-header",
    CONTEXT_MENU: "context-menu"
  });
  var PluginPlatforms = Object.freeze({
    WEB: "web",
    TAURI: "tauri",
    WINDOWS: "windows",
    MACOS: "macos",
    LINUX: "linux",
    ANDROID: "android",
    IOS: "ios"
  });
  var PluginCapabilities = Object.freeze({
    NOTIFICATIONS_SHOW: "notifications:show",
    AUDIO_SELECT: "audio:select",
    AUDIO_PLAY: "audio:play",
    OPEN_URL: "system:open-url",
    SELECT_FILE: "system:select-file",
    SELECT_DIRECTORY: "system:select-directory",
    CLIPBOARD_READ: "system:clipboard-read",
    CLIPBOARD_WRITE: "system:clipboard-write",
    REVEAL_FILE: "system:reveal-file",
    EXECUTE: "system:execute"
  });
  function definePlugin(plugin) {
    if (!plugin || typeof plugin.activate !== "function") {
      throw new TypeError("definePlugin() requires an object with activate(context)");
    }
    const target = globalThis;
    target.CyrenePluginModule = plugin;
    return plugin;
  }

  // plugin-dev/sound-effects/src/worker.js
  var DEFAULTS = {
    enabled: true,
    volume: 0.7,
    playbackMode: "once",
    roller: null,
    card: null,
    lottery: null
  };
  var EVENT_AUDIO = {
    [PluginEvents.ROLLER_RESULT]: "roller",
    [PluginEvents.CARD_RESULT]: "card",
    [PluginEvents.LOTTERY_RESULT]: "lottery",
    [PluginEvents.LOTTERY_ASSIGN_RESULT]: "lottery"
  };
  var ITEM_EVENT_AUDIO = {
    [PluginEvents.ROLLER_ITEM_RESULT]: "roller",
    [PluginEvents.CARD_ITEM_RESULT]: "card",
    [PluginEvents.LOTTERY_ITEM_RESULT]: "lottery"
  };
  var request;
  var settings = { ...DEFAULTS };
  async function readSettings() {
    const saved = await request("storage.read", { key: "settings" });
    settings = { ...DEFAULTS, ...saved || {} };
  }
  async function writeSettings(next) {
    settings = { ...DEFAULTS, ...settings, ...next };
    await request("storage.write", { key: "settings", value: settings });
    return settings;
  }
  async function chooseAudio(kind) {
    const selected = await request("audio.select", { accept: "audio/*" });
    if (!selected) return null;
    await writeSettings({ [kind]: selected });
    await request("notifications.show", { message: `\u5DF2\u8BBE\u7F6E${kind}\u97F3\u6548\uFF1A${selected.name}`, type: "success", duration: 3500 });
    return selected;
  }
  async function play(kind) {
    if (!settings.enabled) return;
    const audio = settings[kind];
    if (!audio?.dataUrl) return;
    await request("audio.play", { source: audio.dataUrl, volume: settings.volume });
  }
  definePlugin({
    async activate(context) {
      request = context.request;
      await readSettings();
    },
    async onEvent(event, payload) {
      await readSettings();
      const kind = settings.playbackMode === "each" ? ITEM_EVENT_AUDIO[event] : EVENT_AUDIO[event];
      if (!kind || !settings.enabled || !settings[kind]?.dataUrl) return;
      await play(kind);
      if (payload?.results?.length || payload?.result) {
        await writeSettings({ lastPlayedAt: Date.now() });
      }
    },
    async deactivate() {
      request = null;
    }
  });
  globalThis.CyreneSoundEffects = Object.freeze({
    getSettings: () => ({ ...settings }),
    saveSettings: writeSettings,
    chooseAudio,
    play
  });
})();
