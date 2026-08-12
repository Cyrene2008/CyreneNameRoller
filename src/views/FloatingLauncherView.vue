<template>
  <div
    :class="['floating-ball', style === 'text' ? 'text-style' : 'image-style']"
    :style="{ borderRadius: `${effectiveRadius}%` }"
    @contextmenu.prevent
    @pointerdown.prevent="onPointerDown"
    @pointermove.prevent="onPointerMove"
    @pointerup.prevent="onPointerUp"
    @pointercancel.prevent="onPointerCancel"
  >
    <img
      v-if="style !== 'text'"
      class="ball-image"
      :src="floatingWindowImagePath(style, customImage)"
      alt=""
      draggable="false"
      @error="onImageError"
    />
    <span v-else class="ball-text">点名</span>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { dataBridge } from '../utils/dataBridge'
import { isTauri, tauriAPI } from '../utils/tauriAPI'
import { floatingWindowDragPosition } from '../utils/floatingWindowDrag.mjs'
import { floatingWindowImagePath, normalizeFloatingWindowStyle, resolveFloatingWindowRadius } from '../utils/floatingWindowStyle'
import { floatingWindowTextSize, normalizeFloatingWindowSize } from '../utils/floatingWindowSize'

const DRAG_THRESHOLD = 5
const style = ref('text')
const customImage = ref('')
const radius = ref(null)
const effectiveRadius = computed(() => resolveFloatingWindowRadius(radius.value, style.value))
let removeNativeListeners

function applyStyle(value) {
  if (value && typeof value === 'object') {
    customImage.value = typeof value.customImage === 'string' ? value.customImage : customImage.value
    radius.value = value.radius ?? null
    style.value = normalizeFloatingWindowStyle(value.style)
    return
  }
  style.value = normalizeFloatingWindowStyle(value)
}

function onImageError() {
  style.value = 'text'
}

function applySize(value) {
  const size = normalizeFloatingWindowSize(value)
  document.documentElement.style.setProperty('--floating-text-size', `${floatingWindowTextSize(size)}px`)
}

onMounted(async () => {
  const saved = await dataBridge.load('settings')
  customImage.value = typeof saved?.floatingWindowCustomImage === 'string' ? saved.floatingWindowCustomImage : ''
  radius.value = saved?.floatingWindowRadius ?? null
  applyStyle(saved?.floatingWindowStyle)
  applySize(saved?.floatingWindowSize)
  if (isTauri()) {
    const { listen } = await import('@tauri-apps/api/event')
    const removeStyleListener = await listen('floating-window-style-changed', event => applyStyle(event.payload))
    const removeSizeListener = await listen('floating-window-size-changed', event => applySize(event.payload))
    removeNativeListeners = () => { removeStyleListener(); removeSizeListener() }
  }
})

onBeforeUnmount(() => removeNativeListeners?.())

let pointer = null

function onPointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return

  e.currentTarget.setPointerCapture(e.pointerId)
  pointer = {
    id: e.pointerId,
    startClientX: e.clientX,
    startClientY: e.clientY,
    dragged: false,
    moving: false,
    pending: null,
    inFlight: Promise.resolve(),
    drag: null
  }
}

function onPointerMove(e) {
  if (!pointer || e.pointerId !== pointer.id) return

  const dx = e.clientX - pointer.startClientX
  const dy = e.clientY - pointer.startClientY
  if (!pointer.dragged && Math.max(Math.abs(dx), Math.abs(dy)) > DRAG_THRESHOLD) {
    pointer.dragged = true
    pointer.drag = startDrag(pointer.startClientX, pointer.startClientY)
  }

  if (pointer.dragged) movePointer(pointer, e.clientX, e.clientY)
}

async function onPointerUp(e) {
  await finishPointer(e, false)
}

async function onPointerCancel(e) {
  await finishPointer(e, true)
}

async function finishPointer(e, cancelled) {
  if (!pointer || e.pointerId !== pointer.id) return

  const activePointer = pointer
  pointer = null
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  if (activePointer.dragged) {
    movePointer(activePointer, e.clientX, e.clientY)
    await activePointer.inFlight
    const drag = await activePointer.drag
    await drag.end()
  }
  if (!activePointer.dragged && !cancelled) {
    await openMainWindow()
  }
}

async function startDrag(anchorX, anchorY) {
  if (isTauri()) {
    const { getCurrentWindow, PhysicalPosition } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    const scaleFactor = await win.scaleFactor()
    return {
      move: async (clientX, clientY) => {
        const position = floatingWindowDragPosition(
          await win.outerPosition(),
          { x: clientX, y: clientY },
          { x: anchorX, y: anchorY },
          scaleFactor
        )
        await win.setPosition(new PhysicalPosition(position.x, position.y))
      },
      end: () => tauriAPI.saveFloatingWindowPosition()
    }
  }

  return { move: () => Promise.resolve(), end: () => Promise.resolve() }
}

function movePointer(activePointer, clientX, clientY) {
  activePointer.pending = { clientX, clientY }
  if (activePointer.moving) return
  activePointer.moving = true
  activePointer.inFlight = (async () => {
    const drag = await activePointer.drag
    while (activePointer.pending) {
      const next = activePointer.pending
      activePointer.pending = null
      await drag.move(next.clientX, next.clientY)
    }
  })().finally(() => { activePointer.moving = false })
}

async function openMainWindow() {
  if (isTauri()) {
    await tauriAPI.invoke('focus_main_window')
  }
}
</script>

<style scoped>
.floating-ball {
  width: min(100vw, 100vh);
  height: min(100vw, 100vh);
  aspect-ratio: 1;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
  touch-action: none;
  -webkit-app-region: no-drag;
}

.floating-ball.text-style {
  background: var(--accent);
}

.floating-ball.image-style {
  background: transparent;
}

:global(html),
:global(body),
:global(#app) {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent !important;
}

:global(#app) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ball-text {
  font-family: var(--font-display);
  font-size: var(--floating-text-size, 14px);
  font-weight: 600;
  color: #fff;
  pointer-events: none;
}

.ball-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  pointer-events: none;
}

</style>
