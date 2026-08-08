# Plugin API 1.2 to 1.3

API 1.2 packages continue to install without repacking. Keep their `engine`, RPC calls, draw events, required `DrawReceipt` fields and existing Chinese error handling unchanged.

## Opting in

Set `engine.min` to `1.3.0` only when the plugin uses a 1.3 contribution. API 1.3 iframe pages use `MessageChannel`; API 1.2 pages remain on the source-checked `window.message` compatibility path.

New permissions:

- `ui:component-styles`
- `ui:component-overrides`
- `ui:native-views`
- `ui:result-presentations`
- `ui:fonts`

New contribution keys:

- `componentStylePacks`
- `componentOverridePacks`
- `nativeViews`
- `resultPresentations`
- `fonts`

Use only published component IDs and `slot:` IDs. Arbitrary CSS selectors, CSS files, HTML, scripts, expressions, network-backed style values and unlisted icons are rejected.

`DrawReceipt.sequence`, `previousHash` and `receiptHash` are optional additions. All API 1.2 required fields remain required. Plugins must treat Receipt and result items as read-only host output.

Safe mode is configured only through `safemode.json` and takes effect after restart or reload. A plugin must not offer an in-app safe-mode toggle.

For a new 1.3 project:

```bash
npx cnrp create ./my-ui-plugin --template ui-customization
npx cnrp validate ./my-ui-plugin
npx cnrp pack ./my-ui-plugin --out ./dist/my-ui-plugin.cnrp
```
