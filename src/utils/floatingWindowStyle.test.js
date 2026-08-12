import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FLOATING_WINDOW_STYLES,
  floatingWindowImagePath,
  normalizeFloatingWindowRadius,
  resolveFloatingWindowRadius,
  normalizeFloatingWindowStyle
} from './floatingWindowStyle.js'

test('accepts the built-in and custom floating window styles', () => {
  assert.deepEqual(FLOATING_WINDOW_STYLES, ['text', 'image1', 'image2', 'image3', 'custom'])
  for (const style of FLOATING_WINDOW_STYLES) {
    assert.equal(normalizeFloatingWindowStyle(style), style)
  }
})

test('normalizes freely adjustable floating window radius', () => {
  assert.equal(normalizeFloatingWindowRadius(-10), 0)
  assert.equal(normalizeFloatingWindowRadius(18.6), 19)
  assert.equal(normalizeFloatingWindowRadius(80), 50)
})

test('preserves legacy style radius until the user customizes it', () => {
  assert.equal(resolveFloatingWindowRadius(null, 'text'), 50)
  assert.equal(resolveFloatingWindowRadius(undefined, 'image1'), 0)
  assert.equal(resolveFloatingWindowRadius(24, 'text'), 24)
  assert.equal(resolveFloatingWindowRadius(24, 'custom'), 24)
  assert.equal(resolveFloatingWindowRadius(24, 'image1'), 0)
  assert.equal(resolveFloatingWindowRadius(50, 'image3'), 0)
})

test('falls back to text for invalid styles', () => {
  assert.equal(normalizeFloatingWindowStyle('image4'), 'text')
  assert.equal(normalizeFloatingWindowStyle(null), 'text')
})

test('maps image styles to public asset paths', () => {
  assert.equal(floatingWindowImagePath('text'), '')
  assert.equal(floatingWindowImagePath('image1'), './cyrene1.jpg')
  assert.equal(floatingWindowImagePath('image3'), './cyrene3.jpg')
  assert.equal(floatingWindowImagePath('custom', 'data:image/png;base64,test'), 'data:image/png;base64,test')
})
