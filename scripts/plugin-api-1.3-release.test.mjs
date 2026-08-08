import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = relative => fs.readFile(path.join(root, relative), 'utf8')

test('API 1.3 release metadata is synchronized', async () => {
  const packageJson = JSON.parse(await read('packages/cyrene-name-roller/package.json'))
  assert.equal(packageJson.version, '1.3.0')
  assert.match(await read('src/plugins/constants.js'), /PLUGIN_API_VERSION = '1\.3\.0'/)
  assert.match(await read('packages/cyrene-name-roller/src/plugin-sdk.mjs'), /PLUGIN_API_VERSION = '1\.3\.0'/)
  assert.match(await read('packages/cyrene-name-roller/src/plugin-sdk.d.ts'), /PLUGIN_API_VERSION: '1\.3\.0'/)
  assert.match(await read('packages/cyrene-name-roller/bin/cnrp.mjs'), /const API_VERSION = '1\.3\.0'/)
})

test('API 1.3 UI template validates, packs and parses through host parser', async () => {
  const { validateDirectory, packDirectory } = await import(pathToFileURL(path.join(root, 'packages/cyrene-name-roller/bin/cnrp.mjs')).href)
  const template = path.join(root, 'packages/cyrene-name-roller/templates/ui-customization')
  const validation = await validateDirectory(template)
  assert.equal(validation.manifest.engine.min, '1.3.0')
  assert.equal(validation.manifest.systemOperations[0].id, 'desktop-check')
  assert.deepEqual(validation.manifest.systemOperations[0].command, { program: 'cmd', args: ['/d', '/c', 'ver'] })
  assert.deepEqual(validation.manifest.contributes.nativeViews.map(view => view.slot), ['slot:roller.side-panel'])
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cnrp-api-1.3-'))
  const output = path.join(tempDir, 'ui-customization.cnrp')
  const parserOutput = path.join(tempDir, 'application-plugin-parser.mjs')
  await build({ entryPoints: [path.join(root, 'src/plugins/package.js')], bundle: true, write: true, outfile: parserOutput, platform: 'browser', format: 'esm', target: ['es2022'], legalComments: 'none' })
  const { parsePluginPackage } = await import(`${pathToFileURL(parserOutput).href}?v=${Date.now()}`)
  const packed = await packDirectory(template, output)
  const parsed = await parsePluginPackage(new Uint8Array(packed.output))
  assert.equal(parsed.manifest.id, validation.manifest.id)
  assert.equal(parsed.manifest.systemOperations[0].id, 'desktop-check')
  assert.equal(parsed.manifest.contributes.nativeViews[0].slot, 'slot:roller.side-panel')
  assert.equal(parsed.manifest.contributes.componentOverridePacks[0].targets['roller.filters'].visibility, 'hidden')
})

test('frozen API 1.2 fixtures retain their byte hashes', async () => {
  const fixtures = [
    ['basic-1.0.0.cnrp', '927376ccaa59ba4ca46c26597f13582ff8a96db52e6b9f9051b963e6df8be778'],
    ['sound-effects-1.1.1.cnrp', '8e48702b19442606beb1fba3795a943292642c3e6beee32b4bad41d52b742d2a']
  ]
  for (const [name, expected] of fixtures) {
    const bytes = await fs.readFile(path.join(root, 'scripts/fixtures/plugin-api-1.2', name))
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected)
  }
})

test('core write boundaries remain present for the release gate', async () => {
  const [client, tauri, rust] = await Promise.all([
    read('src/core/client.js'),
    read('src/utils/tauriAPI.js'),
    read('src-tauri/src/lib.rs')
  ])
  assert.match(client, /coreDrawExecute/)
  assert.match(tauri, /coreDrawExecute/)
  assert.match(rust, /core_draw_execute/)
  assert.match(rust, /statistics|records/)
  assert.match(rust, /storage_set[\s\S]*statistics/)
})
