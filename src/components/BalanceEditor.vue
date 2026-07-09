<template>
  <div class="balance-editor">
    <div class="editor-toolbar">
      <FluentButton variant="secondary" size="sm" :disabled="points.length <= 2" @click="removePoint">
        <FluentIcon icon="subtract-16-regular" :width="14" /> {{ lang === 'en' ? 'Remove Point' : '删除点' }}
      </FluentButton>
      <FluentButton variant="secondary" size="sm" :disabled="points.length >= 4" @click="addPoint">
        <FluentIcon icon="add-16-regular" :width="14" /> {{ lang === 'en' ? 'Add Point' : '添加点' }}
      </FluentButton>
      <span class="editor-label">{{ lang === 'en' ? 'Drag points to adjust' : '拖动点来调整曲线' }}</span>
      <span class="curve-type-badge">{{ curveTypeLabel }}</span>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasRef" class="balance-canvas" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp" />
    </div>

    <div class="points-grid">
      <template v-for="(pt, idx) in points" :key="idx">
        <span class="point-label">{{ lang === 'en' ? `P${idx+1}` : `点${idx+1}` }} X</span>
        <FluentInput :model-value="pt.x" type="number" :step="0.1" style="width:80px;" @update:model-value="val => { pt.x = parseFloat(val) || 0; ensureMonotonic(); emitChange(); render() }" />
        <span class="point-label">Y (%)</span>
        <FluentInput :model-value="pt.y" type="number" :step="1" style="width:80px;" @update:model-value="val => { pt.y = parseFloat(val) || 100; ensureMonotonic(); emitChange(); render() }" />
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
  modelValue: { type: Array, default: () => [{ x: 0, y: 100 }, { x: 1, y: 200 }, { x: 2, y: 500 }] },
  lang: { type: String, default: 'zh' }
})

const emit = defineEmits(['update:modelValue'])

const canvasRef = ref(null)
const points = ref(JSON.parse(JSON.stringify(props.modelValue)))
const dragging = ref(-1)

const curveType = computed(() => {
  if (points.value.length === 2) return 'linear'
  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  const allSameSlope = pts.length >= 3 && Math.abs((pts[2].y - pts[0].y) / Math.max(pts[2].x - pts[0].x, 0.001) - (pts[1].y - pts[0].y) / Math.max(pts[1].x - pts[0].x, 0.001)) < 10
  if (allSameSlope) return 'linear'
  const yRange = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))
  const xRange = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
  if (yRange > 0 && xRange > 0) {
    const ratio = (pts[pts.length - 1].y - pts[0].y) / yRange
    if (ratio > 1.5) return 'power'
  }
  return 'quadratic'
})

const curveTypeLabel = computed(() => {
  const types = { linear: '线性', quadratic: '二次', power: '幂函数', logarithmic: '对数' }
  return props.lang === 'en' ? curveType.value : (types[curveType.value] || '二次')
})

const summaryText = computed(() => {
  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  return `${props.lang === 'en' ? 'Points' : '控制点'}: ${pts.length} | ${props.lang === 'en' ? 'Type' : '类型'}: ${curveTypeLabel.value}`
})

function ensureMonotonic() {
  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y <= pts[i - 1].y) {
      pts[i].y = pts[i - 1].y + 10
    }
  }
  points.value = pts
}

function addPoint() {
  if (points.value.length >= 4) return
  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  const last = pts[pts.length - 1]
  pts.push({ x: Math.round((last.x + 1) * 10) / 10, y: last.y + 100 })
  points.value = pts
  ensureMonotonic()
  emitChange()
  nextTick(render)
}

function removePoint() {
  if (points.value.length <= 2) return
  points.value.pop()
  emitChange()
  nextTick(render)
}

function emitChange() {
  emit('update:modelValue', points.value.map(p => ({ x: p.x, y: p.y })))
}

