const COMPASS_REPO = 'Cyrene2008/CyreneCompass'
const COMPASS_FALLBACK_URLS = [
  `https://api.github.com/repos/${COMPASS_REPO}/releases`,
  `https://api.kkgithub.com/repos/${COMPASS_REPO}/releases`
]

export const COMPASS_GITHUB_URL = `https://github.com/${COMPASS_REPO}`

export async function fetchCompassReleases() {
  for (const url of COMPASS_FALLBACK_URLS) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10000)
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: ctrl.signal
      })
      clearTimeout(timer)
      if (resp.ok) {
        const releases = await resp.json()
        if (Array.isArray(releases)) return releases
      }
    } catch {}
  }
  throw new Error('all sources failed')
}

export function formatBytes(size) {
  if (!Number.isFinite(Number(size)) || Number(size) <= 0) return ''
  const mb = Number(size) / 1024 / 1024
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(1)} MB`
}