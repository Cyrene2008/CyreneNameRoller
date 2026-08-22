import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const DURATION_MS = 8000

const PAGE = (mode) => `<!DOCTYPE html><html><head><style>
  body { margin: 0; height: 100vh; background: #fdf5fa; }
  .banner { position: fixed; left: 40px; top: 40px; width: 600px; height: 48px; overflow: hidden;
    border-radius: 8px; background: rgba(255,255,255,0.35); }
  .bar { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(0,0,0,0.1); }
  @keyframes cd { from { transform: scaleX(1); } to { transform: scaleX(0); } }
</style></head><body>
<div class="banner" id="b"><div class="bar" id="bar"></div></div>
<script>
  const bar = document.getElementById('bar')
  const mode = ${JSON.stringify(mode)}
  if (mode === 'old') {
    let pct = 100
    const start = Date.now()
    window.__tick = setInterval(() => {
      pct = Math.max(0, 100 - (Date.now() - start) / 10000 * 100)
      bar.style.width = pct + '%'
    }, 100)
  } else {
    bar.style.animation = 'cd 10000ms linear forwards'
    bar.style.transformOrigin = 'left center'
  }
</script></body></html>`

async function runMode(browser, mode) {
  const page = await browser.newPage()
  const metrics = { longTasks: 0, longTaskMs: 0, droppedFrames: 0, frames: 0, maxFrameDelta: 0 }
  await page.setViewport({ width: 1280, height: 720 })
  await page.evaluateOnNewDocument(dur => {
    if (window.PerformanceObserver) {
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            window.__ltCount = (window.__ltCount || 0) + 1
            window.__ltMs = (window.__ltMs || 0) + entry.duration
          }
        }).observe({ entryTypes: ['longtask'] })
      } catch {}
    }
    window.__frameCount = 0
    window.__dropped = 0
    window.__maxDelta = 0
    let last = performance.now()
    const loop = t => {
      window.__frameCount++
      const delta = t - last
      if (delta > 33.4) window.__dropped++
      if (delta > window.__maxDelta) window.__maxDelta = delta
      last = t
      if (performance.now() - window.__benchStart < dur) requestAnimationFrame(loop)
    }
    requestAnimationFrame(t => { window.__benchStart = performance.now(); loop(t) })
  }, DURATION_MS)
  await page.goto(`data:text/html,${encodeURIComponent(PAGE(mode))}`)
  await new Promise(r => setTimeout(r, DURATION_MS + 800))
  metrics.longTasks = await page.evaluate(() => window.__ltCount || 0)
  metrics.longTaskMs = await page.evaluate(() => window.__ltMs || 0)
  metrics.frames = await page.evaluate(() => window.__frameCount)
  metrics.droppedFrames = await page.evaluate(() => window.__dropped)
  metrics.maxFrameDelta = await page.evaluate(() => Math.round(window.__maxDelta))
  await page.close()
  return metrics
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const rounds = 3
const result = { old: [], new: [] }
for (let i = 0; i < rounds; i++) {
  result.old.push(await runMode(browser, 'old'))
  result.new.push(await runMode(browser, 'new'))
}
await browser.close()

const median = arr => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)]
const show = name => {
  const r = result[name]
  const agg = {
    longTaskMs: median(r.map(m => m.longTaskMs)),
    longTasks: median(r.map(m => m.longTasks)),
    droppedFrames: median(r.map(m => m.droppedFrames)),
    frames: median(r.map(m => m.frames)),
    maxFrameDelta: median(r.map(m => m.maxFrameDelta))
  }
  console.log(`[${name}] longtask=${agg.longTasks} (${agg.longTaskMs}ms) frames=${agg.frames} dropped=${agg.droppedFrames} maxFrameDelta=${agg.maxFrameDelta}ms`)
  return agg
}
const old = show('old')
const nw = show('new')
console.log('---')
console.log(`longtask 差异: old=${old.longTaskMs}ms vs new=${nw.longTaskMs}ms`)
console.log(`掉帧差异: old=${old.droppedFrames} vs new=${nw.droppedFrames}`)
