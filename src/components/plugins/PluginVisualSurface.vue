<template>
  <canvas :key="canvasGeneration" ref="canvasRef" class="plugin-visual-surface" :data-plugin="surface.pluginId" :data-surface="surface.id" />
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { usePluginsStore } from '../../plugins/store'

const props = defineProps({
  surface: { type: Object, required: true }
})

const plugins = usePluginsStore()
const canvasRef = ref(null)
const canvasGeneration = ref(0)
let observer
let mounted = false
let disposed = false
let mountAttempt = 0
let retryUsed = false
let resizeHandle = null
let resizeHandleType = ''
let recoveryResetTimer = null

function viewport() {
  const rect = canvasRef.value?.getBoundingClientRect()
  return {
    width: Math.max(1, Math.round(rect?.width || window.innerWidth || 1)),
    height: Math.max(1, Math.round(rect?.height || window.innerHeight || 1)),
    dpr: Math.max(1, Math.min(3, window.devicePixelRatio || 1))
  }
}

function cancelQueuedResize() {
  if (resizeHandle === null) return
  if (resizeHandleType === 'frame' && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(resizeHandle)
  else clearTimeout(resizeHandle)
  resizeHandle = null
  resizeHandleType = ''
}

function queueResize() {
  if (disposed || !mounted || resizeHandle !== null) return
  const flush = () => {
    resizeHandle = null
    resizeHandleType = ''
    if (!disposed && mounted) plugins.resizeVisualSurface(props.surface.pluginId, props.surface.id, viewport())
  }
  if (typeof requestAnimationFrame === 'function') {
    resizeHandleType = 'frame'
    resizeHandle = requestAnimationFrame(flush)
  } else {
    resizeHandleType = 'timeout'
    resizeHandle = setTimeout(flush, 16)
  }
}

function detachCanvas(canvas) {
  canvas?.removeEventListener('cyrene-visual-surface-error', onSurfaceFailure)
  observer?.disconnect()
  observer = undefined
  cancelQueuedResize()
}

function armRecoveryReset() {
  if (recoveryResetTimer) clearTimeout(recoveryResetTimer)
  recoveryResetTimer = setTimeout(() => {
    recoveryResetTimer = null
    retryUsed = false
  }, 2000)
}

function scheduleRecovery(error) {
  if (disposed || retryUsed) {
    if (error) console.warn('[plugins] visual surface stopped after retry', error)
    return
  }
  if (recoveryResetTimer) clearTimeout(recoveryResetTimer)
  recoveryResetTimer = null
  retryUsed = true
  mounted = false
  detachCanvas(canvasRef.value)
  plugins.unmountVisualSurface(props.surface.pluginId, props.surface.id)
  canvasGeneration.value += 1
  nextTick(() => mountSurface().catch(failure => console.warn('[plugins] visual surface recovery failed', failure)))
}

function onSurfaceFailure(event) {
  scheduleRecovery(new Error(event?.detail?.message || '插件视觉层运行失败'))
}

async function mountSurface() {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas || mounted || disposed) return
  const attempt = ++mountAttempt
  canvas.addEventListener('cyrene-visual-surface-error', onSurfaceFailure)
  try {
    await plugins.mountVisualSurface(canvas, props.surface.pluginId, props.surface.id, viewport())
    if (disposed || attempt !== mountAttempt || canvasRef.value !== canvas) {
      plugins.unmountVisualSurface(props.surface.pluginId, props.surface.id)
      detachCanvas(canvas)
      return
    }
    mounted = true
    armRecoveryReset()
    observer = new ResizeObserver(queueResize)
    observer.observe(canvas)
  } catch (error) {
    detachCanvas(canvas)
    mounted = false
    if (!disposed && attempt === mountAttempt) scheduleRecovery(error)
    else throw error
  }
}

onMounted(() => { mountSurface().catch(error => console.warn('[plugins] visual surface unavailable', error)) })
onBeforeUnmount(() => {
  disposed = true
  mountAttempt += 1
  if (recoveryResetTimer) clearTimeout(recoveryResetTimer)
  recoveryResetTimer = null
  detachCanvas(canvasRef.value)
  plugins.unmountVisualSurface(props.surface.pluginId, props.surface.id)
  mounted = false
})
</script>

<style scoped>
.plugin-visual-surface { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
