<template>
  <div
    :class="['floating-ball', style === 'text' ? 'text-style' : 'image-style']"
    @contextmenu.prevent
    @pointerdown.prevent="onPointerDown"
    @pointermove.prevent="onPointerMove"
    @pointerup.prevent="onPointerUp"
    @pointercancel.prevent="onPointerCancel"
  >
    <img
      v-if="style !== 'text'"
      class="ball-image"
      :src="floatingWindowImagePath(style)"
      alt=""
      draggable="false"
      @error="onImageError"
    />
    <span v-else class="ball-text">点名</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { dataBridge } from '../utils/dataBridge'
import { isTauri, tauriAPI } from '../utils/tauriAPI'
import { floatingWindowImagePath, normalizeFloatingWindowStyle } from '../utils/floatingWindowStyle'
import { floatingWindowTextSize, normalizeFloatingWindowSize } from '../utils/floatingWindowSize'

const DRAG_THRESHOLD = 5
const style = ref('text')
let removeNativeListeners

function applyStyle(value) {
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
  applyStyle(saved?.floatingWindowStyle)
  applySize(saved?.floatingWindowSize)
  if (isTauri()) {
    const { listen } = await import('@tauri-apps/api/event')
    const removeStyleListener = await listen('floating-window-style-changed', event => applyStyle(event.payload))
    const removeSizeListener = await listen('floating-window-size-changed', event => applySize(event.payload))
    removeNativeListeners = () => { removeStyleListener(); removeSizeListener() }
  } else {
    const removeStyleListener = window.electronAPI?.onFloatingWindowStyleChanged?.(applyStyle)
    const removeSizeListener = window.electronAPI?.onFloatingWindowSizeChanged?.(applySize)
    removeNativeListeners = () => { removeStyleListener?.(); removeSizeListener?.() }
  }
})

onBeforeUnmount(() => removeNativeListeners?.())

let pointer = null

function onPointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return

  e.currentTarget.setPointerCapture(e.pointerId)
  pointer = {
    id: e.pointerId,
    startScreenX: e.screenX,
    startScreenY: e.screenY,
    lastScreenX: e.screenX,
    lastScreenY: e.screenY,
    dragged: false,
    moving: false,
    pending: null,
    inFlight: Promise.resolve(),
    drag: null
  }
}

function onPointerMove(e) {
  if (!pointer || e.pointerId !== pointer.id) return

  const dx = e.screenX - pointer.startScreenX
  const dy = e.screenY - pointer.startScreenY
  if (!pointer.dragged && Math.max(Math.abs(dx), Math.abs(dy)) > DRAG_THRESHOLD) {
    pointer.dragged = true
    pointer.drag = startDrag()
  }

  if (pointer.dragged) movePointer(pointer, e.screenX, e.screenY)
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
    movePointer(activePointer, e.screenX, e.screenY)
    await activePointer.inFlight
    const drag = await activePointer.drag
    await drag.end()
  }
  if (!activePointer.dragged && !cancelled) {
    await openMainWindow()
  }
}

async function startDrag() {
  if (isTauri()) {
    const { getCurrentWindow, LogicalPosition } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    const pos = await win.outerPosition()
    const scaleFactor = await win.scaleFactor()
    let currentX = pos.x / scaleFactor
    let currentY = pos.y / scaleFactor
    return {
      move: async (dx, dy) => {
        currentX += dx
        currentY += dy
        await win.setPosition(new LogicalPosition(Math.round(currentX), Math.round(currentY)))
      },
      end: () => tauriAPI.saveFloatingWindowPosition()
    }
  }

  if (window.electronAPI?.windowDragStart && window.electronAPI?.windowDragMove) {
    await window.electronAPI.windowDragStart()
    return {
      move: (dx, dy) => window.electronAPI.windowDragMove(Math.round(dx), Math.round(dy)),
      end: () => window.electronAPI.windowDragEnd?.()
    }
  }

  return { move: () => Promise.resolve(), end: () => Promise.resolve() }
}

function movePointer(activePointer, screenX, screenY) {
  activePointer.pending = { screenX, screenY }
  if (activePointer.moving) return
  activePointer.moving = true
  activePointer.inFlight = (async () => {
    const drag = await activePointer.drag
    while (activePointer.pending) {
      const next = activePointer.pending
      activePointer.pending = null
      const dx = next.screenX - activePointer.lastScreenX
      const dy = next.screenY - activePointer.lastScreenY
      if (!dx && !dy) continue

      await drag.move(dx, dy)
      activePointer.lastScreenX = next.screenX
      activePointer.lastScreenY = next.screenY
    }
  })().finally(() => { activePointer.moving = false })
}

async function openMainWindow() {
  if (isTauri()) {
    await tauriAPI.invoke('focus_main_window')
  } else if (window.electronAPI?.focusMainWindow) {
    window.electronAPI.focusMainWindow()
  }
}
</script>

<style scoped>
.floating-ball {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  -webkit-app-region: no-drag;
}

.floating-ball.text-style {
  border-radius: 50%;
  background: var(--accent);
}

.floating-ball.image-style {
  border-radius: 0;
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
