import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('SDK release workflow keeps package publication separate from GitHub Releases', async () => {
  const workflow = await fs.readFile('.github/workflows/plugin-sdk-release.yaml', 'utf8')
  assert.doesNotMatch(workflow, /Attach assets to published release/)
  assert.doesNotMatch(workflow, /github\.event_name == 'release'/)
  assert.match(workflow, /uses:\s+actions\/upload-artifact@v4/)
  assert.match(workflow, /uses:\s+oven-sh\/setup-bun@v2/)
  assert.match(workflow, /bun install --frozen-lockfile/)
  assert.match(workflow, /bun run plugin:sdk:pack/)
  assert.match(workflow, /@starcyrene/)
  assert.doesNotMatch(workflow, /scope:\s+'@starcyrene'/)  // setup-node 不再配置 scope，避免 .npmrc 占位 token 屏蔽 OIDC
  assert.doesNotMatch(workflow, /npm\.pkg\.github\.com/)  // 不再发布到 GitHub Packages
  assert.match(workflow, /npm publish build-output\/plugin-sdk\/cyrene-name-roller-plugin-sdk-\*\.tgz --registry=https:\/\/registry\.npmjs\.org/)
  assert.match(workflow, /npm install -g npm@latest/)  // OIDC 可信发布需要 npm >= 11.5.1
  assert.doesNotMatch(workflow, /working-directory:\s+packages\/cyrene-name-roller/)
  assert.match(workflow, /provenance/)  // 检查 provenance，这是 OIDC 的标志
  assert.match(workflow, /id-token:\s+write/)  // 检查 OIDC 权限配置
  assert.doesNotMatch(workflow, /publish_failed=true/)
  assert.doesNotMatch(workflow, /exit 0/)
})

test('SDK artifact packing runs from the staged package with Bun', async () => {
  const packScript = await fs.readFile('scripts/prepare-plugin-sdk-output.mjs', 'utf8')
  assert.match(packScript, /run\('bun', \['pm', 'pack', '--destination', output\], stage\)/)
  assert.match(packScript, /bun pm pack did not produce a \.tgz file/)
  assert.doesNotMatch(packScript, /npm_execpath/)
})

test('Windows distribution invokes the Tauri CLI without shell path parsing', async () => {
  const packageScript = await fs.readFile('scripts/package-dist.mjs', 'utf8')
  assert.match(packageScript, /spawnSync\(process\.execPath, \[tauriCli, \.\.\.buildArgs\]/)
  assert.match(packageScript, /shell: false/)
  assert.doesNotMatch(packageScript, /\.bin.*tauri.*\.cmd/)
})

test('SDK CLI executes through package-manager directory links', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'cnrp-cli-link-'))
  t.after(() => fs.rm(temporary, { recursive: true, force: true }))
  const source = path.resolve('packages/cyrene-name-roller/bin')
  const linked = path.join(temporary, 'linked-bin')
  await fs.symlink(source, linked, process.platform === 'win32' ? 'junction' : 'dir')

  const result = spawnSync(process.execPath, [path.join(linked, 'cnrp.mjs'), 'help'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /cnrp pack <dir> --out <file\.cnrp>/)
})