function getCanvasCoords(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function findPointAt(cx, cy) {
  const canvas = canvasRef.value
  const w = canvas.width; const h = canvas.height
  const rect = canvas.getBoundingClientRect()
  const scaleX = w / rect.width; const scaleY = h / rect.height
  for (let i = 0; i < points.value.length; i++) {
    const pt = points.value[i]
    const px = pt.x / 10 * (w - 80) + 50
    const py = h - 30 - (pt.y - 100) / 1200 * (h - 60)
    if (Math.abs(cx * scaleX - px) < 15 && Math.abs(cy * scaleY - py) < 15) return i
  }
  return -1
}

function onMouseDown(e) {
  const { x, y } = getCanvasCoords(e)
  const idx = findPointAt(x, y)
  if (idx >= 0) dragging.value = idx
}

function onMouseMove(e) {
  if (dragging.value < 0) return
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const { x, y } = getCanvasCoords(e)
  const w = canvas.width; const h = canvas.height
  const scaleX = w / rect.width; const scaleY = h / rect.height

  const graphX = Math.max(0, Math.min(10, ((x * scaleX) - 50) / (w - 80) * 10))
  const graphY = Math.max(100, Math.min(1400, 100 + (1 - (y * scaleY - 30) / (h - 60)) * 1200))

  points.value[dragging.value].x = Math.round(graphX * 10) / 10
  points.value[dragging.value].y = Math.round(graphY)
  ensureMonotonic()
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
  const w = canvas.width; const h = canvas.height

  ctx.clearRect(0, 0, w, h)

  const padL = 50, padR = 30, padT = 20, padB = 30
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  ctx.save(); ctx.strokeStyle = '#fce4f0'; ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) { const gx = padL + (plotW * i / 5); ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke() }
  for (let i = 0; i <= 4; i++) { const gy = padT + (plotH * i / 4); ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke() }
  ctx.restore()

  ctx.save(); ctx.strokeStyle = '#f09bd7'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke()
  ctx.restore()

  const xMax = 10; const yMin = 100; const yMax = 1400
  function xToPx(x) { return padL + (x / xMax) * plotW }
  function yToPx(y) { return padT + (1 - (y - yMin) / (yMax - yMin)) * plotH }

  const pts = points.value.slice().sort((a, b) => a.x - b.x)
  ctx.save(); ctx.strokeStyle = '#ea5ec1'; ctx.lineWidth = 3; ctx.beginPath()
  for (let i = 0; i <= 200; i++) {
    const x = xMax * (i / 200)
    let y = interpolate(pts, x)
    y = Math.max(yMin, Math.min(yMax, y))
    if (i === 0) ctx.moveTo(xToPx(x), yToPx(y)); else ctx.lineTo(xToPx(x), yToPx(y))
  }
  ctx.stroke(); ctx.restore()

  ctx.save()
  pts.forEach((p, i) => {
    const px = xToPx(p.x); const py = yToPx(p.y)
    ctx.beginPath(); ctx.arc(px, py, i === dragging.value ? 8 : 6, 0, Math.PI * 2)
    ctx.fillStyle = i === dragging.value ? '#d04a9d' : '#ea5ec1'
    ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
  })
  ctx.restore()

  ctx.save(); ctx.fillStyle = '#b07a95'; ctx.font = `${Math.round(dpr * 11)}px "HarmonyOS Sans SC", sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(props.lang === 'en' ? 'Deficit' : '差值', padL + plotW / 2, h - 6)
  ctx.save(); ctx.translate(14, padT + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(props.lang === 'en' ? 'Boost %' : '倍率%', 0, 0); ctx.restore()
  ctx.textAlign = 'left'; ctx.fillText('100%', 4, yToPx(100) + 4); ctx.fillText('1400%', 4, yToPx(1400) + 4)
  ctx.restore()
}

function interpolate(pts, x) {
  if (pts.length === 2) {
    const t = (x - pts[0].x) / Math.max(pts[1].x - pts[0].x, 0.001)
    return pts[0].y + t * (pts[1].y - pts[0].y)
  }
  const sorted = pts.slice().sort((a, b) => a.x - b.x)
  if (x <= sorted[0].x) return sorted[0].y
  if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y
  let sum = 0
  for (let i = 0; i < sorted.length; i++) {
    let li = 1
    for (let j = 0; j < sorted.length; j++) {
      if (i !== j) li *= (x - sorted[j].x) / Math.max(sorted[i].x - sorted[j].x, 0.0001)
    }
    sum += sorted[i].y * li
  }
  return sum
}

watch(() => props.modelValue, (val) => {
  points.value = JSON.parse(JSON.stringify(val))
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
