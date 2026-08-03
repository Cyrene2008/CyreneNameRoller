const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const appLayout = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'layout', 'AppLayout.vue'), 'utf8')

test('every global notification banner exposes an accessible close button', () => {
  const button = appLayout.match(/<button\s+class="banner-dismiss"[\s\S]*?<\/button>/)?.[0] || ''
  assert.match(button, /:aria-label=/)
  assert.match(button, /:title=/)
  assert.match(button, /@click="dismissBanner\(b\.id\)"/)
  assert.doesNotMatch(button, /v-if="b\.dismissible"/)
})
