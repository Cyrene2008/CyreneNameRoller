<template>
  <aside
    ref="menuRef"
    class="secondary-sidebar-menu"
    :class="{ 'is-open': open, 'is-collapsed': collapsed }"
    :aria-hidden="!open"
  >
    <div
      v-show="indicatorVisible"
      ref="indicatorRef"
      class="secondary-sidebar-menu__shared-indicator"
      :class="indicatorAnimationClass"
      aria-hidden="true"
    />
    <header class="secondary-sidebar-menu__header">
      <button type="button" class="secondary-sidebar-menu__back" :aria-label="backLabel" @click="goBack">
        <FluentIcon icon="arrow-left-20-regular" :width="18" />
        <span class="secondary-sidebar-menu__back-label">{{ backLabel }}</span>
      </button>
    </header>

    <nav class="secondary-sidebar-menu__list" @scroll="syncIndicatorAfterLayout(false)">
      <router-link
        v-for="item in items"
        :key="item.id"
        :to="item.to"
        class="secondary-sidebar-menu__item"
        :class="{ active: isItemActive(item) }"
      >
        <FluentIcon v-if="item.icon" :icon="item.icon" :width="18" />
        <span class="secondary-sidebar-menu__item-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FluentIcon from './FluentIcon.vue'
import { getIndicatorDirection, getIndicatorGeometry, getIndicatorTransition } from '../utils/navigationIndicator.mjs'

const props = defineProps({
  open: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
  items: { type: Array, required: true },
  initialRoute: { type: [String, Object], default: null },
  navigateOnOpen: { type: Boolean, default: true },
  backLabel: { type: String, default: 'Back' }
})

const emit = defineEmits(['back'])
const route = useRoute()
const router = useRouter()
const menuRef = ref(null)
const indicatorRef = ref(null)
const indicatorVisible = ref(false)
const indicatorAnimationClass = ref('')
let indicatorGeometry = null
let indicatorTimer = null
let indicatorMotionQuery = null
let indicatorResizeObserver = null
let layoutSyncFrame = null
let layoutSyncAnimate = false
const indicatorDuration = 250

function routePath(target) {
  if (!target) return ''
  return router.resolve(target).path
}

function itemForRoute(path = route.path) {
  return props.items.find(item => {
    const itemPath = routePath(item.to)
    return path === itemPath || path.startsWith(`${itemPath}/`)
  })
}
function initialItem() {
  const requested = routePath(props.initialRoute)
  return props.items.find(item => item.id === props.initialRoute || routePath(item.to) === requested)
    || props.items[0]
}

function isItemActive(item) {
  return itemForRoute()?.id === item.id
}

function goBack() {
  emit('back')
}

function activeIndicatorTarget() {
  return menuRef.value?.querySelector('.secondary-sidebar-menu__item.active') || null
}

function applyIndicatorGeometry(geometry) {
  if (!indicatorRef.value) return
  indicatorRef.value.style.setProperty('--indicator-left', `${geometry.left}px`)
  indicatorRef.value.style.setProperty('--indicator-top', `${geometry.top}px`)
  indicatorRef.value.style.setProperty('--indicator-height', `${geometry.height}px`)
}

function syncIndicator({ animate = false } = {}) {
  const target = activeIndicatorTarget()
  if (!props.open || !target || !menuRef.value || !indicatorRef.value) {
    indicatorVisible.value = false
    indicatorGeometry = null
    return
  }

  const menuRect = menuRef.value.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const scaleX = menuRect.width / menuRef.value.offsetWidth || 1
  const scaleY = menuRect.height / menuRef.value.offsetHeight || 1
  const targetGeometry = {
    ...getIndicatorGeometry(targetRect, menuRect, 20, scaleY),
    left: (targetRect.left - menuRect.left) / scaleX
  }
  const previousGeometry = indicatorGeometry
  const shouldAnimate = animate
    && previousGeometry
    && !indicatorMotionQuery?.matches
    && !document.querySelector('.perf-no-anim')
    && getIndicatorDirection(previousGeometry, targetGeometry) !== 'none'

  if (indicatorTimer) clearTimeout(indicatorTimer)
  indicatorVisible.value = true
  if (!shouldAnimate) {
    indicatorAnimationClass.value = ''
    applyIndicatorGeometry(targetGeometry)
    indicatorGeometry = targetGeometry
    return
  }

  const transition = getIndicatorTransition(previousGeometry, targetGeometry, 20)
  indicatorAnimationClass.value = `is-moving ${transition.direction}`
  indicatorRef.value.style.setProperty('--indicator-from-top', `${transition.fromTop}px`)
  indicatorRef.value.style.setProperty('--indicator-to-top', `${transition.toTop}px`)
  indicatorRef.value.style.setProperty('--indicator-stretch-top', `${transition.stretchTop}px`)
  indicatorRef.value.style.setProperty('--indicator-stretch-height', `${transition.stretchHeight}px`)
  indicatorRef.value.style.setProperty('--indicator-from-left', `${previousGeometry.left}px`)
  indicatorRef.value.style.setProperty('--indicator-to-left', `${targetGeometry.left}px`)
  indicatorRef.value.style.setProperty('--indicator-from-height', `${previousGeometry.height}px`)
  indicatorRef.value.style.setProperty('--indicator-to-height', `${targetGeometry.height}px`)
  indicatorGeometry = targetGeometry
  indicatorTimer = window.setTimeout(() => {
    applyIndicatorGeometry(targetGeometry)
    indicatorAnimationClass.value = ''
    indicatorTimer = null
  }, indicatorDuration + 20)
}

