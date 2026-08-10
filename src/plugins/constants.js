import {
  PLUGIN_ANIMATION_TARGETS,
  PLUGIN_API_VERSION,
  PLUGIN_COMMAND_LOCATIONS,
  PLUGIN_LIFECYCLE_EVENTS,
  PLUGIN_PERMISSIONS,
  PLUGIN_PLATFORM_CAPABILITIES,
  PLUGIN_PLATFORM_IDS
} from '../../packages/cyrene-core/src/plugin-contract.js'

export {
  PLUGIN_ANIMATION_TARGETS,
  PLUGIN_API_VERSION,
  PLUGIN_COMMAND_LOCATIONS,
  PLUGIN_LIFECYCLE_EVENTS,
  PLUGIN_PERMISSIONS,
  PLUGIN_PLATFORM_CAPABILITIES,
  PLUGIN_PLATFORM_IDS
}

export const PLUGIN_LIST_REPOSITORY = 'StarCyrene/CyreneNameRoller'
export const PLUGIN_LIST_PATH = 'plugins/list.json'

export const PLUGIN_DOWNLOAD_SOURCES = [
  { value: 'cyrene', label: 'gh.昔涟.cn' },
  { value: 'ghproxy', label: 'gh-proxy.com' },
  { value: 'github', label: 'GitHub' }
]

function githubRawAlternative(url) {
  const match = String(url || '').match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i)
  return match ? `https://github.com/${match[1]}/${match[2]}/raw/${match[3]}/${match[4]}` : ''
}

export function pluginSourceCandidates(originalUrl, source = 'cyrene') {
  const original = String(originalUrl || '').trim()
  if (!original) return []

  const candidates = []
  const add = value => {
    if (value && !candidates.includes(value)) candidates.push(value)
  }
  if (source === 'github') {
    add(original)
    return candidates
  }

  const proxy = source === 'ghproxy' ? 'https://gh-proxy.com/' : 'https://gh.昔涟.cn/'
  add(`${proxy}${original}`)
  const rawAlternative = githubRawAlternative(original)
  if (rawAlternative) add(`${proxy}${rawAlternative}`)

  // A selected mirror is a preference, not a single point of failure. Direct
  // GitHub remains the final fallback so Web users can still load the catalog.
  add(original)
  return candidates
}

export function pluginSourceUrl(originalUrl, source = 'cyrene') {
  return pluginSourceCandidates(originalUrl, source)[0] || ''
}

export function pluginListUrl(source = 'cyrene') {
  const raw = `https://raw.githubusercontent.com/${PLUGIN_LIST_REPOSITORY}/master/${PLUGIN_LIST_PATH}`
  return pluginSourceUrl(raw, source)
}

export function pluginListCandidates(source = 'cyrene') {
  const raw = `https://raw.githubusercontent.com/${PLUGIN_LIST_REPOSITORY}/master/${PLUGIN_LIST_PATH}`
  return pluginSourceCandidates(raw, source)
}
