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
  const geometry = getIndicatorGeometry(
    { top: 180, bottom: 220, height: 40 },
    { top: 100, bottom: 500 },
    20
  )

  assert.deepEqual(geometry, {
    top: 90,
    height: 20,
    center: 100,
    bottom: 110
  })
})

test('converts scaled DOM rectangles into CSS coordinates before positioning', () => {
  const geometry = getIndicatorGeometry(
    { top: 76.25, height: 47.5 },
    { top: 0 },
    20,
    1.25
  )

  assert.equal(geometry.top, 70)
  assert.equal(geometry.center, 80)
})

test('detects vertical navigation direction from item centers', () => {
  assert.equal(getIndicatorDirection({ center: 80 }, { center: 140 }), 'down')
  assert.equal(getIndicatorDirection({ center: 140 }, { center: 80 }), 'up')
  assert.equal(getIndicatorDirection({ center: 100 }, { center: 100 }), 'none')
})

test('bounds the stretched indicator between source and target item edges', () => {
  const source = { top: 100, bottom: 120, center: 110, height: 20 }
  const target = { top: 182, bottom: 202, center: 192, height: 20 }
  const transition = getIndicatorTransition(source, target, 20)

  assert.equal(transition.direction, 'down')
  assert.equal(transition.stretchTop, source.top)
  assert.equal(transition.stretchHeight, target.bottom - source.top)
})

test('reverses edge handoff when moving upward', () => {
  const source = { top: 182, bottom: 202, center: 192, height: 20 }
  const target = { top: 100, bottom: 120, center: 110, height: 20 }
  const transition = getIndicatorTransition(source, target, 20)

  assert.equal(transition.direction, 'up')
  assert.equal(transition.stretchTop, target.top)
  assert.equal(transition.stretchHeight, source.bottom - target.top)
})

test('dock uses one shared indicator and real active item geometry', () => {
  assert.match(navigationDock, /ref="dockRef"/)
  assert.match(navigationDock, /ref="indicatorRef"/)
  assert.match(navigationDock, /getBoundingClientRect\(\)/)
  assert.match(navigationDock, /getIndicatorTransition\(/)
  assert.match(navigationDock, /animation-duration: 250ms/)
  assert.match(navigationDock, /--indicator-from-left/)
  assert.match(navigationDock, /--indicator-to-left/)
  assert.match(navigationDock, /prefers-reduced-motion: reduce/)
  assert.match(navigationDock, /perf-no-anim/)
  assert.match(navigationDock, /activeSecondaryMenu/)
  assert.doesNotMatch(navigationDock, /class="dock-subitem"/)
  assert.match(navigationDock, /activeSecondaryMenu\.value = secondaryMenuForRoute\(path\)/)
  assert.match(navigationDock, /syncIndicatorAfterLayout\(true\)/)
})

test('secondary navigation uses the same shared indicator geometry', () => {
  assert.match(secondaryMenu, /ref="menuRef"/)
  assert.match(secondaryMenu, /ref="indicatorRef"/)
  assert.match(secondaryMenu, /getBoundingClientRect\(\)/)
  assert.match(secondaryMenu, /getIndicatorTransition\(/)
  assert.match(secondaryMenu, /animation-duration: 250ms/)
  assert.match(secondaryMenu, /if \(!open\) \{[\s\S]*syncIndicatorAfterLayout\(false\)/)
  assert.match(secondaryMenu, /secondary-sidebar-menu__item\.active::before \{ display: none; \}/)
})
