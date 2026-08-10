import { getComponentTarget } from './component-registry.js'

const VISIBILITIES = new Set(['visible', 'hidden', 'replaced'])
const LAYOUTS = new Set(['collapse', 'reserve', 'compact'])

function fail(code, message) { throw Object.assign(new Error(message), { code }) }

export function normalizeComponentOverridePacks(value, permissions, { platform = 'web' } = {}) {
  if (value === undefined) return []
  if (!permissions.includes('ui:component-overrides')) fail('PLUGIN_PERMISSION_DENIED', 'componentOverridePacks 需要 ui:component-overrides 权限')
  if (!Array.isArray(value) || value.length > 16) fail('PLUGIN_UI_SCHEMA_INVALID', 'componentOverridePacks 最多 16 项')
  const ids = new Set()
  return value.map((pack, index) => {
    const id = String(pack?.id || '')
    if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id) || !pack.targets || typeof pack.targets !== 'object' || Array.isArray(pack.targets)) fail('PLUGIN_UI_SCHEMA_INVALID', `componentOverridePacks[${index}] 无效`)
    ids.add(id)
    const targets = {}
    for (const [targetId, raw] of Object.entries(pack.targets)) {
      const descriptor = getComponentTarget(targetId, platform)
      if (!descriptor) fail('PLUGIN_UI_UNKNOWN_TARGET', `未知组件目标：${targetId}`)
      if (!descriptor.available) continue
      if (descriptor.visibilityPolicy === 'protected' || descriptor.visibilityPolicy === 'required') fail(descriptor.visibilityPolicy === 'protected' ? 'PLUGIN_UI_PROTECTED_TARGET' : 'PLUGIN_UI_REQUIRED_TARGET', `${targetId} 不允许隐藏或替换`)
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('PLUGIN_UI_SCHEMA_INVALID', `${targetId} 覆盖声明无效`)
      const visibility = raw.visibility === undefined ? 'visible' : String(raw.visibility)
      if (!VISIBILITIES.has(visibility)) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${targetId}.visibility 无效`)
      const layout = raw.layout === undefined ? 'collapse' : String(raw.layout)
      if (!LAYOUTS.has(layout)) fail('PLUGIN_UI_VALUE_OUT_OF_RANGE', `${targetId}.layout 无效`)
      if (visibility === 'replaced') fail('PLUGIN_UI_REPLACEMENT_UNAVAILABLE', `${targetId} 当前没有可用宿主替代视图`)
      targets[targetId] = { visibility, layout }
    }
    return { id, title: String(pack.title || id).slice(0, 120), description: String(pack.description || '').slice(0, 300), targets }
  })
}

export function applyOverridePack(current, pack, { enabled = true } = {}) {
  const next = { ...(current || {}) }
  if (!enabled) {
    for (const targetId of Object.keys(pack?.targets || {})) delete next[targetId]
    return next
  }
  for (const [targetId, state] of Object.entries(pack?.targets || {})) next[targetId] = { ...state, packId: pack.id }
  return next
}

export function overrideStateForTarget(targetId, packs = [], selectedValue = '') {
  const pack = packs.find(item => item.value === selectedValue)
  return pack?.targets?.[targetId] ? { ...pack.targets[targetId], packId: pack.value } : { visibility: 'visible', layout: 'collapse', packId: '' }
}

export const COMPONENT_OVERRIDE_VISIBILITIES = Object.freeze([...VISIBILITIES])
export const COMPONENT_OVERRIDE_LAYOUTS = Object.freeze([...LAYOUTS])

