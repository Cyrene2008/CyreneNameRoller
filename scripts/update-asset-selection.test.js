const assert = require('node:assert/strict')
const { test } = require('node:test')

let findPlatformAsset

test.before(async () => {
  ;({ findPlatformAsset } = await import('../src/utils/updateAsset.mjs'))
})

test('Win64 accepts the sole x64 Windows installer without a tauri name marker', () => {
  const asset = {
    name: 'CyreneNameRoller_26.1.0_win64_setup.exe',
    browser_download_url: 'https://github.com/StarCyrene/CyreneNameRoller/releases/download/26.1.0/CyreneNameRoller_26.1.0_win64_setup.exe'
  }

  assert.equal(findPlatformAsset([asset], 'win64', '26.1.0'), asset)
})

test('Win64 prefers asset matching the remote version number', () => {
  const stale = { name: 'CyreneNameRoller_26.0.4_win64_setup.exe' }
  const current = { name: 'CyreneNameRoller_26.1.0_win64_setup.exe' }

  assert.equal(findPlatformAsset([stale, current], 'win64', '26.1.0'), current)
})

test('Linux-x64 selects the deb of the remote version', () => {
  const asset = {
    name: 'CyreneNameRoller_26.1.0_amd64_setup.deb',
    browser_download_url: 'https://github.com/StarCyrene/CyreneNameRoller/releases/download/26.1.0/CyreneNameRoller_26.1.0_amd64_setup.deb'
  }

  assert.equal(findPlatformAsset([asset], 'linux-x64', '26.1.0'), asset)
})

test('No version match falls back to the sole platform-compatible asset', () => {
  const asset = { name: 'CyreneNameRoller-Cyrene-26.1.0-x64-setup.exe' }

  assert.equal(findPlatformAsset([asset], 'win64', '26.1.0'), asset)
  assert.equal(findPlatformAsset([], 'win64', '26.1.0'), null)
})

test('No matching suffix for the platform returns null', () => {
  const debAsset = { name: 'CyreneNameRoller_26.1.0_amd64_setup.deb' }

  assert.equal(findPlatformAsset([debAsset], 'win64', '26.1.0'), null)
})