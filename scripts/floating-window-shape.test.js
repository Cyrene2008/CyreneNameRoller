const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const view = fs.readFileSync(
  path.join(__dirname, '../src/views/FloatingLauncherView.vue'),
  'utf8'
)

test('floating ball stays square when the webview viewport is not square', () => {
  assert.match(view, /\.floating-ball\s*\{[\s\S]*?width:\s*min\(100vw, 100vh\);[\s\S]*?height:\s*min\(100vw, 100vh\);/)
  assert.match(view, /:global\(#app\)\s*\{[\s\S]*?display:\s*flex;[\s\S]*?align-items:\s*center;[\s\S]*?justify-content:\s*center;/)
})
