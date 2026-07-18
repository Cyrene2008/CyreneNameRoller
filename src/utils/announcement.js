// 公告数据源（仅作为原生层失败时的兜底直连顺序）：镜像代理 → 自建 nameapi → 官方 raw → 本地
const ANNOUNCEMENT_URL = 'https://gh.xn--8hvv1o.cn/raw.githubusercontent.com/Cyrene2008/CyreneNameRoller/refs/heads/master/.announcement/latest.json'
const ANNOUNCEMENT_NAMEAPI = 'https://nameapi.cyrene.hi.cn/announcement/latest.json'
const ANNOUNCEMENT_FALLBACK = 'https://raw.githubusercontent.com/Cyrene2008/CyreneNameRoller/master/.announcement/latest.json'
const ANNOUNCEMENT_LOCAL = '/announcements.json'

import { isTauri, tauriAPI } from './tauriAPI'

// 优先走原生层拉取（Tauri 经 Rust reqwest / Electron 经主进程），规避 webview 的 CORS 与网络限制
async function fetchAnnouncementsNative() {
  try {
    if (isTauri()) {
      const r = await tauriAPI.fetchAnnouncements()
      if (r) return r
    } else if (typeof window !== 'undefined' && window.electronAPI?.fetchAnnouncements) {
      const r = await window.electronAPI.fetchAnnouncements()
      if (r && r.ok) return r.data
    }
  } catch (e) {
    console.warn('[announcement] native fetch failed, fallback to webview:', e)
  }
  return null
}

export async function fetchAnnouncements({ noCache = false } = {}) {
  // 1) 原生层
  const native = await fetchAnnouncementsNative()
  if (native != null) {
    return Array.isArray(native) ? native : []
  }

  // 2) 兜底：webview 直连
  const urls = [ANNOUNCEMENT_URL, ANNOUNCEMENT_NAMEAPI, ANNOUNCEMENT_FALLBACK, ANNOUNCEMENT_LOCAL]
  const opts = {}
  if (noCache) {
    opts.cache = 'no-store'
  }
  const stamp = noCache ? `?t=${Date.now()}` : ''
  for (const url of urls) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const resp = await fetch(url + stamp, { ...opts, signal: ctrl.signal })
      clearTimeout(timer)
      if (resp.ok) {
        const data = await resp.json()
        return Array.isArray(data) ? data : []
      }
    } catch {}
  }
  return []
}

export function sortAnnouncements(list) {
  return [...list].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    if (a.important && !b.important) return -1
    if (!a.important && b.important) return 1
    return 0
  })
}
