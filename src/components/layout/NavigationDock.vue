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

      <!-- 名单管理：可向下展开的子菜单 -->
      <div
        class="dock-item dock-parent"
        :class="{ active: isListActive, open: listSubmenuOpen }"
        @click="toggleListSubmenu"
        :title="t('listManager', lang)"
      >
        <div class="dock-item-indicator" />
        <Icon icon="fluent:people-list-24-regular" :width="20" class="dock-item-icon" />
        <span v-if="!dockCollapsed" class="dock-item-label">{{ t('listManager', lang) }}</span>
        <Icon icon="fluent:chevron-down-16-regular" :width="14" class="dock-chevron" />
      </div>
      <Transition name="submenu">
        <div v-if="listSubmenuOpen" class="dock-submenu">
          <router-link
            to="/lists"
            class="dock-subitem"
            :class="{ active: route.path === '/lists' }"
            :title="t('personnelList', lang)"
          >
            <Icon icon="fluent:person-24-regular" :width="16" class="dock-subitem-icon" />
            <span v-if="!dockCollapsed" class="dock-subitem-label">{{ t('personnelList', lang) }}</span>
          </router-link>
          <router-link
            to="/group-manage"
            class="dock-subitem"
            :class="{ active: route.path === '/group-manage' }"
            :title="t('groupManage', lang)"
          href="https://点名器.昔涟.cn"
          >
            <Icon icon="fluent:group-24-regular" :width="16" class="dock-subitem-icon" />
            <span v-if="!dockCollapsed" class="dock-subitem-label">{{ t('groupManage', lang) }}</span>
          </router-link>
        </div>
      </Transition>
    </div>

    <div class="dock-bottom">
      <!-- 公告 -->
      <router-link
        to="/announcement"
        class="dock-item"
        :class="{ active: route.path === '/announcement' }"
        draggable="false"
        :title="lang === 'en' ? 'Announcements' : '公告'"
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
        >
          <div class="dock-item-indicator" />
          <Icon icon="fluent:arrow-download-24-regular" :width="20" class="dock-item-icon" />
          <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'Download' : '下载客户端' }}</span>
        </router-link>
        <a
          target="_blank"
          class="dock-item"
          draggable="false"
          :title="lang === 'en' ? 'Documentation' : '查看文档'"
        >
          <Icon icon="fluent:book-24-regular" :width="20" class="dock-item-icon" />
          <span v-if="!dockCollapsed" class="dock-item-label">{{ lang === 'en' ? 'Docs' : '查看文档' }}</span>
        </a>
      </template>
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '../../stores/settings'
import { isTauri } from '../../utils/tauriAPI'
import { t } from '../../utils/i18n'

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

const isListActive = computed(() =>
  ['/lists', '/lists/manage', '/group-manage'].includes(route.path)
)
const listSubmenuOpen = ref(isListActive.value)
watch(() => route.path, () => {
  listSubmenuOpen.value = isListActive.value
})
function toggleListSubmenu() {
  listSubmenuOpen.value = !listSubmenuOpen.value
}

const mainItems = [
  { path: '/roller', icon: 'fluent:flash-24-regular', label: { zh: '随机点名', en: 'Roller' } },
  { path: '/card', icon: 'fluent:card-ui-portrait-flip-24-regular', label: { zh: '翻牌点名', en: 'Card Mode' } },
  { path: '/statistics', icon: 'fluent:chart-multiple-24-regular', label: { zh: '统计', en: 'Statistics' } },
  { path: '/records', icon: 'fluent:history-24-regular', label: { zh: '抽取记录', en: 'Records' } }
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

/* 名单管理子菜单 */
.dock-parent { cursor: pointer; user-select: none; }
.dock-chevron {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform var(--duration-fast) ease;
}
.dock-parent.open .dock-chevron { transform: rotate(180deg); }
.dock-parent.active { background: var(--accent-50); color: var(--accent); }
.dark .dock-parent.active { background: rgba(234, 94, 193, 0.15); }

.dock-submenu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 14px;
  padding-left: 6px;
  border-left: 1px solid var(--border-subtle);
}
.dock-subitem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-family: var(--font-ui);
  transition: background var(--duration-fast) ease;
}
.dock-subitem:hover { background: var(--bg-hover); color: var(--text-primary); }
.dock-subitem.active { background: var(--accent-50); color: var(--accent); }
.dark .dock-subitem.active { background: rgba(234, 94, 193, 0.15); }
.dock-subitem-icon { flex-shrink: 0; }
.dock-subitem-label { white-space: nowrap; }

.submenu-enter-active,
.submenu-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

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
