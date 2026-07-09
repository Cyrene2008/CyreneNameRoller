<template>
  <nav class="dock">
    <div class="dock-logo">
      <Icon icon="fluent:heart-24-filled" :width="28" class="dock-logo-icon" />
      <span class="dock-logo-text">Cyreneの随机点名器</span>
    </div>

    <div class="dock-items">
      <router-link
        v-for="item in mainItems"
        :key="item.path"
        :to="item.path"
        class="dock-item"
        :class="{ active: route.path === item.path }"
      >
        <div class="dock-item-indicator" />
        <Icon :icon="item.icon" :width="20" class="dock-item-icon" />
        <span class="dock-item-label">{{ item.label[lang] }}</span>
      </router-link>
    </div>

    <div class="dock-bottom">
      <router-link
        v-for="item in bottomItems"
        :key="item.path"
        :to="item.path"
        class="dock-item"
        :class="{ active: route.path === item.path }"
      >
        <div class="dock-item-indicator" />
        <Icon :icon="item.icon" :width="20" class="dock-item-icon" />
        <span class="dock-item-label">{{ item.label[lang] }}</span>
      </router-link>
      <div class="dock-build">{{ APP_VERSION }} build:{{ buildHash }}</div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '../../stores/settings'
import { APP_VERSION } from '../../utils/version'

const props = defineProps({
  buildHash: { type: String, default: '' }
})

const route = useRoute()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')

const mainItems = [
  { path: '/roller', icon: 'fluent:flash-24-regular', label: { zh: '随机点名', en: 'Roller' } },
  { path: '/card', icon: 'fluent:playing-cards-24-regular', label: { zh: '翻牌点名', en: 'Card Mode' } },
  { path: '/statistics', icon: 'fluent:chart-multiple-24-regular', label: { zh: '统计', en: 'Statistics' } },
  { path: '/records', icon: 'fluent:clipboard-text-24-regular', label: { zh: '抽取记录', en: 'Records' } },
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
  overflow-y: auto;
  overflow-x: hidden;
}

.dock-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 16px;
}

.dock-logo-icon { color: var(--accent); }

.dock-logo-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.dock-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}

.dock-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
  text-decoration: none;
  color: var(--text-secondary);
  position: relative;
  border: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  font-family: var(--font-ui);
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
  padding: 8px;
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dock-build {
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.5;
  text-align: center;
  padding: 6px 0 0;
  font-family: var(--font-ui);
  letter-spacing: 0.3px;
}
</style>
