const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  getIndicatorGeometry,
  getIndicatorDirection,
  getIndicatorTransition
} = require('../src/utils/navigationIndicator.mjs')

const navigationDock = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'layout', 'NavigationDock.vue'), 'utf8')
const secondaryMenu = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'SecondarySidebarMenu.vue'), 'utf8')

test('maps item geometry into the navigation container coordinate space', () => {
  assert.deepEqual(
    getIndicatorGeometry({ top: 180, bottom: 220, height: 40 }, { top: 100, bottom: 500 }, 20),
    { top: 90, height: 20, center: 100, bottom: 110 }
  )
})

test('converts scaled DOM rectangles into CSS coordinates before positioning', () => {
  const geometry = getIndicatorGeometry({ top: 76.25, height: 47.5 }, { top: 0 }, 20, 1.25)
  assert.equal(geometry.top, 70)
  assert.equal(geometry.center, 80)
})

test('detects vertical direction and creates the PR-style stretched handoff', () => {
  const source = { top: 100, bottom: 120, center: 110, height: 20 }
  const target = { top: 182, bottom: 202, center: 192, height: 20 }
  assert.equal(getIndicatorDirection(source, target), 'down')
  assert.deepEqual(getIndicatorTransition(source, target, 20), {
    direction: 'down',
    fromTop: 100,
    toTop: 182,
    stretchTop: 100,
    stretchHeight: 102
  })
})

test('both navigation surfaces animate the shared vertical indicator with GSAP', () => {
  for (const source of [navigationDock, secondaryMenu]) {
    assert.match(source, /import \{ gsap \} from 'gsap'/)
    assert.match(source, /getBoundingClientRect\(\)/)
    assert.match(source, /getIndicatorTransition\(/)
    assert.match(source, /gsap\.timeline\(/)
    assert.match(source, /duration: 0\.13/)
    assert.match(source, /duration: 0\.12/)
    assert.match(source, /prefers-reduced-motion: reduce/)
    assert.match(source, /perf-no-anim/)
  }
  assert.doesNotMatch(navigationDock, /@keyframes dock-indicator/)
  assert.doesNotMatch(secondaryMenu, /@keyframes secondary-indicator/)
})
