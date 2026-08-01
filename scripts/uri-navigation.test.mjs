import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCyreneUri, parseWebHash } from '../src/utils/uriNavigation.js'

test('desktop start URI only reveals the current page', () => {
  assert.deepEqual(parseCyreneUri('cyrenenr://start'), {
    source: 'desktop-uri',
    route: null,
    roller: null,
    autoStart: false
  })
})

test('desktop page URI maps aliases and parses Roller parameters', () => {
  assert.deepEqual(
    parseCyreneUri('cyrenenr://page/roller?isEN=0&isGroupMode=0&sex=female&multiMode=1&count=6&noDuplication=0'),
    {
      source: 'desktop-uri',
      route: '/roller',
      autoStart: true,
      roller: {
        englishMode: false,
        groupMode: false,
        sex: 'female',
        multiMode: true,
        count: 6,
        noDuplication: false
      }
    }
  )
  assert.equal(parseCyreneUri('cyrenenr://page/cards').route, '/card')
})

test('non-Roller pages ignore query parameters', () => {
  assert.deepEqual(parseCyreneUri('cyrenenr://page/settings?count=99'), {
    source: 'desktop-uri',
    route: '/settings',
    roller: null,
    autoStart: false
  })
})

test('Web hash uses the same Roller parameter contract', () => {
  assert.deepEqual(parseWebHash('#/roller?isGroupMode=1&multiMode=1&count=12&noDuplication=1'), {
    source: 'web-hash',
    route: '/roller',
    autoStart: true,
    roller: {
      groupMode: true,
      multiMode: true,
      count: 12,
      noDuplication: true
    }
  })
})

test('invalid schemes, pages and parameter values are rejected safely', () => {
  assert.equal(parseCyreneUri('https://page/roller'), null)
  assert.equal(parseCyreneUri('cyrenenr://page/unknown'), null)
  assert.deepEqual(parseCyreneUri('cyrenenr://page/roller?sex=other&count=-4').roller, { count: 1 })
  assert.equal(parseCyreneUri('cyrenenr://page/roller?unknown=1').autoStart, false)
})
