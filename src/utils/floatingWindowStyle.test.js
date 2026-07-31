import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FLOATING_WINDOW_STYLES,
  floatingWindowImagePath,
  normalizeFloatingWindowStyle
} from './floatingWindowStyle.js'

test('accepts exactly the four floating window styles', () => {
  assert.deepEqual(FLOATING_WINDOW_STYLES, ['text', 'image1', 'image2', 'image3'])
  for (const style of FLOATING_WINDOW_STYLES) {
    assert.equal(normalizeFloatingWindowStyle(style), style)
  }
})

test('falls back to text for invalid styles', () => {
  assert.equal(normalizeFloatingWindowStyle('image4'), 'text')
  assert.equal(normalizeFloatingWindowStyle(null), 'text')
})

test('maps image styles to public asset paths', () => {
  assert.equal(floatingWindowImagePath('text'), '')
  assert.equal(floatingWindowImagePath('image1'), './cyrene1.jpg')
  assert.equal(floatingWindowImagePath('image3'), './cyrene3.jpg')
})
