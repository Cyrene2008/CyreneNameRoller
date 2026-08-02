# CyreneNameRoller Plugin Development Guide

## Project structure

```text
my-plugin/
  manifest.json
  README.md
  src/worker.js
  src/visual.js
  pages/main.html
  animations/presets.json
  assets/icon.svg
```

Use `cnrp create <directory>` for the basic template, or `cnrp create <directory> --template sound-effects` for the complete audio example.

## Manifest

```json
{
  "schemaVersion": 1,
  "id": "cn.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "engine": { "min": "1.1.0", "max": "1.1.0" },
  "entry": "src/worker.js",
  "readme": "README.md",
  "permissions": ["events:draw", "events:lifecycle", "draw:execute", "storage:read", "storage:write"],
  "dependencies": [],
  "contributes": {
    "pages": [
      { "id": "main", "title": "Plugin", "location": "dock", "order": 700, "icon": "sparkle-24-regular", "entry": "pages/main.html" }
    ]
  }
}
```

The plugin ID is the permanent identity for installation, updates and storage. Use a lower-case reverse-domain identifier. `engine` refers to the plugin API version, not the application `26.x` version.

`engine.min` is the hard requirement: when it is newer than the host API, the plugin cannot be loaded. `engine.max` describes the newest API version the developer has verified. A newer host will still load a plugin whose `engine.max` is older, but will show a compatibility warning because some behavior may have changed. This lets the loader remain backward compatible without pretending every old plugin has been fully verified on every future API.

## Worker lifecycle

```js
import { definePlugin, PluginEvents } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

definePlugin({
  async activate(context) {
    this.request = context.request
  },
  async onEvent(event, payload) {
    if (event === PluginEvents.ROLLER_RESULT) {
      await this.request('notifications.show', {
        message: `Received ${payload.results.length} results`,
        type: 'info'
      })
    }
  },
  async deactivate() {
    this.request = null
  }
})
```

Activation must complete within ten seconds. The Worker has no host DOM, Pinia, arbitrary Tauri invocation, network API, child Worker or `importScripts` access. Unhandled runtime errors disable the plugin.

## Permissions and RPC

| Permission | RPC | Purpose |
| --- | --- | --- |
| `storage:read` | `storage.read` | Read one value in the plugin namespace. |
| `storage:write` | `storage.write` | Write one value in the plugin namespace. |
| `events:draw` | — | Receive draw events. |
| `events:lifecycle` | — | Receive application-ready, route, theme and resize events. |
| `draw:execute` | `draw.execute` | Request a host-owned CAF draw and append its statistics/history transaction. |
| `ui:animations` | — | Contribute validated animation packs. |
| `ui:visual-surfaces` | — | Contribute isolated background Canvas/WebGL workers. |
| `notifications:show` | `notifications.show` | Show a host notification. |
| `audio:select` | `audio.select` | Ask the user to choose an audio file. |
| `audio:play` | `audio.play` | Play a user-selected local audio data URL. |
| `names:read` | `names.read` | Read a snapshot of lists, people and groups. |
| `records:read` | `records.read` | Read a snapshot of draw history. |
| `statistics:read` | `statistics.read` | Read aggregate draw counts and the total count. |
| `balance:read` | `balance.read` | Read the fairness algorithm version, enabled state and public parameters. |

Core lists, existing draw history, statistics and fairness parameters are intentionally read-only. The SDK does not expose matching write RPCs, so plugins cannot rewrite history, alter counts or weaken fairness. `draw.execute` is the sole append path: the host chooses results through CAF, updates statistics and appends immutable records as one operation. `storage.write` writes only inside that plugin's own namespace.

Audio files are limited to 16 MB each. The plugin namespace has a 96 MB serialized data quota. Storage keys are restricted to short alphanumeric/dot/dash/underscore values.

## Platform compatibility and system bridges

Plugins never invoke Tauri, PowerShell, `cmd`, browser globals, or arbitrary child processes directly. The host exposes a small, permissioned platform bridge. Every bridge request returns a structured result; an unavailable optional capability returns `ok: false` with `code: "UNSUPPORTED_PLATFORM"` instead of throwing, so the plugin can safely continue on Web.

The Worker context includes `context.platform` (`web` or `tauri`, plus the detected OS) and `context.capabilities`. Use the SDK helpers `getPlatform()`, `getCapabilities()`, `isCapabilityAvailable()` and `requestCapability()` to write one plugin that works on both targets.

Supported bridges are `system.open-url`, `system.select-file`, `system.select-directory`, `system.clipboard-read`, `system.clipboard-write`, `system.reveal-file` and `system.execute`. URL opening, file selection, clipboard and audio selection use browser APIs on Web where possible; directory selection, file revealing and native process operations are unavailable on Web and safely degrade.

Declare capabilities explicitly in `manifest.json`:

```json
{
  "permissions": ["system:select-directory", "system:open-url"],
  "capabilities": {
    "system:select-directory": { "required": false },
    "system:open-url": { "required": true }
  }
}
```

