<template>
  <nav ref="dockRef" class="dock" :class="{ collapsed: dockCollapsed, 'secondary-open': Boolean(activeSecondaryMenu) }">
    <div
      v-show="indicatorVisible"
      ref="indicatorRef"
      class="dock-shared-indicator"
      :class="indicatorAnimationClass"
      aria-hidden="true"
    />
    <div class="dock-primary">
    <div v-if="!isDesktopApp" class="dock-top">
      <button class="dock-toggle" @click="toggleDock" :title="dockCollapsed ? '展开' : '收起'">
        <Icon icon="fluent:line-horizontal-3-20-regular" :width="18" />
      </button>
      <template v-if="!dockCollapsed">
        <img src="/cyrene.png" class="dock-logo-img" alt="" />
        <span class="dock-logo-text">Cyreneの随机点名器</span>
      </template>
    </div>

    <div class="dock-items">
      <template v-for="item in mainItems" :key="item.id">
        <router-link
          v-if="item.to"
          :to="item.to"
          class="dock-item"
          :class="{ active: isPrimaryItemActive(item) }"
          draggable="false"
          :title="item.label[lang]"
          @click="closeSecondaryMenu"
        >
          <div class="dock-item-indicator" />
          <Icon :icon="item.icon" :width="20" class="dock-item-icon" />
          <span v-if="!dockCollapsed" class="dock-item-label">{{ item.label[lang] }}</span>
        </router-link>
        <button
          v-else
          type="button"
          class="dock-item dock-parent"
          :class="{ active: isPrimaryItemActive(item) }"
          :title="item.label[lang]"
          @click="openSecondaryMenu(item.menu)"
        >
          <div class="dock-item-indicator" />
          <Icon :icon="item.icon" :width="20" class="dock-item-icon" />
          <span v-if="!dockCollapsed" class="dock-item-label">{{ item.label[lang] }}</span>
          <Icon icon="fluent:chevron-right-16-regular" :width="14" class="dock-chevron" />
        </button>
      </template>
    </div>

    <div class="dock-bottom">
      <!-- 公告 -->
      <router-link
        to="/announcement"
        class="dock-item"
        :class="{ active: route.path === '/announcement' }"
        draggable="false"
        :title="lang === 'en' ? 'Announcements' : '公告'"
        @click="closeSecondaryMenu"
      >
        <div class="dock-item-indicator" />
        <Icon icon="fluent:megaphone-24-regular" :width="20" class="dock-item-icon" />
        <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'Announcements' : '公告' }}</span>
      </router-link>
      <!-- Web版专属按钮 -->
      <template v-if="!isDesktopApp">
        <router-link
          to="/download"
          class="dock-item"
          :class="{ active: route.path === '/download' }"
          draggable="false"
          :title="lang === 'en' ? 'Download Client' : '下载客户端'"
          @click="closeSecondaryMenu"
        >
          <div class="dock-item-indicator" />
          <Icon icon="fluent:arrow-download-24-regular" :width="20" class="dock-item-icon" />
          <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'Download' : '下载客户端' }}</span>
        </router-link>
        <a
          target="_blank"
          class="dock-item dock-docs"
          draggable="false"
          :title="lang === 'en' ? 'Documentation' : '查看文档'"
        >
          <Icon icon="fluent:book-24-regular" :width="20" class="dock-item-icon" />
          <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'Docs' : '查看文档' }}</span>
        </a>
      </template>
      <button
        type="button"
        class="dock-item dock-plugin"
        :title="lang === 'en' ? 'Plugins' : '插件'"
      >
        <div class="dock-item-indicator" />
        <Icon icon="fluent:puzzle-piece-24-regular" :width="20" class="dock-item-icon" />
        <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'Plugins' : '插件' }}</span>
      </button>
      <button
        type="button"
        class="dock-item dock-parent"
        :class="{ active: route.path.startsWith('/settings') }"
        :title="lang === 'en' ? 'Settings' : '设置'"
        @click="openSecondaryMenu('settings')"
      >
        <div class="dock-item-indicator" />
        <Icon icon="fluent:settings-24-regular" :width="20" class="dock-item-icon" />
        <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'Settings' : '设置' }}</span>
        <Icon icon="fluent:chevron-right-16-regular" :width="14" class="dock-chevron" />
      </button>
      <router-link
        to="/about"
        class="dock-item"
        :class="{ active: route.path.startsWith('/about') }"
        draggable="false"
        :title="lang === 'en' ? 'About' : '关于'"
        @click="closeSecondaryMenu"
      >
        <div class="dock-item-indicator" />
        <Icon icon="fluent:info-24-regular" :width="20" class="dock-item-icon" />
        <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'About' : '关于' }}</span>
      </router-link>
    </div>
    </div>

    <SecondarySidebarMenu
      :open="Boolean(activeSecondaryMenu)"
      :collapsed="dockCollapsed"
      :items="activeSecondaryConfig.items"
      :navigate-on-open="activeSecondaryConfig.navigateOnOpen"
      :back-label="lang === 'en' ? 'Back' : '返回'"
      @back="closeSecondaryMenu"
    />
  </nav>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '../../stores/settings'
