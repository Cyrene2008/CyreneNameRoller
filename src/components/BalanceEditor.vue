<template>
  <div class="balance-editor">
    <div class="editor-toolbar">
      <FluentButton variant="secondary" size="sm" :disabled="points.length <= 2" @click="removePoint">
        <FluentIcon icon="subtract-16-regular" :width="14" /> {{ lang === 'en' ? 'Remove' : '删除点' }}
      </FluentButton>
      <FluentButton variant="secondary" size="sm" :disabled="points.length >= 4" @click="addPoint">
        <FluentIcon icon="add-16-regular" :width="14" /> {{ lang === 'en' ? 'Add' : '添加点' }}
      </FluentButton>
      <span class="editor-label">{{ lang === 'en' ? 'Drag points on chart' : '在图表上拖动点' }}</span>
      <span class="curve-type-badge">{{ lang === 'en' ? 'Piecewise Linear' : '分段线性' }}</span>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasRef" class="balance-canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp" />
    </div>

    <div v-if="points.length > 2" class="points-grid">
      <template v-for="(pt, idx) in points" :key="idx">
        <span class="point-label">P{{ idx + 1 }} X</span>
        <FluentInput :model-value="pt.x" type="number" :step="0.1" style="width:80px;" @update:model-value="val => { pt.x = parseFloat(val) || 0; ensureMonotonic(); emitChange(); render() }" />
        <span class="point-label">Y (%)</span>
        <FluentInput :model-value="pt.y" type="number" :step="10" style="width:80px;" @update:model-value="val => { pt.y = parseFloat(val) || 100; ensureMonotonic(); emitChange(); render() }" />
      </template>
    </div>

    <div class="preview-summary">{{ summaryText }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import FluentButton from './FluentButton.vue'
import FluentIcon from './FluentIcon.vue'
import FluentInput from './FluentInput.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [{ x: 0, y: 100 }, { x: 2, y: 500 }] },
  lang: { type: String, default: 'zh' }
})

const emit = defineEmits(['update:modelValue'])

const canvasRef = ref(null)
const points = ref(JSON.parse(JSON.stringify(props.modelValue)).sort((a, b) => a.x - b.x))
const dragging = ref(-1)

const summaryText = computed(() => {
  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  const type = pts.length === 2 ? 'Linear' : `Piecewise (${pts.length - 1} seg)`
  return `Points: ${pts.length} | Type: ${type}`
})

function ensureMonotonic() {
  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y <= pts[i - 1].y) pts[i].y = pts[i - 1].y + 10
  }
  points.value = pts
}

function addPoint() {
  if (points.value.length >= 4) return
  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  const last = pts[pts.length - 1]
  const newX = Math.round((last.x + 1) * 10) / 10
  const newY = Math.round(last.y * 1.5 / 10) * 10
  pts.push({ x: newX, y: Math.max(100, newY) })
  points.value = pts
  ensureMonotonic(); emitChange(); nextTick(render)
}

function removePoint() {
  if (points.value.length <= 2) return
  points.value.pop()
  emitChange(); nextTick(render)
}

function emitChange() {
  emit('update:modelValue', points.value.map(p => ({ x: p.x, y: p.y })))
}

function piecewiseLinear(pts, x) {
  const sorted = pts.slice().sort((a, b) => a.x - b.x)
  if (x <= sorted[0].x) return sorted[0].y
  if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y
  for (let i = 0; i < sorted.length - 1; i++) {
    if (x >= sorted[i].x && x <= sorted[i + 1].x) {
      const t = (x - sorted[i].x) / Math.max(sorted[i + 1].x - sorted[i].x, 0.0001)
      return sorted[i].y + t * (sorted[i + 1].y - sorted[i].y)
    }
  }
  return sorted[sorted.length - 1].y
}

function getCanvasMousePos(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  return {
    x: (e.clientX - rect.left) * dpr,
    y: (e.clientY - rect.top) * dpr,
    cssX: e.clientX - rect.left,
    cssY: e.clientY - rect.top
  }
}

function dataToCanvas(pt) {
  const canvas = canvasRef.value
  const w = canvas.width; const h = canvas.height
  const padL = 60, padR = 30, padT = 20, padB = 40
  const plotW = w - padL - padR; const plotH = h - padT - padB
  const xMax = 10; const yMin = 100; const yMax = 1400
  return {
    cx: padL + (pt.x / xMax) * plotW,
    cy: padT + (1 - (pt.y - yMin) / (yMax - yMin)) * plotH
  }
}

function canvasToData(cx, cy) {
  const canvas = canvasRef.value
  const w = canvas.width; const h = canvas.height
  const padL = 60, padR = 30, padT = 20, padB = 40
  const plotW = w - padL - padR; const plotH = h - padT - padB
  const xMax = 10; const yMin = 100; const yMax = 1400
  return {
    x: Math.max(0, Math.min(xMax, ((cx - padL) / plotW) * xMax)),
    y: Math.max(yMin, Math.min(yMax, yMin + (1 - (cy - padT) / plotH) * (yMax - yMin)))
  }
}

function findPointAt(mouseX, mouseY) {
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  for (let i = 0; i < points.value.length; i++) {
    const { cx, cy } = dataToCanvas(points.value[i])
    if (Math.abs(mouseX * dpr - cx) < 16 * dpr && Math.abs(mouseY * dpr - cy) < 16 * dpr) return i
  }
  return -1
}

