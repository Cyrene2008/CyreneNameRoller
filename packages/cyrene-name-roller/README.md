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
