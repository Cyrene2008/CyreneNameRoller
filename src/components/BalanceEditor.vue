<template>
  <div class="balance-editor">
    <div class="editor-toolbar">
      <span class="editor-label">{{ lang === 'en' ? 'Drag points to adjust curve' : '拖动点来调整曲线' }}</span>
      <span class="curve-type-badge">{{ lang === 'en' ? 'Monotone Hermite' : '单调 Hermite 插值' }}</span>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasRef" class="balance-canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp" />
    </div>

    <div class="points-grid">
      <template v-for="(pt, idx) in points" :key="idx">
        <span class="point-label" :class="{ locked: idx === 0 }">P{{ idx + 1 }}</span>
        <FluentInput :model-value="pt.x" type="number" :step="0.1" :disabled="idx === 0" style="width:80px;" @update:model-value="val => { if (idx > 0) { pt.x = parseFloat(val) || 0; clampAndSort(); emitChange(); render() } }" />
        <span class="point-label" :class="{ locked: idx === 0 }">Y (%)</span>
        <FluentInput :model-value="pt.y" type="number" :step="10" :disabled="idx === 0" style="width:80px;" @update:model-value="val => { if (idx > 0) { pt.y = parseFloat(val) || 100; clampAndSort(); emitChange(); render() } }" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import FluentInput from './FluentInput.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [{ x: 0, y: 100 }, { x: 1, y: 300 }, { x: 2, y: 700 }] },
  lang: { type: String, default: 'zh' }
})

const emit = defineEmits(['update:modelValue'])

const canvasRef = ref(null)
const points = ref([
  { x: 0, y: 100 },
  { x: 1, y: 300 },
  { x: 2, y: 700 }
])
const dragging = ref(-1)

function initFromModel() {
  const m = props.modelValue
  if (m && m.length >= 3) {
    points.value = [
      { x: 0, y: 100 },
      { x: Math.max(0.1, m[1].x), y: Math.max(101, m[1].y) },
      { x: Math.max(0.2, m[2].x), y: Math.max(102, m[2].y) }
    ]
  }
}

function clampAndSort() {
  points.value[0] = { x: 0, y: 100 }
  for (let i = 1; i < points.value.length; i++) {
    if (points.value[i].x <= points.value[i - 1].x) points.value[i].x = points.value[i - 1].x + 0.1
    if (points.value[i].y <= points.value[i - 1].y) points.value[i].y = points.value[i - 1].y + 10
  }
}

function emitChange() {
  emit('update:modelValue', points.value.map(p => ({ x: p.x, y: p.y })))
}

function hermiteBasis(t) {
  const t2 = t * t
  const t3 = t2 * t
  return {
    h00: 2 * t3 - 3 * t2 + 1,
    h10: t3 - 2 * t2 + t,
    h01: -2 * t3 + 3 * t2,
    h11: t3 - t2
  }
}

function fitMonotoneHermite(pts) {
  const n = pts.length
  if (n < 2) return (x) => pts[0]?.y ?? 100
  if (n === 2) {
    return (x) => {
      if (x <= pts[0].x) return pts[0].y
      if (x >= pts[1].x) return pts[1].y
      const t = (x - pts[0].x) / (pts[1].x - pts[0].x)
      return pts[0].y + t * (pts[1].y - pts[0].y)
    }
  }

  const deltas = []
  const hs = []
  for (let i = 0; i < n - 1; i++) {
    const h = pts[i + 1].x - pts[i].x
    hs.push(h)
    deltas.push((pts[i + 1].y - pts[i].y) / h)
  }

  const m = new Array(n)
  m[0] = deltas[0]
  m[n - 1] = deltas[n - 2]

  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      m[i] = 0
    } else {
      m[i] = (deltas[i - 1] + deltas[i]) / 2
    }
  }

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(deltas[i]) < 1e-10) {
      m[i] = 0
      m[i + 1] = 0
    } else {
      const alpha = m[i] / deltas[i]
      const beta = m[i + 1] / deltas[i]
      const tau = alpha * alpha + beta * beta
      if (tau > 9) {
        const s = 3 / Math.sqrt(tau)
        m[i] = s * alpha * deltas[i]
        m[i + 1] = s * beta * deltas[i]
      }
    }
  }

  return (x) => {
    if (x <= pts[0].x) return pts[0].y
    if (x >= pts[n - 1].x) return pts[n - 1].y

    let seg = 0
    for (let i = 0; i < n - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) { seg = i; break }
    }

    const h = hs[seg]
    const t = (x - pts[seg].x) / h
    const { h00, h10, h01, h11 } = hermiteBasis(t)

    return h00 * pts[seg].y + h10 * h * m[seg] + h01 * pts[seg + 1].y + h11 * h * m[seg + 1]
  }
}

function dataToCanvas(pt) {
  const canvas = canvasRef.value
  if (!canvas) return { cx: 0, cy: 0 }
  const w = canvas.width, h = canvas.height
  const padL = 60, padR = 30, padT = 20, padB = 40
  const plotW = w - padL - padR, plotH = h - padT - padB
  const xMax = 10, yMin = 100, yMax = 1400
  return {
    cx: padL + (Math.min(pt.x, xMax) / xMax) * plotW,
    cy: padT + (1 - (Math.min(pt.y, yMax) - yMin) / (yMax - yMin)) * plotH
  }
}

