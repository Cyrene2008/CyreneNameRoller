# CyreneNameRoller Plugin Development Guide

## Project structure

```text
my-plugin/
  manifest.json
  README.md
  src/worker.js
  pages/main.html
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
  "engine": { "min": "1.0.0", "max": "1.0.0" },
  "entry": "src/worker.js",
  "readme": "README.md",
  "permissions": ["events:draw", "storage:read", "storage:write"],
  "dependencies": [],
  "contributes": {
    "pages": [
      { "id": "main", "title": "Plugin", "location": "plugins", "entry": "pages/main.html" }
    ]
  }
}
```

The plugin ID is the permanent identity for installation, updates and storage. Use a lower-case reverse-domain identifier. `engine` refers to the plugin API version, not the application `26.x` version.

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
| `notifications:show` | `notifications.show` | Show a host notification. |
| `audio:select` | `audio.select` | Ask the user to choose an audio file. |
| `audio:play` | `audio.play` | Play a user-selected local audio data URL. |
| `names:read` | `names.read` | Read a snapshot of the current people list. |

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

For platform-specific Worker or page code, provide `platformEntries.web` and native entries such as `platformEntries.windows` or `platformEntries.macos`. The host chooses the Web entry in a browser and the OS-specific entry in Tauri. A page without a Web entry is simply not registered on Web.

`system.execute` is deliberately restricted to fixed, user-visible operations declared in the manifest. The command name must be a simple executable name and its argument array is immutable; arbitrary PowerShell/CMD strings, shell pipelines and runtime command construction are rejected. If a feature needs dynamic data, use a dedicated bridge or implement a Web-specific fallback instead.

## Draw events

- `roller:start`
- `roller:item-result`
- `roller:result`
- `card:item-result`
- `card:result`
- `lottery:item-result`
- `lottery:result`
- `lottery:assign-result`

Use item events for per-result behavior and summary events for once-per-operation behavior.

## Plugin pages

Pages run in `iframe sandbox="allow-scripts"` with a restrictive Content Security Policy. The host injects:

```js
window.CyrenePlugin.request(method, args)
```

Pages cannot access the host DOM or network. Use system CSS colors such as `Canvas`, `CanvasText` and `color-mix()` to support light and dark modes.

## Dependencies

```json
{
  "dependencies": [
    { "id": "cn.example.base", "range": "^1.0.0", "dataAccess": false }
  ]
}
```

The host installs dependencies first, detects cycles, validates version ranges and prevents disabling/uninstalling a plugin that has enabled dependents. Cross-plugin storage reads additionally require `dataAccess: true` and `shareData: true` on the target plugin.

## Packaging and signatures

```bash
npx cnrp validate ./my-plugin
npx cnrp pack ./my-plugin --out ./dist/my-plugin-1.0.0.cnrp
```

The CLI bundles the Worker with esbuild, obfuscates JavaScript, creates a per-file SHA-256 integrity map, compresses the package and emits an authenticated `CNRP1` AES-GCM envelope.

For a catalog release, sign the package with an Ed25519 private key:

```bash
npx cnrp pack ./my-plugin \
  --out ./dist/my-plugin-1.0.0.cnrp \
  --private-key ./publisher-private.pem
```

Never commit the private key. Publish the package SHA-256 and base64 SPKI public key in `plugins/list.json`. Encryption discourages casual inspection and detects modification; the Ed25519 signature is the publisher-identity trust mechanism.

## Catalog entry

```json
{
  "id": "cn.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "repository": "owner/repository",
  "downloadUrl": "https://github.com/.../my-plugin-1.0.0.cnrp",
  "sha256": "...",
  "publisherKey": "base64-spki-ed25519",
  "readmeUrl": "https://raw.githubusercontent.com/.../README.md",
  "dependencies": []
}
```

The application downloads `plugins/list.json` at runtime through the selected source (`gh.昔涟.cn`, `gh-proxy.com` or GitHub). A proxy is only a transport; package hash and publisher signature remain the trust boundary.

## Recovery and release checklist

- Validate the manifest and package.
- Request only required permissions.
- Test install, enable, disable, update and uninstall.
- Test the page in light/dark themes and narrow layouts.
- Test all declared draw events without duplicating summary/item behavior.
- Do not include secrets, absolute local paths or publisher private keys.
- Verify the Release asset SHA-256 and catalog public key.
- If a plugin crashes the application session, the next startup enters clean mode and disables all plugins for recovery.
