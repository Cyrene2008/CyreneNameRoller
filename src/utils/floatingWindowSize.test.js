import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_FLOATING_WINDOW_SIZE,
  MAX_FLOATING_WINDOW_SIZE,
  MIN_FLOATING_WINDOW_SIZE,
  floatingWindowTextSize,
  normalizeFloatingWindowSize
} from './floatingWindowSize.js'

test('uses 64px as the default floating window size', () => {
  assert.equal(DEFAULT_FLOATING_WINDOW_SIZE, 64)
  assert.equal(normalizeFloatingWindowSize(undefined), 64)
  assert.equal(normalizeFloatingWindowSize('invalid'), 64)
})

test('clamps floating window size to the supported range', () => {
  assert.equal(MIN_FLOATING_WINDOW_SIZE, 40)
  assert.equal(MAX_FLOATING_WINDOW_SIZE, 256)
  assert.equal(normalizeFloatingWindowSize(20), 40)
  assert.equal(normalizeFloatingWindowSize(200), 200)
  assert.equal(normalizeFloatingWindowSize(300), 256)
})

test('rounds floating window size to the nearest 4px step', () => {
  assert.equal(normalizeFloatingWindowSize(65), 64)
  assert.equal(normalizeFloatingWindowSize(66), 68)
  assert.equal(normalizeFloatingWindowSize('103'), 104)
})

test('scales floating text conservatively with the window', () => {
  assert.equal(floatingWindowTextSize(40), 11)
  assert.equal(floatingWindowTextSize(64), 14)
  assert.equal(floatingWindowTextSize(128), 28)
  assert.equal(floatingWindowTextSize(256), 28)
})