function canvasToData(cx, cy) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 100 }
  const w = canvas.width, h = canvas.height
  const padL = 60, padR = 30, padT = 20, padB = 40
  const plotW = w - padL - padR, plotH = h - padT - padB
  const xMax = 10, yMin = 100, yMax = 1400
  return {
    x: Math.max(0, Math.min(xMax, ((cx - padL) / plotW) * xMax)),
    y: Math.max(yMin, Math.min(yMax, yMin + (1 - (cy - padT) / plotH) * (yMax - yMin)))
  }
}

function findPointAt(mouseX, mouseY) {
  const dpr = window.devicePixelRatio || 1
  for (let i = 1; i < points.value.length; i++) {
    const { cx, cy } = dataToCanvas(points.value[i])
    if (Math.abs(mouseX * dpr - cx) < 16 * dpr && Math.abs(mouseY * dpr - cy) < 16 * dpr) return i
  }
  return -1
}

function onMouseDown(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const idx = findPointAt(e.clientX - rect.left, e.clientY - rect.top)
  if (idx >= 0) dragging.value = idx
}

function onMouseMove(e) {
  if (dragging.value <= 0) return
  const rect = canvasRef.value.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const mx = (e.clientX - rect.left) * dpr
  const my = (e.clientY - rect.top) * dpr
  const data = canvasToData(mx, my)
  points.value[dragging.value].x = Math.round(data.x * 10) / 10
  points.value[dragging.value].y = Math.round(data.y / 10) * 10
  clampAndSort()
  emitChange()
  render()
}

function onMouseUp() { dragging.value = -1 }

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(280 * dpr)
  const w = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const padL = 60, padR = 30, padT = 20, padB = 40
  const plotW = w - padL - padR, plotH = h - padT - padB
  const xMax = 10, yMin = 100, yMax = 1400

  function xToPx(x) { return padL + (x / xMax) * plotW }
  function yToPx(y) { return padT + (1 - (y - yMin) / (yMax - yMin)) * plotH }

  ctx.save(); ctx.strokeStyle = 'rgba(234,94,193,0.12)'; ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) { const gx = padL + (plotW * i / 5); ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke() }
  for (let i = 0; i <= 4; i++) { const gy = padT + (plotH * i / 4); ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke() }
  ctx.restore()

  ctx.save(); ctx.strokeStyle = 'rgba(234,94,193,0.3)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke()
  ctx.restore()

  const fs = Math.round(dpr * 11)
  ctx.save(); ctx.fillStyle = '#b07a95'; ctx.font = `${fs}px "HarmonyOS Sans SC", sans-serif`
  for (let i = 0; i <= 5; i++) { const v = (xMax * i / 5).toFixed(1); ctx.textAlign = 'center'; ctx.fillText(v, xToPx(xMax * i / 5), padT + plotH + 16 * dpr) }
  for (let i = 0; i <= 4; i++) { const v = Math.round(yMin + (yMax - yMin) * i / 4); ctx.textAlign = 'right'; ctx.fillText(v + '%', padL - 8 * dpr, yToPx(v) + 4 * dpr) }
  ctx.textAlign = 'center'; ctx.fillText(props.lang === 'en' ? 'Deficit' : '差值', padL + plotW / 2, h - 4 * dpr)
  ctx.save(); ctx.translate(12 * dpr, padT + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(props.lang === 'en' ? 'Boost %' : '倍率 %', 0, 0); ctx.restore()
  ctx.restore()

  const curve = fitMonotoneHermite(points.value)

  ctx.save(); ctx.strokeStyle = '#ea5ec1'; ctx.lineWidth = 3 * dpr; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath()
  for (let i = 0; i <= 300; i++) {
    const x = (i / 300) * xMax
    const y = Math.max(yMin, Math.min(yMax, curve(x)))
    if (i === 0) ctx.moveTo(xToPx(x), yToPx(y)); else ctx.lineTo(xToPx(x), yToPx(y))
  }
  ctx.stroke(); ctx.restore()

  ctx.save()
  points.value.forEach((p, i) => {
    const { cx, cy } = dataToCanvas(p)
    const r = i === dragging.value ? 8 * dpr : 6 * dpr
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = i === dragging.value ? '#d04a9d' : (i === 0 ? '#f09bd7' : '#ea5ec1')
    ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr; ctx.stroke()
  })
  ctx.restore()

  ctx.save()
  const labelFs = Math.round(dpr * 10)
  ctx.font = `bold ${labelFs}px "HarmonyOS Sans SC", sans-serif`
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(234,94,193,0.8)'
  points.value.forEach((p) => {
    const { cx, cy } = dataToCanvas(p)
    const label = `(${p.x.toFixed(1)}, ${Math.round(p.y)}%)`
    ctx.fillText(label, cx, cy - 14 * dpr)
  })
  ctx.restore()
}

watch(() => props.modelValue, (val) => { initFromModel(); nextTick(render) }, { deep: true })
onMounted(() => { initFromModel(); nextTick(render) })
</script>

<style scoped>
.balance-editor { display: flex; flex-direction: column; gap: 12px; }
.editor-toolbar { display: flex; gap: 8px; align-items: center; }
.editor-label { font-size: 13px; color: var(--text-muted); margin-left: auto; }
.curve-type-badge { font-size: 12px; color: var(--accent); background: var(--accent-50); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600; }
.canvas-wrap { border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 12px; background: var(--bg-card-solid); cursor: crosshair; }
.balance-canvas { width: 100%; height: 280px; display: block; border-radius: var(--radius-sm); }
.points-grid { display: grid; grid-template-columns: auto 80px auto 80px; gap: 6px 10px; align-items: center; }
.point-label { font-size: 13px; color: var(--text-secondary); }
.point-label.locked { color: var(--text-muted); opacity: 0.6; }
</style>
