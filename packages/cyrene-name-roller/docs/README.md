# CyreneNameRoller Plugin SDK

The official developer package is `@cyrene2008/cyrene-name-roller`. Import the public SDK through:

```js
import { definePlugin, PluginEvents } from '@cyrene2008/cyrene-name-roller/plugin-sdk'
```

Create and package a plugin:

```bash
npx cnrp create ./my-plugin
npx cnrp validate ./my-plugin
npx cnrp pack ./my-plugin --out ./dist/my-plugin.cnrp
```

`.cnrp` means Cyrene NameRoller Plugin File. The application installs it from the independent Plugin Dock page or by drag and drop. A page normally appears under the Plugin section; plugins may explicitly contribute a top-level Dock page with `location: "dock"`. Plugin pages are never injected into Settings.

See [Development Guide](./plugin-development.md) for the manifest, permissions, events, UI sandbox, dependencies, signatures and publication format.

The guide also defines the cross-platform bridge for browser and Tauri plugins. Optional native capabilities return structured unsupported results on Web, while required capabilities prevent activation until the user moves to a compatible host.

API 1.2 defines a composable extension kernel: capability discovery, read-only resource queries, host-owned transactions, arbitrary Dock pages, plugin-owned commands, host-run GSAP/WAAPI animations, semantic appearance packs and isolated Canvas/WebGL visual surfaces. These primitives provide large-feature freedom while keeping draw results, existing records, statistics and fairness parameters under host control.
