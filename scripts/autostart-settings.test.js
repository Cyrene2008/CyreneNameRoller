const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const settingsStore = fs.readFileSync(path.join(root, 'src', 'stores', 'settings.js'), 'utf8')
const settingsView = fs.readFileSync(path.join(root, 'src', 'views', 'SettingsView.vue'), 'utf8')

test('new settings default to the traditional startup entry', () => {
  assert.match(settingsStore, /autoStartMode:\s*'registry'/)
})

test('startup method is only shown while launch at sign-in is enabled', () => {
  assert.match(
    settingsView,
    /<Transition name="toggle-expand">\s*<div v-if="isTauri\(\) && settings\.autoStart" class="sub-setting">\s*<div class="setting-row"><span class="setting-label">\{\{ lang === 'en' \? 'Startup method'/
  )
})

test('missing startup mode falls back to the traditional startup entry', () => {
  assert.doesNotMatch(settingsView, /autoStartMode \|\| 'scheduled'/)
  assert.match(settingsView, /autoStartMode \|\| 'registry'/)
})

test('lack of administrator permission falls back to the traditional startup entry', () => {
  assert.match(settingsView, /requiresElevation && value && mode === 'scheduled'/)
  assert.match(settingsView, /requiresElevation && mode === 'scheduled'/)
  assert.match(settingsView, /setAutoStart\(true, 'registry', 'registry'\)/)
  assert.match(settingsView, /当前没有管理员权限，已改用传统自启动项/)
  assert.match(settingsView, /Administrator permission is unavailable\. Switched to the traditional startup entry\./)
})
