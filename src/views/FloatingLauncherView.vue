<template>
  <div
    class="floating-ball"
    @pointerdown.prevent="onPointerDown"
    @pointermove.prevent="onPointerMove"
    @pointerup.prevent="onPointerUp"
    @pointercancel.prevent="onPointerCancel"
  >
    <span class="ball-text">点名</span>
  </div>
</template>

<script setup>
import { isTauri, tauriAPI } from '../utils/tauriAPI'

const DRAG_THRESHOLD = 5

let pointer = null

function onPointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return

  e.currentTarget.setPointerCapture(e.pointerId)
  pointer = {
    id: e.pointerId,
    startScreenX: e.screenX,
    startScreenY: e.screenY,
    dragged: false,
    latestDx: 0,
    latestDy: 0,
    moveQueue: Promise.resolve(),
    ready: null
  }
}

function onPointerMove(e) {
  if (!pointer || e.pointerId !== pointer.id) return

  const dx = e.screenX - pointer.startScreenX
  const dy = e.screenY - pointer.startScreenY
  if (!pointer.dragged && Math.max(Math.abs(dx), Math.abs(dy)) > DRAG_THRESHOLD) {
    pointer.dragged = true
    pointer.ready = startDrag()
  }

  if (!pointer.dragged) return

  pointer.latestDx = dx
  pointer.latestDy = dy
  queueMove(pointer)
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
    activePointer.latestDx = e.screenX - activePointer.startScreenX
    activePointer.latestDy = e.screenY - activePointer.startScreenY
    queueMove(activePointer)
    await activePointer.moveQueue
    const drag = await activePointer.ready
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
    return {
      move: (dx, dy) => win.setPosition(new LogicalPosition(
        Math.round(pos.x / scaleFactor + dx),
        Math.round(pos.y / scaleFactor + dy)
      )),
      end: () => Promise.resolve()
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

function queueMove(activePointer) {
  activePointer.moveQueue = activePointer.moveQueue.then(async () => {
    const drag = await activePointer.ready
    await drag.move(activePointer.latestDx, activePointer.latestDy)
  })
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
  border-radius: 50%;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  -webkit-app-region: no-drag;
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
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  pointer-events: none;
}
</style>
