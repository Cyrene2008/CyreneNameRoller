import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CNRP_MAGIC,
  PLUGIN_API_VERSION,
  comparePluginVersions,
  satisfiesPluginVersion,
  normalizeAnimationPack,
  normalizeAppearanceColor,
  contrastRatio,
  normalizePluginManifest,
  validatePath
} from '../src/plugin-contract.js'

test('契约常量：CNRP 魔数与 API 版本', () => {
  assert.equal(CNRP_MAGIC, 'CNRP1\n')
  assert.equal(PLUGIN_API_VERSION, '1.3.0')
})

test('版本比较与范围语义', () => {
  assert.equal(comparePluginVersions('1.3.0', '1.2.0'), 1)
  assert.equal(comparePluginVersions('1.2.1', '1.2.0'), 1)
  assert.equal(comparePluginVersions('1.2.0', '1.2.0'), 0)
  assert.equal(satisfiesPluginVersion('1.2.0', '^1.0.0'), true)
  assert.equal(satisfiesPluginVersion('2.0.0', '^1.0.0'), false)
  assert.equal(satisfiesPluginVersion('1.2.5', '~1.2.0'), true)
  assert.equal(satisfiesPluginVersion('1.3.0', '~1.2.0'), false)
  assert.equal(satisfiesPluginVersion('1.0.0', '*'), true)
})

test('动画包契约：gsap 声明规范化与白名单', () => {
  const pack = normalizeAnimationPack({
    schemaVersion: 1,
    presets: [{
      id: 'demo.fade',
      target: 'roller.finish',
      label: '淡入',
      default: true,
      animation: {
        gsap: { from: { opacity: 0, x: -20 }, to: { opacity: 1, x: 0 } },
        options: { duration: 400, delay: 0, ease: 'power2.out', repeat: 0 }
      }
    }]
  }, { id: 'demo' })
  assert.equal(pack.presets[0].animation.engine, 'gsap')
  assert.equal(pack.presets[0].animation.options.ease, 'power2.out')
  assert.throws(() => normalizeAnimationPack({
    schemaVersion: 1,
    presets: [{ id: 'bad', target: 'roller.finish', label: 'X', animation: { gsap: { from: { evil: 1 }, to: {} }, options: { duration: 400 } } }]
  }), /不允许属性 evil/)
})

test('外观契约：颜色与对比度校验', () => {
  assert.equal(normalizeAppearanceColor('#FFFFFF'), '#ffffff')
  assert.throws(() => normalizeAppearanceColor('url(https://evil.example/x.png)'))
  const ratio = contrastRatio([255, 255, 255], [0, 0, 0])
  assert.ok(ratio > 20)
})

test('路径契约：拒绝路径穿越', () => {
  assert.equal(validatePath('assets/a/b.txt'), 'assets/a/b.txt')
  assert.throws(() => validatePath('../escape.txt'))
  assert.throws(() => validatePath('/absolute'))
  assert.throws(() => validatePath('a/../b'))
})

const baseManifest = {
  schemaVersion: 1,
  id: 'cn.example.demo',
  name: '示例',
  version: '1.0.0',
  author: 'demo',
  engine: { min: '1.3.0' },
  entry: 'main.js',
  permissions: ['ui:pages']
}

test('manifest 契约：sdkVersion 默认 1，显式 2 合法', () => {
  assert.equal(normalizePluginManifest(baseManifest).sdkVersion, 1)
  const v2 = normalizePluginManifest({ ...baseManifest, sdkVersion: 2, ui: { schemaVersion: 1, pages: [{ id: 'demo.main', title: '主页', source: 'ui/main.json' }] } })
  assert.equal(v2.sdkVersion, 2)
  assert.equal(v2.ui.pages[0].location, 'plugins')
  assert.throws(() => normalizePluginManifest({ ...baseManifest, sdkVersion: 3 }), /sdkVersion 必须为 1 或 2/)
})

test('manifest 契约：sdkVersion 2 的 ui 段强校验', () => {
  assert.throws(() => normalizePluginManifest({ ...baseManifest, sdkVersion: 2 }), /ui 段无效/)
  assert.throws(() => normalizePluginManifest({ ...baseManifest, sdkVersion: 2, ui: { schemaVersion: 2, pages: [] } }), /ui\.schemaVersion 必须为 1/)
  assert.throws(() => normalizePluginManifest({ ...baseManifest, sdkVersion: 2, ui: { schemaVersion: 1, pages: [{ id: 'x!', title: 'T', source: 'ui.json' }] } }), /ID 无效或重复/)
  assert.throws(() => normalizePluginManifest({ ...baseManifest, sdkVersion: 1, ui: { schemaVersion: 1, pages: [] } }), /sdkVersion 1 插件不允许声明 ui 段/)
  assert.throws(() => normalizePluginManifest({ ...baseManifest, sdkVersion: 2, permissions: [], ui: { schemaVersion: 1, pages: [{ id: 'demo.main', title: 'T', source: 'ui.json' }] } }), /ui 段需要 ui:pages 权限/)
})
