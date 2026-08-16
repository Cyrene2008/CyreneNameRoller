import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_FLOATING_WINDOW_BACKGROUND_COLOR,
  DEFAULT_FLOATING_WINDOW_TEXT,
  DEFAULT_FLOATING_WINDOW_TEXT_COLOR,
  MAX_FLOATING_WINDOW_TEXT_LENGTH,
  normalizeFloatingWindowBackgroundColor,
  normalizeFloatingWindowText,
  normalizeFloatingWindowTextColor
} from './floatingWindowText.js'

test('normalizes floating window text content', () => {
  assert.equal(normalizeFloatingWindowText(undefined), DEFAULT_FLOATING_WINDOW_TEXT)
  assert.equal(normalizeFloatingWindowText('   '), DEFAULT_FLOATING_WINDOW_TEXT)
  assert.equal(normalizeFloatingWindowText('  开始\n点名  '), '开始 点名')
  assert.equal(normalizeFloatingWindowText('123456789012345'), '123456789012')
  assert.equal(Array.from(normalizeFloatingWindowText('✨'.repeat(20))).length, MAX_FLOATING_WINDOW_TEXT_LENGTH)
})

test('normalizes floating window colors', () => {
  assert.equal(normalizeFloatingWindowBackgroundColor('#ABC'), '#aabbcc')
  assert.equal(normalizeFloatingWindowBackgroundColor('invalid'), DEFAULT_FLOATING_WINDOW_BACKGROUND_COLOR)
  assert.equal(normalizeFloatingWindowTextColor('rgb(1, 2, 3)'), '#010203')
  assert.equal(normalizeFloatingWindowTextColor('invalid'), DEFAULT_FLOATING_WINDOW_TEXT_COLOR)
})