Required capabilities unavailable on the current platform prevent activation. Optional capabilities are shown to the user during installation and return a structured unsupported result. A plugin should either show a Web-specific UI or skip that operation:

```js
import { definePlugin, getPlatform, requestCapability } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

definePlugin({
  async activate(context) {
    const platform = await getPlatform(context)
    if (platform.runtime === 'tauri') {
      await requestCapability(context, 'system.select-directory')
    } else {
      await context.request('notifications.show', { message: 'Web 端不支持目录选择，已使用浏览器兼容流程。' })
    }
  }
})
```

For platform-specific Worker or page code, provide `platformEntries.web` and native entries such as `platformEntries.windows` or `platformEntries.macos`. The host chooses the Web entry in a browser and the OS-specific entry in Tauri. A page is not registered on Web only when it has neither `platformEntries.web` nor a generic `entry` fallback.

`system.execute` is deliberately restricted to fixed, user-visible operations declared in the manifest. The command name must be a simple executable name and its argument array is immutable; arbitrary PowerShell/CMD strings, shell pipelines and runtime command construction are rejected. If a feature needs dynamic data, use a dedicated bridge or implement a Web-specific fallback instead.

## Draw events

- `draw:item-result`
- `draw:result`
- `roller:start`
- `roller:item-result`
- `roller:result`
- `card:item-result`
- `card:result`
- `lottery:item-result`
- `lottery:result`
- `lottery:assign-result`

Use item events for per-result behavior and summary events for once-per-operation behavior.

Lifecycle events require `events:lifecycle`:

- `app:ready`
- `app:route-changed`
- `app:theme-changed`
- `app:resize`
- `plugin:storage-changed` (sent only to the plugin that wrote the key; page, Worker and subscribed visual surfaces receive it)

Event payloads are cloned snapshots. Mutating them never changes application state.

`app:theme-changed` is also the visual-performance contract. Its payload contains
`theme`, `dark`, `accent`, `perfAnimations` and `reducedMotion`. Canvas/WebGL
surfaces must stop continuous render loops and clear non-essential effects when
`perfAnimations` is false or `reducedMotion` is true, then resume with at most one
loop when the preference is restored. The host caches the latest lifecycle
snapshot and replays subscribed events after a visual surface activates.

## Host-mediated CAF draws

Plugins can build entirely new draw experiences, but must ask the host to commit the result:

```js
import { definePlugin, executeDraw } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

definePlugin({
  async activate(context) {
    const receipt = await executeDraw(context, {
      listId: 'class-a',
      target: 'people',
      gender: 'all',
      count: 6,
      allowDuplicates: false
    })
    console.log(receipt.operationId, receipt.results)
  }
})
```

Only filters are accepted: `listId`, `target`, `gender`, `count` and `allowDuplicates`. Candidate weights, selected IDs, result arrays, record bodies and fairness settings are not part of the API. The returned receipt is generated by the host and includes the operation ID, algorithm version and committed results. People draws use CAF; group draws use the host group-selection implementation. A successful request updates statistics where applicable and appends records tagged with the plugin ID and operation ID.

## Plugin pages

Use host-native settings pages whenever possible. The application renders these schemas with its own Fluent components, theme, spacing and responsive layout, so the plugin looks and behaves like a first-party page:

```json
{
  "id": "settings",
  "title": "My plugin",
  "native": {
    "type": "settings",
    "settingsKey": "settings",
    "controls": [
      { "id": "enabled", "type": "toggle", "path": "enabled", "label": "Enabled", "default": true },
      { "id": "volume", "type": "range", "path": "volume", "label": "Volume", "min": 0, "max": 1, "step": 0.01, "default": 0.7 },
      { "id": "mode", "type": "select", "path": "mode", "label": "Mode", "options": [{ "value": "once", "label": "Once" }] },
      { "id": "sound", "type": "audio", "path": "sound", "label": "Sound" }
    ]
  }
}
```

Supported controls are `toggle`, `range`, `select`, `audio` and `animation-select`. Ordinary values are stored in the plugin namespace and can be read by the Worker through `storage.read`; animation selections are maintained by the host animation registry.

HTML pages remain supported for rich custom functionality and are rendered in a sandboxed frame with the `window.CyrenePlugin.request()` bridge. They cannot access the host DOM. Use host-native settings pages for ordinary configuration because they automatically follow Peach, Fluent, custom, light and dark themes.

Set `location: "dock"` to make a substantial plugin page a first-level Dock destination. The page still uses the same sandbox and permission model; Dock placement does not grant extra privileges. `order` controls stable placement and `icon` uses a Fluent icon name. Use `location: "plugins"` for secondary/configuration pages.

Native settings also support an `animation-select` control. It does not use a storage `path`; instead declare the animation `target` and optional `packId`.

## Animation packs

Declare `ui:animations` and reference one or more JSON packs:

```json
{
  "contributes": {
    "animationPacks": [
      { "id": "motion", "title": "More Motion", "source": "animations/presets.json" }
    ]
  }
}
```

