const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const navigationDock = fs.readFileSync(path.join(root, 'src', 'components', 'layout', 'NavigationDock.vue'), 'utf8')
const router = fs.readFileSync(path.join(root, 'src', 'router', 'index.js'), 'utf8')

function sourceBlock(source, start, end, label) {
  const startIndex = source.indexOf(start)
  assert.notEqual(startIndex, -1, `${label} start is missing`)
  const endIndex = source.indexOf(end, startIndex)
  assert.notEqual(endIndex, -1, `${label} end is missing`)
  return source.slice(startIndex, endIndex)
}

function assertOrdered(source, markers) {
  let cursor = -1
  for (const marker of markers) {
    const next = source.indexOf(marker, cursor + 1)
    assert.notEqual(next, -1, `${marker} is missing`)
    assert.ok(next > cursor, `${marker} is out of order`)
    cursor = next
  }
}

function routeOrder(routePath) {
  const escapedPath = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = router.match(new RegExp(`path: '${escapedPath}'[^\\n]*meta: \\{ order: (\\d+) \\}`))
  assert.ok(match, `${routePath} order is missing`)
  return Number(match[1])
}

test('primary navigation follows the approved order', () => {
  const match = navigationDock.match(/const mainItems = \[([\s\S]*?)\n\]/)
  assert.ok(match, 'mainItems block is missing')
  assert.deepEqual(
    [...match[1].matchAll(/id: '([^']+)'/g)].map(item => item[1]),
    ['roller', 'card', 'lottery', 'statistics', 'records', 'lists']
  )
})

test('bottom navigation is pinned and follows the approved order', () => {
  const bottom = sourceBlock(navigationDock, '<div class="dock-bottom">', '<SecondarySidebarMenu', 'dock-bottom')
  assertOrdered(bottom, [
    'to="/announcement"',
    'to="/download"',
    'dock-docs',
    'dock-plugin',
    "openSecondaryMenu('settings')",
    'to="/about"'
  ])
  assert.match(navigationDock, /\.dock-items\s*\{[\s\S]*?overflow-y:\s*auto/)
  assert.match(navigationDock, /\.dock-bottom\s*\{[\s\S]*?flex-shrink:\s*0/)
})

test('overlay menus own the approved child routes', () => {
  assert.match(navigationDock, /lottery:\s*\{[\s\S]*?to: '\/lottery\/draw'[\s\S]*?to: '\/lottery\/assign'/)
  assert.match(navigationDock, /records:\s*\{[\s\S]*?to: '\/records'[\s\S]*?to: '\/lottery\/records'/)
  assert.match(navigationDock, /lists:\s*\{[\s\S]*?to: '\/lists'[\s\S]*?to: '\/group-manage'[\s\S]*?to: '\/lottery\/prizes'/)
  assert.match(navigationDock, /lang\.value === 'en' \? 'Groups' : '小组名单'/)
  assert.match(navigationDock, /settings:\s*\{[\s\S]*?items:\s*settingsMenuItems\.value/)
})

test('route-bearing overlay menus navigate to their first child when opened', () => {
  for (const menu of ['lottery', 'records', 'lists']) {
    assert.match(navigationDock, new RegExp(`${menu}: \\{\\s*navigateOnOpen: true`))
  }
})

test('plugin is a no-route button and web-only items remain conditional', () => {
  const bottom = sourceBlock(navigationDock, '<div class="dock-bottom">', '<SecondarySidebarMenu', 'dock-bottom')
  assert.match(bottom, /<template v-if="!isDesktopApp">[\s\S]*?to="\/download"[\s\S]*?dock-docs[\s\S]*?<\/template>/)

  const pluginClass = bottom.indexOf('class="dock-item dock-plugin"')
  assert.notEqual(pluginClass, -1, 'plugin button is missing')
  const pluginStart = bottom.lastIndexOf('<button', pluginClass)
  const pluginEnd = bottom.indexOf('</button>', pluginClass)
  const plugin = bottom.slice(pluginStart, pluginEnd + '</button>'.length)
  assert.doesNotMatch(plugin, /:to=|\sto=|@click=/)
})

test('route animation order follows the visible navigation', () => {
  assert.equal(routeOrder('/lottery/records'), 510)
  assert.equal(routeOrder('/lottery/prizes'), 620)
  assert.equal(routeOrder('/lottery/prizes/manage'), 621)
})