async function syncIndicatorAfterLayout(animate = false) {
  await nextTick()
  layoutSyncAnimate = layoutSyncAnimate || animate
  if (layoutSyncFrame) return
  layoutSyncFrame = window.requestAnimationFrame(() => {
    const shouldAnimate = layoutSyncAnimate
    layoutSyncAnimate = false
    layoutSyncFrame = null
    syncIndicator({ animate: shouldAnimate })
  })
}

watch(() => props.open, async open => {
  if (!open) {
    syncIndicatorAfterLayout(false)
    return
  }
  const target = itemForRoute() || initialItem()
  if (props.navigateOnOpen && target && routePath(target.to) !== route.path) await router.push(target.to)
  syncIndicatorAfterLayout(false)
}, { immediate: true })

watch(() => route.path, () => {
  syncIndicatorAfterLayout(true)
})
watch(() => props.items, () => {
  syncIndicatorAfterLayout(false)
}, { deep: true })
watch(() => props.collapsed, () => syncIndicatorAfterLayout(false))

onMounted(() => {
  indicatorMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncIndicatorAfterLayout(false)
  indicatorResizeObserver = new ResizeObserver(() => syncIndicatorAfterLayout(false))
  if (menuRef.value) indicatorResizeObserver.observe(menuRef.value)
})

onBeforeUnmount(() => {
  if (indicatorTimer) clearTimeout(indicatorTimer)
  if (layoutSyncFrame) cancelAnimationFrame(layoutSyncFrame)
  indicatorResizeObserver?.disconnect()
})
</script>

<style scoped>
.secondary-sidebar-menu {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 12px 6px;
  overflow: hidden;
  background: var(--bg-acrylic);
  transform: translateX(100%);
  pointer-events: none;
  visibility: hidden;
  transition: transform var(--duration-normal) var(--ease-standard), visibility 0s linear var(--duration-normal);
}
.secondary-sidebar-menu__shared-indicator {
  position: absolute;
  z-index: 3;
  left: var(--indicator-left, 0px);
  top: var(--indicator-top, 0px);
  width: 3px;
  height: var(--indicator-height, 20px);
  border-radius: var(--radius-full);
  background: var(--accent);
  pointer-events: none;
}
.secondary-sidebar-menu__shared-indicator.is-moving {
  animation-duration: 250ms;
  animation-timing-function: var(--ease-standard);
  animation-fill-mode: both;
}
.secondary-sidebar-menu__shared-indicator.is-moving.down { animation-name: secondary-indicator-down; }
.secondary-sidebar-menu__shared-indicator.is-moving.up { animation-name: secondary-indicator-up; }
@keyframes secondary-indicator-down {
  0% { left: var(--indicator-from-left); top: var(--indicator-from-top); height: var(--indicator-from-height); }
  52% { left: var(--indicator-to-left); top: var(--indicator-stretch-top); height: var(--indicator-stretch-height); }
  100% { left: var(--indicator-to-left); top: var(--indicator-to-top); height: var(--indicator-to-height); }
}
@keyframes secondary-indicator-up {
  0% { left: var(--indicator-from-left); top: var(--indicator-from-top); height: var(--indicator-from-height); }
  52% { left: var(--indicator-to-left); top: var(--indicator-stretch-top); height: var(--indicator-stretch-height); }
  100% { left: var(--indicator-to-left); top: var(--indicator-to-top); height: var(--indicator-to-height); }
}
.secondary-sidebar-menu.is-open {
  transform: translateX(0);
  pointer-events: auto;
  visibility: visible;
  transition-delay: 0s;
}
.secondary-sidebar-menu__header { flex: 0 0 auto; padding: 0 4px 12px; border-bottom: 1px solid var(--border-subtle); }
.secondary-sidebar-menu__back { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 36px; padding: 6px 8px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--text-secondary); font: inherit; cursor: pointer; }
.secondary-sidebar-menu__back-label { white-space: nowrap; }
.secondary-sidebar-menu__back:hover { background: var(--bg-hover); color: var(--text-primary); }
.secondary-sidebar-menu__list { display: flex; flex: 1; flex-direction: column; gap: 4px; padding: 10px 0; overflow-x: hidden; overflow-y: auto; }
.secondary-sidebar-menu__item { position: relative; display: flex; align-items: center; gap: 9px; width: 100%; min-height: 40px; padding: 9px 10px; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font: inherit; font-size: 13px; text-align: left; text-decoration: none; cursor: pointer; transition: background var(--duration-fast) ease, color var(--duration-fast) ease, transform var(--duration-fast) ease; }
.secondary-sidebar-menu__item-label { white-space: nowrap; }
.secondary-sidebar-menu__item:hover, .secondary-sidebar-menu__item.active { background: var(--bg-hover); color: var(--accent); transform: translateX(2px); }
.secondary-sidebar-menu__item.active::before { display: none; }
.secondary-sidebar-menu.is-collapsed .secondary-sidebar-menu__back-label,
.secondary-sidebar-menu.is-collapsed .secondary-sidebar-menu__item-label { display: none; }
@media (prefers-reduced-motion: reduce) { .secondary-sidebar-menu, .secondary-sidebar-menu__item { transition-duration: 0ms; } }
@media (prefers-reduced-motion: reduce) { .secondary-sidebar-menu__shared-indicator.is-moving { animation-duration: 0ms; } }
</style>
