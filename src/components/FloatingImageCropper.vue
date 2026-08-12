<template>
  <FluentModal :model-value="modelValue" :title="lang === 'en' ? 'Crop floating image' : '裁切悬浮窗图片'" max-width="620px" @update:model-value="emit('update:modelValue', $event)">
    <div class="cropper-body">
      <div
        ref="viewport"
        class="cropper-viewport"
        @pointerdown.prevent="pointerDown"
        @pointermove.prevent="pointerMove"
        @pointerup.prevent="pointerUp"
        @pointercancel.prevent="pointerUp"
        @wheel.prevent="onWheel"
      >
        <img v-if="source" ref="image" :src="source" alt="" draggable="false" :style="imageStyle" @load="initializeImage" />
        <div class="cropper-ring" />
      </div>
      <div class="cropper-zoom">
        <FluentIcon icon="zoom-out-20-regular" :width="18" />
        <input v-model.number="zoom" type="range" min="1" max="3" step="0.01" :aria-label="lang === 'en' ? 'Zoom' : '缩放'" />
        <FluentIcon icon="zoom-in-20-regular" :width="18" />
      </div>
    </div>
    <template #footer>
      <FluentButton variant="secondary" size="sm" @click="emit('update:modelValue', false)">{{ lang === 'en' ? 'Cancel' : '取消' }}</FluentButton>
      <FluentButton variant="primary" size="sm" :disabled="!source" @click="save">{{ lang === 'en' ? 'Use image' : '使用图片' }}</FluentButton>
    </template>
  </FluentModal>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  source: { type: String, default: '' },
  lang: { type: String, default: 'zh' }
})
const emit = defineEmits(['update:modelValue', 'save'])
const viewport = ref(null)
const image = ref(null)
const zoom = ref(1)
const offset = ref({ x: 0, y: 0 })
const imageSize = ref({ width: 1, height: 1 })
const viewportSize = ref(1)
let pointer = null

const baseScale = computed(() => Math.max(
  viewportSize.value / imageSize.value.width,
  viewportSize.value / imageSize.value.height
))
const imageStyle = computed(() => ({
  width: `${imageSize.value.width}px`,
  height: `${imageSize.value.height}px`,
  transform: `translate(calc(-50% + ${offset.value.x}px), calc(-50% + ${offset.value.y}px)) scale(${baseScale.value * zoom.value})`
}))

watch(() => props.source, () => nextTick(initializeImage))
watch(() => props.modelValue, visible => { if (visible) nextTick(initializeImage) })
watch(zoom, () => { offset.value = constrainedOffset(offset.value.x, offset.value.y) })
function reset() { zoom.value = 1; offset.value = { x: 0, y: 0 } }
function initializeImage() {
  const img = image.value
  const box = viewport.value
  if (!img?.naturalWidth || !box?.clientWidth) return
  imageSize.value = { width: img.naturalWidth, height: img.naturalHeight }
  viewportSize.value = box.clientWidth
  reset()
}
function constrainedOffset(x, y) {
  const scale = baseScale.value * zoom.value
  const maxX = Math.max(0, (imageSize.value.width * scale - viewportSize.value) / 2)
  const maxY = Math.max(0, (imageSize.value.height * scale - viewportSize.value) / 2)
  return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) }
}
function pointerDown(event) {
  event.currentTarget.setPointerCapture(event.pointerId)
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: offset.value.x, startY: offset.value.y }
}
function pointerMove(event) {
  if (!pointer || pointer.id !== event.pointerId) return
  offset.value = constrainedOffset(pointer.startX + event.clientX - pointer.x, pointer.startY + event.clientY - pointer.y)
}
function pointerUp(event) {
  if (pointer?.id !== event.pointerId) return
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  pointer = null
}
function onWheel(event) { zoom.value = Math.min(3, Math.max(1, zoom.value - event.deltaY * 0.001)) }
function save() {
  const img = image.value
  const box = viewport.value
  if (!img || !box) return
  const outputSize = 512
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext('2d')
  const scale = baseScale.value * zoom.value
  const displayWidth = img.naturalWidth * scale
  const displayHeight = img.naturalHeight * scale
  const ratio = outputSize / box.clientWidth
  context.drawImage(
    img,
    (outputSize - displayWidth * ratio) / 2 + offset.value.x * ratio,
    (outputSize - displayHeight * ratio) / 2 + offset.value.y * ratio,
    displayWidth * ratio,
    displayHeight * ratio
  )
  emit('save', canvas.toDataURL('image/png'))
  emit('update:modelValue', false)
}
</script>

<style scoped>
.cropper-body { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.cropper-viewport { position: relative; width: min(72vw, 420px); aspect-ratio: 1; overflow: hidden; background: #151515; cursor: grab; touch-action: none; }
.cropper-viewport:active { cursor: grabbing; }
.cropper-viewport img { position: absolute; left: 50%; top: 50%; max-width: none; transform-origin: center; user-select: none; pointer-events: none; }
.cropper-ring { position: absolute; inset: 0; border: 1px solid rgba(255,255,255,.8); box-shadow: inset 0 0 0 1px rgba(0,0,0,.35); pointer-events: none; }
.cropper-zoom { width: min(72vw, 420px); display: grid; grid-template-columns: 20px minmax(0, 1fr) 20px; align-items: center; gap: 10px; color: var(--text-secondary); }
.cropper-zoom input { width: 100%; }
</style>