import { isTauri } from '../../utils/tauriAPI'
import { t } from '../../utils/i18n'
import SecondarySidebarMenu from '../SecondarySidebarMenu.vue'
import { getIndicatorDirection, getIndicatorGeometry, getIndicatorTransition } from '../../utils/navigationIndicator.mjs'

const props = defineProps({
  buildHash: { type: String, default: '' }
})

const route = useRoute()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)
const dockCollapsed = computed(() => settingsStore.settings.dockCollapsed || false)
const isDesktopApp = computed(() => isTauri())

function secondaryMenuForRoute(path) {
  if (path.startsWith('/settings')) return 'settings'
  if (path === '/lottery/draw' || path === '/lottery/assign') return 'lottery'
  if (path === '/records' || path === '/lottery/records') return 'records'
  if (path === '/lists' || path.startsWith('/lists/') || path === '/group-manage' || path.startsWith('/lottery/prizes')) return 'lists'
  return null
}

const activeSecondaryMenu = ref(secondaryMenuForRoute(route.path))
const dockRef = ref(null)
const indicatorRef = ref(null)
const indicatorVisible = ref(false)
const indicatorAnimationClass = ref('')
let indicatorGeometry = null
let indicatorTimer = null
let indicatorResizeObserver = null
let indicatorMotionQuery = null

const indicatorDuration = 250
let layoutSyncFrame = null
let layoutSyncAnimate = false

function activeIndicatorTarget() {
  if (activeSecondaryMenu.value || !dockRef.value) return null
  return dockRef.value.querySelector('.dock-primary .dock-item.active, .dock-bottom .dock-item.active')
}

function applyIndicatorGeometry(geometry) {
  if (!indicatorRef.value) return
  indicatorRef.value.style.setProperty('--indicator-left', `${geometry.left}px`)
  indicatorRef.value.style.setProperty('--indicator-top', `${geometry.top}px`)
  indicatorRef.value.style.setProperty('--indicator-height', `${geometry.height}px`)
}

