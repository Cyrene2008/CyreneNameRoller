<template>
  <nav class="dock" :class="{ collapsed: dockCollapsed }">
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
      <router-link
        v-for="item in mainItems"
        :key="item.path"
        :to="item.path"
        class="dock-item"
        :class="{ active: route.path === item.path || (item.path === '/settings' && route.path.startsWith('/settings/')) || (item.path === '/about' && route.path.startsWith('/about/')) }"
        draggable="false"
        :title="item.label[lang]"
      >
        <div class="dock-item-indicator" />
        <Icon :icon="item.icon" :width="20" class="dock-item-icon" />
        <span v-if="!dockCollapsed" class="dock-item-label">{{ item.label[lang] }}</span>
      </router-link>
    </div>

    <div class="dock-bottom">
      <router-link
        v-for="item in bottomItems"
        :key="item.path"
        :to="item.path"
        class="dock-item"
        :class="{ active: route.path === item.path || (item.path === '/settings' && route.path.startsWith('/settings/')) || (item.path === '/about' && route.path.startsWith('/about/')) }"
        draggable="false"
        :title="item.label[lang]"
      >
        <div class="dock-item-indicator" />
        <Icon :icon="item.icon" :width="20" class="dock-item-icon" />
        <span v-if="!dockCollapsed" class="dock-item-label">{{ item.label[lang] }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '../../stores/settings'
import { isTauri } from '../../utils/tauriAPI'

const props = defineProps({
  buildHash: { type: String, default: '' }
})

const route = useRoute()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)
const dockCollapsed = computed(() => settingsStore.settings.dockCollapsed || false)
const isDesktopApp = computed(() => !!window.electronAPI || isTauri())

function toggleDock() {
  settingsStore.update('dockCollapsed', !dockCollapsed.value)
}

const mainItems = [
  { path: '/roller', icon: 'fluent:flash-24-regular', label: { zh: '随机点名', en: 'Roller' } },
  { path: '/card', icon: 'fluent:card-ui-portrait-flip-24-regular', label: { zh: '翻牌点名', en: 'Card Mode' } },
  { path: '/statistics', icon: 'fluent:chart-multiple-24-regular', label: { zh: '统计', en: 'Statistics' } },
  { path: '/records', icon: 'fluent:history-24-regular', label: { zh: '抽取记录', en: 'Records' } },
  { path: '/lists', icon: 'fluent:people-list-24-regular', label: { zh: '名单管理', en: 'Lists' } }
]

const bottomItems = [
  { path: '/settings', icon: 'fluent:settings-24-regular', label: { zh: '设置', en: 'Settings' } },
  { path: '/about', icon: 'fluent:info-24-regular', label: { zh: '关于', en: 'About' } }
]
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
  overflow: visible;
  transition: width var(--duration-normal) var(--ease-standard);
  position: relative;
  z-index: 50;
}

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
  transition: background var(--duration-fast) ease;
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
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 6px;
  overflow: hidden;
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

.dock-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.dock-item.active { background: var(--accent-50); color: var(--accent); }
.dark .dock-item.active { background: rgba(234, 94, 193, 0.15); }

.dock-item-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--accent);
  border-radius: var(--radius-full);
  transition: height var(--duration-normal) var(--ease-standard);
}

.dock-item.active .dock-item-indicator { height: 16px; }
.dock-item-icon { flex-shrink: 0; }
.dock-item-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.dock-bottom {
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
</style>
