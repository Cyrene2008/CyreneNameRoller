const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const appLayout = fs.readFileSync(path.join(root, 'src', 'components', 'layout', 'AppLayout.vue'), 'utf8')

test('every top banner renders a close button', () => {
  assert.doesNotMatch(appLayout, /<button v-if="b\.dismissible" class="banner-dismiss"/)
  assert.match(appLayout, /<button\s+class="banner-dismiss"[\s\S]*?@click="dismissBanner\(b\.id\)"/)
})

test('banner close button has localized accessible text', () => {
  assert.match(appLayout, /:aria-label="lang === 'en' \? 'Close notification' : '关闭通知'"/)
  assert.match(appLayout, /:title="lang === 'en' \? 'Close notification' : '关闭通知'"/)
})