function syncIndicator({ animate = false } = {}) {
  const target = activeIndicatorTarget()
  if (!target || !dockRef.value || !indicatorRef.value) {
    indicatorVisible.value = false
    indicatorGeometry = null
    return
  }

  const dockRect = dockRef.value.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const scaleX = dockRect.width / dockRef.value.offsetWidth || 1
  const scaleY = dockRect.height / dockRef.value.offsetHeight || 1
  const targetGeometry = {
    ...getIndicatorGeometry(targetRect, dockRect, 20, scaleY),
    left: (targetRect.left - dockRect.left) / scaleX
  }
  const previousGeometry = indicatorGeometry
  const shouldAnimate = animate
    && previousGeometry
    && !indicatorMotionQuery?.matches
    && !document.querySelector('.perf-no-anim')
    && getIndicatorDirection(previousGeometry, targetGeometry) !== 'none'

  if (indicatorTimer) {
    clearTimeout(indicatorTimer)
    indicatorTimer = null
  }

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

watch(() => route.path, path => {
  activeSecondaryMenu.value = secondaryMenuForRoute(path)
  syncIndicatorAfterLayout(true)
})

function openSecondaryMenu(menu) {
  activeSecondaryMenu.value = menu
}

function closeSecondaryMenu() {
  activeSecondaryMenu.value = null
}

function isPrimaryItemActive(item) {
  if (item.menu) return secondaryMenuForRoute(route.path) === item.menu
  return route.path === item.to
}

function toggleDock() {
  settingsStore.update('dockCollapsed', !dockCollapsed.value)
  syncIndicatorAfterLayout(false)
}

const mainItems = [
  { id: 'roller', to: '/roller', icon: 'fluent:flash-24-regular', label: { zh: '随机点名', en: 'Roller' } },
  { id: 'card', to: '/card', icon: 'fluent:card-ui-portrait-flip-24-regular', label: { zh: '翻牌点名', en: 'Card Mode' } },
  { id: 'lottery', menu: 'lottery', icon: 'fluent:gift-24-regular', label: { zh: '抽奖模式', en: 'Lottery' } },
  { id: 'statistics', to: '/statistics', icon: 'fluent:chart-multiple-24-regular', label: { zh: '统计', en: 'Statistics' } },
  { id: 'records', menu: 'records', icon: 'fluent:history-24-regular', label: { zh: '抽取记录', en: 'Records' } },
  { id: 'lists', menu: 'lists', icon: 'fluent:people-list-24-regular', label: { zh: '名单管理', en: 'List Management' } }
]

const settingsMenuItems = computed(() => [
  { id: 'general', label: lang.value === 'en' ? 'General' : '基本', icon: 'options-20-regular', to: '/settings/general' },
  { id: 'appearance', label: lang.value === 'en' ? 'Appearance' : '外观', icon: 'color-20-regular', to: '/settings/appearance' },
  { id: 'features', label: lang.value === 'en' ? 'Features' : '功能', icon: 'play-20-regular', to: '/settings/features' },
  { id: 'data', label: lang.value === 'en' ? 'Data' : '数据', icon: 'database-20-regular', to: '/settings/data' }
])

const secondaryMenus = computed(() => ({
  lottery: {
    navigateOnOpen: true,
    items: [
      { id: 'draw', label: lang.value === 'en' ? 'Prize draw' : '奖品抽取', icon: 'gift-20-regular', to: '/lottery/draw' },
      { id: 'assign', label: lang.value === 'en' ? 'Assign prizes' : '人员奖品分配', icon: 'people-team-20-regular', to: '/lottery/assign' }
    ]
  },
  records: {
    navigateOnOpen: true,
    items: [
      { id: 'roll-records', label: lang.value === 'en' ? 'Name records' : '点名记录', icon: 'history-20-regular', to: '/records' },
      { id: 'lottery-records', label: lang.value === 'en' ? 'Lottery records' : '抽奖记录', icon: 'gift-20-regular', to: '/lottery/records' }
    ]
  },
  lists: {
    navigateOnOpen: true,
    items: [
      { id: 'people', label: t('personnelList', lang.value), icon: 'person-20-regular', to: '/lists' },
      { id: 'groups', label: lang.value === 'en' ? 'Groups' : '小组名单', icon: 'people-team-20-regular', to: '/group-manage' },
      { id: 'prizes', label: lang.value === 'en' ? 'Prizes' : '奖品管理', icon: 'clipboard-bullet-list-20-regular', to: '/lottery/prizes' }
    ]
  },
  settings: {
    navigateOnOpen: true,
    items: settingsMenuItems.value
  }
}))

const activeSecondaryConfig = computed(() => secondaryMenus.value[activeSecondaryMenu.value] || {
  navigateOnOpen: false,
  items: []
})

watch([dockCollapsed, lang, activeSecondaryMenu], () => {
  syncIndicatorAfterLayout(false)
})

onMounted(() => {
  indicatorMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncIndicatorAfterLayout(false)
  indicatorResizeObserver = new ResizeObserver(() => syncIndicatorAfterLayout(false))
  if (dockRef.value) indicatorResizeObserver.observe(dockRef.value)
})

onBeforeUnmount(() => {
  if (indicatorTimer) clearTimeout(indicatorTimer)
  if (layoutSyncFrame) cancelAnimationFrame(layoutSyncFrame)
  indicatorResizeObserver?.disconnect()
})
</script>

<style scoped>
.dock {
  width: var(--dock-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-acrylic);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-subtle);
  flex-shrink: 0;
  overflow: hidden;
  transition: width var(--duration-normal) var(--ease-standard);
  position: relative;
  z-index: 50;
}

