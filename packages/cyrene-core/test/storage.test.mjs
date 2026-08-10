import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SETTINGS,
  normalizeStoredSettings,
  normalizeFloatingWindowStyle,
  normalizeFloatingWindowSize,
  normalizeAutoStopDuration
} from '../src/storage.js'

test('设置迁移：部分保存值合并默认值', () => {
  const settings = normalizeStoredSettings({ language: 'en', peopleCount: 5 })
  assert.equal(settings.language, 'en')
  assert.equal(settings.peopleCount, 5)
  assert.equal(settings.recordCounts, true)
  assert.equal(settings.darkMode, false)
})

test('设置迁移：uiScale v1→v2 按 0.8 缩放并置版本号', () => {
  const settings = normalizeStoredSettings({ uiScale: 100 })
  assert.equal(settings.uiScale, 80)
  assert.equal(settings.uiScaleVersion, 2)
  const again = normalizeStoredSettings({ ...settings })
  assert.equal(again.uiScale, 80)
})

test('设置迁移：无效输入归一化为合法值', () => {
  const settings = normalizeStoredSettings({
    newMemberCountMode: 'unknown',
    floatingWindowStyle: 'evil',
    floatingWindowSize: 999,
    autoStopDuration: -5
  })
  assert.equal(settings.newMemberCountMode, 'midpoint')
  assert.equal(settings.floatingWindowStyle, 'text')
  assert.equal(settings.floatingWindowSize, 256)
  assert.equal(settings.autoStopDuration, 1)
})

test('设置迁移：非对象输入回退到完整默认值', () => {
  assert.deepEqual(normalizeStoredSettings(null), DEFAULT_SETTINGS)
  assert.deepEqual(normalizeStoredSettings([]), DEFAULT_SETTINGS)
})

test('设置归一化器：边界与步进', () => {
  assert.equal(normalizeFloatingWindowStyle('image2'), 'image2')
  assert.equal(normalizeFloatingWindowStyle(undefined), 'text')
  assert.equal(normalizeFloatingWindowSize(62), 64)
  assert.equal(normalizeFloatingWindowSize(40), 40)
  assert.equal(normalizeAutoStopDuration(3.6), 4)
  assert.equal(normalizeAutoStopDuration('60'), 60)
  assert.equal(normalizeAutoStopDuration('abc'), 3)
})