```json
{
  "schemaVersion": 1,
  "presets": [
    {
      "id": "soft-spring",
      "target": "roller.finish",
      "label": "Soft spring",
      "animation": {
        "keyframes": [
          { "opacity": 0, "transform": "scale(.86) translateY(10px)" },
          { "opacity": 1, "transform": "scale(1.04) translateY(0)", "offset": 0.7 },
          { "opacity": 1, "transform": "scale(1)" }
        ],
        "options": { "duration": 620, "easing": "cubic-bezier(.2,.9,.2,1)" }
      }
    }
  ]
}
```

Targets are `page.transition`, `roller.finish`, `card.deal`, `card.flip`, `lottery.finish` and `global.transition`. Keyframes use a limited allow-list of visual CSS properties and a bounded duration. Animation packs cannot replace or modify the host-selected result, result text or result data.

## Canvas and WebGL visual surfaces

Visual surfaces are independent Workers drawing only behind core content:

```json
{
  "permissions": ["events:lifecycle", "events:draw", "ui:visual-surfaces"],
  "contributes": {
    "visualSurfaces": [
      {
        "id": "aurora",
        "title": "Aurora",
        "entry": "src/visual.js",
        "placement": "background",
        "events": ["app:resize", "draw:result"]
      }
    ]
  }
}
```

```js
import { defineVisualSurface } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

defineVisualSurface({
  activate(context) {
    this.canvas = context.canvas
    this.ctx = context.canvas.getContext('2d')
  },
  onResize(viewport) {
    this.canvas.width = viewport.pixelWidth
    this.canvas.height = viewport.pixelHeight
  },
  onEvent(event) {
    if (event === 'draw:result') this.renderBurst()
  },
  deactivate() {}
})
```

The host transfers an `OffscreenCanvas` where supported and calls visual lifecycle methods in this order: `activate(context)`, initial `onResize(viewport)`, then subscribed lifecycle-event replay. Canvas 2D and WebGL are available through the browser implementation; importing GSAP into the host is unnecessary. Keep render loops bounded, stop them in `deactivate`, obey `perfAnimations` and `reducedMotion`, and degrade gracefully when OffscreenCanvas/WebGL is unavailable.

## Dependencies

```json
{
  "dependencies": [
    { "id": "cn.example.base", "range": "^1.0.0", "dataAccess": false }
  ]
}
```

The host installs dependencies first, detects cycles, validates version ranges and prevents disabling/uninstalling a plugin that has enabled dependents. Cross-plugin storage reads additionally require `dataAccess: true` and `shareData: true` on the target plugin.

Use the SDK helper instead of constructing the RPC name manually:

```js
import { readDependencyStorage } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

const sharedSettings = await readDependencyStorage(context, 'cn.example.base', 'settings')
```

## Packaging and signatures

```bash
npx cnrp validate ./my-plugin
npx cnrp pack ./my-plugin --out ./dist/my-plugin-1.1.0.cnrp
```

The CLI bundles the Worker with esbuild, obfuscates JavaScript, creates a per-file SHA-256 integrity map, compresses the package and emits an authenticated `CNRP1` AES-GCM envelope.

For a catalog release, sign the package with an Ed25519 private key:

```bash
npx cnrp pack ./my-plugin \
  --out ./dist/my-plugin-1.1.0.cnrp \
  --private-key ./publisher-private.pem
```

Never commit the private key. Publish the base64 SPKI public key in `plugins/list.json`. GitHub Release assets expose their SHA-256 digest through the API, while the Ed25519 signature remains the publisher-identity trust mechanism.

## Catalog entry

```json
{
  "id": "cn.example.my-plugin",
  "name": "My Plugin",
  "repository": "owner/repository",
  "release": {
    "provider": "github",
    "channel": "latest",
    "assetPattern": "my-plugin-*.cnrp"
  },
  "publisherKey": "base64-spki-ed25519",
  "dependencies": []
}
```

For GitHub plugins, do not hard-code `version`, `downloadUrl` or `sha256`. The application resolves the latest stable GitHub Release, selects the uploaded `.cnrp` asset with `assetPattern`, and uses the asset's `sha256:` digest automatically. Drafts and prereleases are not selected. Fixed `version`/`downloadUrl`/`sha256` entries remain supported for non-GitHub or pinned-version catalogs.

The application downloads `plugins/list.json` at runtime through the selected source (`gh.昔涟.cn`, `gh-proxy.com` or GitHub). A proxy is only a transport; the GitHub asset digest and publisher signature remain the trust boundary.

## Recovery and release checklist

- Validate the manifest and package.
- Request only required permissions.
- Test install, enable, disable, update and uninstall.
- Test the page in light/dark themes and narrow layouts.
- Test all declared draw events without duplicating summary/item behavior.
- Do not include secrets, absolute local paths or publisher private keys.
- Verify the Release asset name matches `assetPattern` and the catalog public key is current.
- If a plugin crashes the application session, the next startup enters clean mode and disables all plugins for recovery.