function onMouseDown(e) {
  const pos = getCanvasMousePos(e)
  const idx = findPointAt(pos.cssX, pos.cssY)
  if (idx >= 0) dragging.value = idx
}

function onMouseMove(e) {
  if (dragging.value < 0) return
  const pos = getCanvasMousePos(e)
  const data = canvasToData(pos.x, pos.y)
  points.value[dragging.value].x = Math.round(data.x * 10) / 10
  points.value[dragging.value].y = Math.round(data.y / 10) * 10
  ensureMonotonic(); emitChange(); render()
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
  const w = canvas.width; const h = canvas.height

  ctx.clearRect(0, 0, w, h)

  const padL = 60, padR = 30, padT = 20, padB = 40
  const plotW = w - padL - padR; const plotH = h - padT - padB
  const xMax = 10; const yMin = 100; const yMax = 1400

  function xToPx(x) { return padL + (x / xMax) * plotW }
  function yToPx(y) { return padT + (1 - (y - yMin) / (yMax - yMin)) * plotH }

  ctx.save(); ctx.strokeStyle = 'rgba(234,94,193,0.12)'; ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) { const gx = padL + (plotW * i / 5); ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke() }
  for (let i = 0; i <= 4; i++) { const gy = padT + (plotH * i / 4); ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke() }
  ctx.restore()

  ctx.save(); ctx.strokeStyle = 'rgba(234,94,193,0.3)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke()
  ctx.restore()

  const axisFontSize = Math.round(dpr * 11)
  ctx.save(); ctx.fillStyle = '#b07a95'; ctx.font = `${axisFontSize}px "HarmonyOS Sans SC", sans-serif`

  for (let i = 0; i <= 5; i++) {
    const val = (xMax * i / 5).toFixed(1)
    const px = xToPx(xMax * i / 5)
    ctx.textAlign = 'center'; ctx.fillText(val, px, padT + plotH + 16 * dpr)
  }
  for (let i = 0; i <= 4; i++) {
    const val = Math.round(yMin + (yMax - yMin) * i / 4)
    const py = yToPx(val)
    ctx.textAlign = 'right'; ctx.fillText(val + '%', padL - 8 * dpr, py + 4 * dpr)
  }

  ctx.textAlign = 'center'; ctx.fillText(props.lang === 'en' ? 'Deficit' : '差值', padL + plotW / 2, h - 4 * dpr)
  ctx.save(); ctx.translate(12 * dpr, padT + plotH / 2); ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'; ctx.fillText(props.lang === 'en' ? 'Boost %' : '倍率 %', 0, 0); ctx.restore()
  ctx.restore()

  const pts = points.value.slice().sort((a, b) => a.x - b.x)

  ctx.save(); ctx.strokeStyle = '#ea5ec1'; ctx.lineWidth = 3 * dpr; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath()
  for (let i = 0; i <= 200; i++) {
    const x = xMax * (i / 200)
    const y = Math.max(yMin, Math.min(yMax, piecewiseLinear(pts, x)))
    if (i === 0) ctx.moveTo(xToPx(x), yToPx(y)); else ctx.lineTo(xToPx(x), yToPx(y))
  }
  ctx.stroke(); ctx.restore()

  ctx.save()
  pts.forEach((p, i) => {
    const { cx, cy } = dataToCanvas(p)
    const r = i === dragging.value ? 8 * dpr : 6 * dpr
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = i === dragging.value ? '#d04a9d' : '#ea5ec1'
    ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr; ctx.stroke()
  })
  ctx.restore()

  if (pts.length > 2) {
    ctx.save()
    const labelFontSize = Math.round(dpr * 10)
    ctx.font = `bold ${labelFontSize}px "HarmonyOS Sans SC", sans-serif`
    ctx.textAlign = 'center'
    pts.forEach((p) => {
      const { cx, cy } = dataToCanvas(p)
      const label = `${p.x.toFixed(1)}, ${Math.round(p.y)}%`
      ctx.fillStyle = 'rgba(234,94,193,0.8)'
      ctx.fillText(label, cx, cy - 12 * dpr)
    })
    ctx.restore()
  }
}

watch(() => props.modelValue, (val) => {
  points.value = JSON.parse(JSON.stringify(val)).sort((a, b) => a.x - b.x)
  nextTick(render)
}, { deep: true })

onMounted(() => { nextTick(render) })
</script>

<style scoped>
.balance-editor { display: flex; flex-direction: column; gap: 12px; }
.editor-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.editor-label { font-size: 13px; color: var(--text-muted); margin-left: auto; }
.curve-type-badge { font-size: 12px; color: var(--accent); background: var(--accent-50); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600; }
.canvas-wrap { border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 12px; background: var(--bg-card-solid); cursor: crosshair; }
.balance-canvas { width: 100%; height: 280px; display: block; border-radius: var(--radius-sm); }
.points-grid { display: grid; grid-template-columns: auto 80px auto 80px; gap: 6px 10px; align-items: center; }
.point-label { font-size: 13px; color: var(--text-secondary); }
.preview-summary { font-size: 13px; color: var(--text-muted); text-align: center; }
</style>
