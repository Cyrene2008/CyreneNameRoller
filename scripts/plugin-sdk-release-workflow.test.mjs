import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'

test('SDK release workflow keeps package publication separate from GitHub Releases', async () => {
  const workflow = await fs.readFile('.github/workflows/plugin-sdk-release.yaml', 'utf8')
  assert.doesNotMatch(workflow, /Attach assets to published release/)
  assert.doesNotMatch(workflow, /github\.event_name == 'release'/)
  assert.match(workflow, /uses:\s+actions\/upload-artifact@v4/)
  assert.match(workflow, /@starcyrene/)
  assert.match(workflow, /scope:\s+'@starcyrene'/)
  assert.match(workflow, /npm publish build-output\/plugin-sdk\/cyrene-name-roller-plugin-sdk-\*\.tgz --registry=https:\/\/npm\.pkg\.github\.com/)
  assert.match(workflow, /npm publish build-output\/plugin-sdk\/cyrene-name-roller-plugin-sdk-\*\.tgz --registry=https:\/\/registry\.npmjs\.org/)
  assert.doesNotMatch(workflow, /working-directory:\s+packages\/cyrene-name-roller/)
  assert.match(workflow, /npm config set @starcyrene:registry https:\/\/registry\.npmjs\.org/)
  assert.match(workflow, /secrets\.NPM_TOKEN/)
  assert.doesNotMatch(workflow, /publish_failed=true/)
  assert.doesNotMatch(workflow, /exit 0/)
})

test('SDK artifact packing runs from the staged package with npm or pnpm', async () => {
  const packScript = await fs.readFile('scripts/prepare-plugin-sdk-output.mjs', 'utf8')
  assert.match(packScript, /\[packageManagerCli, 'pack', '--pack-destination', output\], stage/)
  assert.doesNotMatch(packScript, /\[packageManagerCli, 'pack', stage,/)
})

test('Windows distribution invokes the Tauri CLI without shell path parsing', async () => {
  const packageScript = await fs.readFile('scripts/package-dist.mjs', 'utf8')
  assert.match(packageScript, /spawnSync\(process\.execPath, \[tauriCli, \.\.\.buildArgs\]/)
  assert.match(packageScript, /shell: false/)
  assert.doesNotMatch(packageScript, /\.bin.*tauri.*\.cmd/)
})
