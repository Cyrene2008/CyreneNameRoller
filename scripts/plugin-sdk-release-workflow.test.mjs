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
  assert.match(workflow, /npm publish --registry=https:\/\/npm\.pkg\.github\.com/)
  assert.doesNotMatch(workflow, /publish_failed=true/)
  assert.doesNotMatch(workflow, /exit 0/)
})
