import puppeteer from 'puppeteer-core'
import { createServer } from 'node:http'
import { readFileSync, statSync, readdirSync } from 'node:fs'
import { join, extname } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OLD_DIR = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\old-build\\dist'
const NEW_DIR = 'D:\\CyreneProject\\CyrenesNameRoller\\dist'
const IDLE_MS = 8000

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' }

function serve(dir) {
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      if (urlPath.endsWith('/')) urlPath += 'index.html'
      const file = join(dir, urlPath)
      try {
        if (!statSync(file).isFile()) throw new Error('not found')
        res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
        res.end(readFileSync(file))
      } catch {
        res.writeHead(404)
        res.end()
      }
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function measure(browser, dir) {
  const { server, port } = await serve(dir)
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    await page.evaluateOnNewDocument(dur => {
      window.__ltCount = 0
      window.__ltMs = 0
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            window.__ltCount++
            window.__ltMs += entry.duration
          }
        }).observe({ entryTypes: ['longtask'] })
      } catch {}
      window.__benchStart = performance.now()
      setTimeout(() => { window.__benchEnd = performance.now() }, dur)
    }, IDLE_MS)
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' })
    await new Promise(r => setTimeout(r, IDLE_MS + 1200))
    const info = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      const scripts = performance.getEntriesByType('resource')
        .filter(e => e.name.endsWith('.js') || e.name.includes('/assets/'))
        .reduce((acc, e) => acc + (e.transferSize || 0), 0)
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
        scriptBytes: scripts,
        longTasks: window.__ltCount || 0,
        longTaskMs: Math.round(window.__ltMs || 0)
      }
    })
    await page.close()
    return info
  } finally {
    server.close()
  }
}

const fileBytes = dir => {
  const { readdirSync } = require('node:fs')
  return readdirSync(join(dir, 'assets')).filter(f => f.endsWith('.js'))
    .reduce((acc, f) => acc + statSync(join(dir, 'assets', f)).size, 0)
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const median = arr => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)]
const rounds = 3
const old = []
const nw = []
for (let i = 0; i < rounds; i++) {
  old.push(await measure(browser, OLD_DIR))
  nw.push(await measure(browser, NEW_DIR))
}
await browser.close()

const summarize = (name, list, bytes) => {
  const m = {
    domContentLoaded: median(list.map(x => x.domContentLoaded)),
    load: median(list.map(x => x.load)),
    longTaskMs: median(list.map(x => x.longTaskMs)),
    longTasks: median(list.map(x => x.longTasks)),
    resScriptBytes: median(list.map(x => x.scriptBytes))
  }
  console.log(`[${name}] DCL=${m.domContentLoaded}ms Load=${m.load}ms 资源脚本=${(m.resScriptBytes / 1024).toFixed(0)}KB(on-wire) 8s长任务=${m.longTasks}次/${m.longTaskMs}ms 资产JS字节=${(bytes / 1024).toFixed(0)}KB(raw)`)
  return m
}
const o = summarize('OLD', old, fileBytes(OLD_DIR))
const n = summarize('NEW', nw, fileBytes(NEW_DIR))
console.log('---')
console.log(`Load 实际页面秒级差异: OLD=${o.load}ms NEW=${n.load}ms`)
console.log(`空闲长任务: OLD=${o.longTaskMs}ms NEW=${n.longTaskMs}ms`)
