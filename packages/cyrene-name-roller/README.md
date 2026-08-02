# @cyrene2008/cyrene-name-roller

CyreneNameRoller plugin SDK and `.cnrp` package tool.

## Install

```bash
npm install --save-dev @cyrene2008/cyrene-name-roller
```

Use the SDK through the documented subpath:

```js
import { definePlugin, PluginEvents } from '@cyrene2008/cyrene-name-roller/plugin-sdk'
```

## CLI

```bash
npx cnrp create ./my-plugin
npx cnrp validate ./my-plugin
npx cnrp pack ./my-plugin --out ./dist/my-plugin.cnrp
```

The pack command bundles and obfuscates the Worker entry, adds file integrity hashes, and emits an authenticated `.cnrp` package with the `CNRP1` envelope. Use `--private-key path/to/private-key.pem` for an Ed25519 publisher signature.

`.cnrp` encryption is an anti-tamper and casual-inspection layer, not a promise of DRM-grade secrecy. The publisher signature is the trust mechanism for a catalog release.

The SDK also exposes `getPlatform()`, `getCapabilities()`, `isCapabilityAvailable()` and `requestCapability()` for Web/Tauri compatibility. Native-only capabilities should normally be optional; see `docs/plugin-development.md` for the bridge contract and fixed-operation security model.

Plugin API compatibility is minimum-version based. A plugin whose `engine.min` is supported will be allowed to load; an older `engine.max` produces a non-blocking compatibility warning instead of rejecting the package.

## API 1.1 extension points

- `contributes.pages[].location: "dock"` adds a top-level Dock destination for substantial plugin features.
- `draw.execute` asks the host to run a controlled draw and transactionally append statistics and history with rollback on persistence failure. People draws use CAF; plugins provide filters, never winners.
- `animationPacks` contributes validated Web Animations presets for page, roller, card, lottery and global transition targets.
- `visualSurfaces` runs an isolated Canvas/WebGL Worker behind core content for particle, light and atmosphere effects.
- lifecycle events expose route, theme, resize and application-ready snapshots without granting access to the host DOM.

Visual surfaces receive `perfAnimations` and `reducedMotion` in the theme lifecycle
snapshot and must suspend non-essential continuous rendering when either setting
disables motion.

The fairness boundary is append-only: plugins may initiate a new host-owned draw, but cannot select its result, rewrite existing records, change statistics or alter CAF parameters.
