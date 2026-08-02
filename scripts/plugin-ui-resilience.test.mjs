import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = file => fs.readFile(path.join(root, file), 'utf8')

test('Web overlays stay outside the scaled layout and Toasts stack from the top', async () => {
  const [fullscreen, toast] = await Promise.all([
    read('src/components/FullscreenToggle.vue'),
    read('src/components/FluentToast.vue')
  ])
  assert.match(fullscreen, /<Teleport to="body">/)
  assert.match(fullscreen, /position:\s*fixed;[\s\S]*?top:\s*8px;[\s\S]*?right:\s*8px;/)
  assert.match(toast, /\.fluent-toast-container\s*\{[\s\S]*?top:\s*24px;[\s\S]*?flex-direction:\s*column;/)
})

test('plugin route transitions and page mounts always have an escape path', async () => {
  const [layout, pluginPage] = await Promise.all([
    read('src/components/layout/AppLayout.vue'),
    read('src/views/PluginPageView.vue')
  ])
  assert.match(layout, /setTimeout\(\(\) => complete\(true\),\s*8000\)/)
  assert.match(layout, /Promise\.resolve\(run\?\.finished\)/)
  assert.match(layout, /catch\s*\{\s*complete\(true\)\s*\}/)
  assert.match(pluginPage, /let mountGeneration = 0/)
  assert.match(pluginPage, /if \(generation !== mountGeneration\) return/)
  assert.match(pluginPage, /onBeforeUnmount\(\(\) => \{[\s\S]*?mountGeneration \+= 1/)
})

test('Web deployment recovers from stale chunks without precaching missing assets', async () => {
  const [serviceWorker, main] = await Promise.all([
    read('public/sw.js'),
    read('src/main.js')
  ])
  assert.doesNotMatch(serviceWorker, /names\.json/)
  assert.match(serviceWorker, /cyrene-v26\.1\.0-shell-2/)
  assert.match(main, /vite:preloadError/)
  assert.match(main, /window\.location\.reload\(\)/)
})
