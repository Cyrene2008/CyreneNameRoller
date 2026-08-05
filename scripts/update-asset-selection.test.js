const assert = require('node:assert/strict')
const { test } = require('node:test')

let findPlatformAsset

test.before(async () => {
  ;({ findPlatformAsset } = await import('../src/utils/updateAsset.mjs'))
})

test('Tauri accepts the sole x64 Windows installer without a tauri name marker', () => {
  const asset = {
    name: 'Cyrene._26.1.0_x64-setup.exe',
    browser_download_url: 'https://github.com/StarCyrene/CyreneNameRoller/releases/download/26.1.0/Cyrene._26.1.0_x64-setup.exe'
  }

  assert.equal(findPlatformAsset([asset], 'tauri-win64'), asset)
})

test('Tauri prefers an explicitly named Tauri installer when multiple x64 installers exist', () => {
  const genericAsset = { name: 'Cyrene._26.1.0_x64-setup.exe' }
  const tauriAsset = { name: 'CyreneNameRoller-Tauri-win64.exe' }

  assert.equal(findPlatformAsset([genericAsset, tauriAsset], 'tauri-win64'), tauriAsset)
})
