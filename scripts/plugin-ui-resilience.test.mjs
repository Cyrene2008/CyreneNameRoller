import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = file => fs.readFile(path.join(root, file), 'utf8')

test('Web overlays keep their own fixed positions and Toasts stack from the top', async () => {
  const [layout, fullscreen, toast] = await Promise.all([
    read('src/components/layout/AppLayout.vue'),
    read('src/components/FullscreenToggle.vue'),
    read('src/components/FluentToast.vue')
  ])
  assert.doesNotMatch(layout, /\.app-layout\s*>[^{]+\{\s*position:\s*relative/)
  assert.match(layout, /\.app-foreground-layer\s*\{\s*position:\s*relative;\s*z-index:\s*1;/)
  assert.match(layout, /\.version-badge\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?bottom:\s*0px;[\s\S]*?right:\s*24px;/)
  assert.match(layout, /\.file-drop-overlay\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?z-index:\s*999998;/)
  assert.match(layout, /\.banner-container\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?top:\s*0;[\s\S]*?left:\s*var\(--dock-width\);/)
  assert.match(fullscreen, /<Teleport to="body">/)
  assert.match(fullscreen, /position:\s*fixed;[\s\S]*?top:\s*8px;[\s\S]*?right:\s*8px;/)
  assert.match(toast, /\.fluent-toast-container\s*\{[\s\S]*?top:\s*24px;[\s\S]*?flex-direction:\s*column;/)
})

test('page animations never control Vue route lifecycle and use a host-owned visual stage', async () => {
  const [layout, pluginPage] = await Promise.all([
    read('src/components/layout/AppLayout.vue'),
    read('src/views/PluginPageView.vue')
  ])
  assert.match(layout, /<main ref="appContentRef" class="app-content">/)
  assert.match(layout, /<div ref="routeStageRef" class="route-page-stage"/)
  assert.match(layout, /\.app-body\s*\{[\s\S]*?min-height:\s*0;/)
  assert.match(layout, /\.app-content\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*0;/)
  assert.match(layout, /\.route-page-stage\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*100%;/)
  assert.doesNotMatch(layout, /<Transition[^>]+mode="out-in"/)
  assert.doesNotMatch(layout, /:css="false"/)
  assert.doesNotMatch(layout, /@enter="onPageEnter"|@leave="onPageLeave"|\bdone\(\)/)
  assert.match(layout, /function createRouteGhost\(direction\)/)
  assert.match(layout, /source\.cloneNode\(true\)/)
  assert.match(layout, /function startPageVisual\(element, phase, direction\)/)
  assert.match(layout, /pluginsStore\.startAnimation\('page\.transition'/)
  assert.match(layout, /function settleVisualRun\(run, phase, cleanup\)/)
  assert.match(layout, /requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => startRouteEnter\(cycle\)\)\)/)
  assert.match(layout, /totalDurationMs/)
  assert.match(layout, /function isUsablePageTransitionRun\(run\)/)
  assert.match(layout, /settingsStore\.settings\.perfAnimations !== false/)
  assert.match(layout, /\.route-page-ghost\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?pointer-events:\s*none;/)
  assert.match(pluginPage, /let mountGeneration = 0/)
  assert.match(pluginPage, /if \(generation !== mountGeneration\) return/)
  assert.match(pluginPage, /onBeforeUnmount\(\(\) => \{[\s\S]*?mountGeneration \+= 1/)
})

test('Web deployment recovers from stale chunks without precaching missing assets', async () => {
  const [html, serviceWorker, main] = await Promise.all([
    read('index.html'),
    read('public/sw.js'),
    read('src/main.js')
  ])
  assert.doesNotMatch(html, /serviceWorker\.register/)
  assert.doesNotMatch(serviceWorker, /names\.json/)
  assert.match(serviceWorker, /cyrene-v26\.1\.0-shell-2/)
  assert.match(main, /vite:preloadError/)
  assert.match(main, /window\.location\.reload\(\)/)
  assert.match(main, /import\.meta\.env\.DEV/)
  assert.match(main, /getRegistrations\(\)/)
  assert.match(main, /registration\.scope\.startsWith\(appScope\)/)
  assert.match(main, /navigator\.serviceWorker\.controller/)
  assert.match(main, /cyrene:dev-sw-detach-reload/)
  assert.match(main, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/)
})
