# @starcyrene/cyrene-name-roller

CyreneNameRoller plugin SDK and `.cnrp` package tool.

## Install

```bash
npm install --save-dev @starcyrene/cyrene-name-roller
```

The public package is published to npmjs. GitHub Packages mirrors the same
version for organization-internal use; configure
`@starcyrene:registry=https://npm.pkg.github.com` only when you specifically
need that registry.

Use the SDK through the documented subpath:

```js
import { definePlugin, PluginEvents } from '@starcyrene/cyrene-name-roller/plugin-sdk'
```

## CLI

```bash
npx cnrp create ./my-plugin
npx cnrp validate ./my-plugin
npx cnrp pack ./my-plugin --out ./dist/my-plugin.cnrp
```

The pack command bundles and obfuscates the Worker entry, adds file integrity hashes, and emits an authenticated `.cnrp` package with the `CNRP1` envelope. Use `--private-key path/to/private-key.pem` for an Ed25519 publisher signature.

`.cnrp` encryption is an anti-tamper and casual-inspection layer, not a promise of DRM-grade secrecy. The publisher signature is the trust mechanism for a catalog release.

The SDK exposes `getPlatform()`, `getCapabilities()`, `isCapabilityAvailable()` and `requestCapability()` for Web/Tauri compatibility. API 1.2 also adds `describeHost()`, `queryResource()` and `executeTransaction()` so plugins discover and compose host resources/transactions instead of depending on an ever-growing list of feature-specific RPC names. Native-only capabilities should normally be optional; see `docs/plugin-development.md` for the complete contract.

Plugin API compatibility is minimum-version based. A plugin whose `engine.min` is supported will be allowed to load; an older `engine.max` produces a non-blocking compatibility warning instead of rejecting the package. The `basic` and `sound-effects` templates remain frozen API 1.2 compatibility examples. Use `--template ui-customization` for new API 1.4 plugins.

## API 1.4 constrained UI model

- `componentStylePacks` styles only published stable component IDs with validated host properties.
- `componentOverridePacks` can hide only optional targets such as `roller.filters`; protected and required targets remain visible.
- Native settings support component style/override/result selectors and binary `component-override-toggle` controls.
- Six precise Roller filter targets can be hidden independently without changing their current host values.
- `nativeViews` renders a declarative schema in the fixed `slot:` locations owned by the host.
- `resultPresentations` changes the layout around the host-bound `VerifiedResult`; plugins never provide winner text.
- `safemode.json` is the only safe-mode switch. Safe mode loads no plugin package, Worker, iframe, font, visual layer, command or UI contribution.
- Web draws run through the host Core Worker. Tauri draws run through the Rust authoritative transaction and authenticated `CoreStateEnvelope`.

See `docs/api-1.2-to-1.3.md` for the original constrained contribution model; API 1.4 remains backward compatible with it.

## API 1.2 extension model

- `contributes.pages[].location: "dock"` adds a top-level Dock destination for substantial plugin features.
- `contributes.commands` declares plugin-owned actions that the host can surface in a command palette, page header or context menu and invoke through `onCommand()`.
- `resources.query` reads discovered, permissioned snapshots such as names, records, statistics and CAF metadata.
- `transactions.execute` submits intents to host-owned atomic operations. The built-in `draw` transaction uses CAF, appends statistics/history with rollback on persistence failure, and never accepts winners from a plugin. `draw.execute` remains as a compatibility alias.
- `animationPacks` contributes validated WAAPI or host-run GSAP presets for page, roller, card, lottery and global transition targets.
- `visualSurfaces` runs an isolated Canvas/WebGL Worker behind core content for particle, light and atmosphere effects.
- `appearancePacks` contributes validated semantic light/dark tokens for complete themes or partial appearance overrides.
- lifecycle events expose route, theme, resize and application-ready snapshots without granting access to the host DOM.

Commands are intentionally product actions, not privileged mutations. A command runs inside the plugin Worker; if it needs names, draws, records or system operations it must use the discovered read-only resource, host-owned transaction or platform bridge.

Rich plugin pages receive the active semantic tokens and a small Fluent base stylesheet, so a sandboxed page can look native without gaining access to the host DOM or protected stores.

Visual surfaces receive `perfAnimations` and `reducedMotion` in the theme lifecycle
snapshot. The host's own `perfAnimations` switch is the authoritative animation
gate; the browser/Windows reduced-motion preference is informational and does not
silently disable host GSAP/WAAPI animations.

The design principle is **product freedom, core-hosted state transitions**. Plugins can create arbitrary pages and workflows from composable resources, events, storage, system bridges, animation and visual surfaces; they may initiate new host-owned transactions, but cannot select draw results, rewrite existing records, change statistics or alter CAF parameters.
