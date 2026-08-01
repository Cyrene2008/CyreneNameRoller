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

`.cnrp` means Cyrene NameRoller Plugin File. The application installs it from the independent Plugin Dock page or by drag and drop. Plugin pages remain under the Plugin section and are never injected into Settings.

See [Development Guide](./plugin-development.md) for the manifest, permissions, events, UI sandbox, dependencies, signatures and publication format.

The guide also defines the cross-platform bridge for browser and Tauri plugins. Optional native capabilities return structured unsupported results on Web, while required capabilities prevent activation until the user moves to a compatible host.
