const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const settingsSchema = fs.readFileSync(path.join(root, 'packages', 'cyrene-core', 'src', 'storage.js'), 'utf8')
const settingsView = fs.readFileSync(path.join(root, 'src', 'views', 'SettingsView.vue'), 'utf8')
const rollerView = fs.readFileSync(path.join(root, 'src', 'views', 'RollerView.vue'), 'utf8')

test('auto-stop duration is persisted and configurable', () => {
  assert.match(settingsSchema, /autoStopDuration:\s*3/)
  assert.match(settingsView, /autoStopDuration/)
})

test('roller action button exposes a live countdown bar', () => {
  assert.match(rollerView, /autoStopProgress/)
  assert.match(rollerView, /start-btn-countdown/)
})

test('auto-stop duration normalization keeps the setting usable', async () => {
  const { normalizeAutoStopDuration, getAutoStopProgress } = await import('../src/utils/autoStop.mjs')
  assert.equal(normalizeAutoStopDuration('bad'), 3)
  assert.equal(normalizeAutoStopDuration(0), 1)
  assert.equal(normalizeAutoStopDuration(100), 60)
  assert.equal(getAutoStopProgress(1500, 3000), 50)
  assert.equal(getAutoStopProgress(-1, 3000), 0)
  assert.equal(getAutoStopProgress(4000, 3000), 100)
})