.dock-primary {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  transform: translateX(0);
  transition: transform var(--duration-normal) var(--ease-standard);
}

.dock.secondary-open .dock-primary { transform: translateX(-100%); pointer-events: none; }

.dock-shared-indicator {
  position: absolute;
  z-index: 4;
  left: var(--indicator-left, 0px);
  top: var(--indicator-top, 0px);
  width: 3px;
  height: var(--indicator-height, 20px);
  border-radius: var(--radius-full);
  background: var(--accent);
  pointer-events: none;
  transform: translateY(0);
}

.dock-shared-indicator.is-moving {
  animation-duration: 250ms;
  animation-timing-function: var(--ease-standard);
  animation-fill-mode: both;
}
.dock-shared-indicator.is-moving.down { animation-name: dock-indicator-down; }
.dock-shared-indicator.is-moving.up { animation-name: dock-indicator-up; }

@keyframes dock-indicator-down {
  0% { left: var(--indicator-from-left); top: var(--indicator-from-top); height: var(--indicator-from-height); }
  52% { left: var(--indicator-to-left); top: var(--indicator-stretch-top); height: var(--indicator-stretch-height); }
  100% { left: var(--indicator-to-left); top: var(--indicator-to-top); height: var(--indicator-to-height); }
}

@keyframes dock-indicator-up {
  0% { left: var(--indicator-from-left); top: var(--indicator-from-top); height: var(--indicator-from-height); }
  52% { left: var(--indicator-to-left); top: var(--indicator-stretch-top); height: var(--indicator-stretch-height); }
  100% { left: var(--indicator-to-left); top: var(--indicator-to-top); height: var(--indicator-to-height); }
}

.dock-item-indicator { display: none; }

.dock.collapsed {
  width: 48px;
}

.dock-top {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 10px;
  border-bottom: 1px solid var(--border-subtle);
  overflow: hidden;
}

.dock-toggle {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--duration-normal) var(--ease-standard), color var(--duration-normal) var(--ease-standard), transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard);
  flex-shrink: 0;
}

.dock-toggle:hover {
  background: var(--bg-hover);
}

.dock-logo-img {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  object-fit: cover;
  flex-shrink: 0;
}

.dock-logo-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.dock-items {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 6px;
  overflow-x: hidden;
  overflow-y: auto;
}

.dock-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
  text-decoration: none;
  color: var(--text-secondary);
  position: relative;
  border: none;
  background: transparent;
  width: 100%;
  font-size: 13px;
  font-family: var(--font-ui);
  overflow: hidden;
}

.dock.collapsed .dock-item {
  justify-content: flex-start;
  padding: 9px 10px;
}

.dock-item:hover { background: var(--bg-hover); color: var(--text-primary); transform: translateX(1px); }
.dock-item.active { background: var(--bg-hover); color: var(--accent); transform: translateX(1px); }
.dark .dock-item.active { background: var(--bg-hover); }

.dock-item-icon { flex-shrink: 0; transition: transform var(--duration-normal) var(--ease-standard); }
.dock-item.active .dock-item-icon { animation: dock-icon-arrive .42s var(--ease-standard); transform: scale(1.08); }
@keyframes dock-icon-arrive { 0% { transform: translateX(-5px) scale(.9); opacity:.5 } 65% { transform: translateX(2px) scale(1.12) } 100% { transform:translateX(0) scale(1.08); opacity:1 } }
.dock-item-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dock-item.active .dock-item-label { animation: dock-label-arrive .4s var(--ease-standard); }
@keyframes dock-label-arrive { 0% { opacity: .35; transform: translateX(-5px); } 65% { opacity: 1; transform: translateX(2px); } 100% { transform: translateX(0); } }

.dock-parent { cursor: pointer; user-select: none; }
.dock-chevron {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--text-muted);
}
.dock-parent.active { background: var(--bg-hover); color: var(--accent); }
.dark .dock-parent.active { background: var(--bg-hover); }

.dock-bottom {
  flex-shrink: 0;
  padding: 8px 6px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .dock {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    width: 48px;
    box-shadow: var(--shadow-8);
  }

  .dock:not(.collapsed) {
    width: var(--dock-width);
  }

  .dock.collapsed {
    width: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dock-shared-indicator.is-moving { animation-duration: 0ms; }
}
</style>
