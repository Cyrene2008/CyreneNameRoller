const target = (id, policy, allowedStyles, extra = {}) => Object.freeze({
  id,
  platform: 'all',
  visibilityPolicy: policy,
  allowedStyles: Object.freeze([...allowedStyles]),
  ...extra
})

export const COMPONENT_TARGETS = Object.freeze({
  'app.title-bar': target('app.title-bar', 'required', ['foreground', 'background', 'fontFamily', 'fontSize', 'fontWeight', 'density'], { platform: 'tauri', selector: '.titlebar' }),
  'app.version-badge': target('app.version-badge', 'optional', ['foreground', 'background', 'fontSize', 'fontWeight', 'fontFamily', 'padding', 'gap'], { selector: '.version-badge', allowPluginFonts: true }),
  'navigation.dock': target('navigation.dock', 'required', ['size', 'foreground', 'background', 'fontSize', 'fontWeight', 'fontFamily', 'density'], { selector: '.dock' }),
  'navigation.settings-entry': target('navigation.settings-entry', 'protected', [], { selector: null, mappingStatus: 'requires-host-boundary-wrapper' }),
  'roller.current-list': target('roller.current-list', 'required', ['size', 'foreground', 'background', 'fontSize', 'fontWeight', 'fontFamily', 'padding', 'gap'], { selector: '.list-selector-bar', identity: true }),
  'roller.filters': target('roller.filters', 'optional', ['size', 'foreground', 'background', 'fontSize', 'fontWeight', 'fontFamily', 'padding', 'gap'], { selector: ['.switches', '.multi-settings'], allowedLayouts: ['collapse', 'reserve', 'compact'], allowPluginFonts: true }),
  'roller.filter.english-mode': target('roller.filter.english-mode', 'optional', [], { selector: '.english-mode-toggle', allowedLayouts: ['collapse'] }),
  'roller.filter.draw-target': target('roller.filter.draw-target', 'optional', [], { selector: '.draw-target-tabs', allowedLayouts: ['collapse'] }),
  'roller.filter.gender': target('roller.filter.gender', 'optional', [], { selector: '.gender-filter-tabs', allowedLayouts: ['collapse'] }),
  'roller.filter.draw-count': target('roller.filter.draw-count', 'optional', [], { selector: '.draw-count-tabs', allowedLayouts: ['collapse'] }),
  'roller.filter.duplicates': target('roller.filter.duplicates', 'optional', [], { selector: '.duplicate-filter-tabs', allowedLayouts: ['collapse'] }),
  'roller.filter.count': target('roller.filter.count', 'optional', [], { selector: '.multi-settings', allowedLayouts: ['collapse'] }),
  'roller.primary-action': target('roller.primary-action', 'required', ['size', 'foreground', 'background', 'accent', 'fontSize', 'fontWeight', 'fontFamily', 'radius'], { selector: '.start-btn' }),
  'roller.result': target('roller.result', 'protected', ['size', 'foreground', 'background', 'accent', 'fontFamily', 'fontSize', 'fontWeight', 'padding', 'gap', 'radius', 'borderColor', 'borderWidth', 'shadow', 'alignment'], { selector: ['.display-container', '.name-display'], authoritativeText: true, allowPluginFonts: false }),
  'card.controls': target('card.controls', 'replaceable', ['size', 'foreground', 'background', 'fontSize', 'fontWeight', 'fontFamily', 'padding', 'gap'], { selector: '.card-controls' }),
  'card.deck': target('card.deck', 'required', ['size', 'padding', 'gap', 'foreground', 'background'], { selector: '.cards-grid' }),
  'card.item': target('card.item', 'required', ['size', 'foreground', 'background', 'fontSize', 'fontWeight', 'fontFamily', 'radius', 'shadow'], { selector: ['.card', '.card-face'] }),
  'lottery.result': target('lottery.result', 'protected', ['size', 'foreground', 'background', 'accent', 'fontFamily', 'fontSize', 'fontWeight', 'padding', 'gap', 'radius', 'borderColor', 'borderWidth', 'shadow', 'alignment'], { selector: ['.roller-result', '.wheel-result'], authoritativeText: true, allowPluginFonts: false }),
  'statistics.summary': target('statistics.summary', 'optional', ['size', 'foreground', 'background', 'fontSize', 'fontWeight', 'fontFamily', 'padding', 'gap'], { selector: '.stats-summary' })
})

export const COMPONENT_TARGET_IDS = Object.freeze(Object.keys(COMPONENT_TARGETS))
export const COMPONENT_STYLE_PROPERTIES = Object.freeze([
  'size', 'scale', 'foreground', 'background', 'accent', 'fontFamily', 'fontSize', 'fontWeight',
  'lineHeight', 'padding', 'gap', 'radius', 'borderColor', 'borderWidth', 'shadow', 'alignment', 'density'
])

export function getComponentTarget(id, platform = 'web') {
  const descriptor = COMPONENT_TARGETS[String(id || '')]
  if (!descriptor) return null
  if (descriptor.platform !== 'all' && descriptor.platform !== platform) return { ...descriptor, available: false }
  return { ...descriptor, available: true }
}

export function listComponentTargets(platform = 'web') {
  return COMPONENT_TARGET_IDS.map(id => getComponentTarget(id, platform))
}
