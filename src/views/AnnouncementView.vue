<template>
  <div class="ann-view">
    <header class="ann-header">
      <div class="ann-header-icon">
        <FluentIcon icon="megaphone-24-regular" :width="26" />
      </div>
      <div class="ann-header-text">
        <h1 class="ann-title">{{ t('announcement', lang) }}</h1>
        <p class="ann-subtitle">{{ lang === 'en' ? 'Latest news and notices' : '最新动态与通知' }}</p>
      </div>
      <button
        class="ann-refresh"
        :class="{ 'is-loading': loading }"
        :disabled="loading"
        :title="lang === 'en' ? 'Refresh' : '刷新'"
        @click="load(true)"
      >
        <FluentIcon icon="arrow-sync-24-regular" :width="18" :class="{ spin: loading }" />
        <span>{{ lang === 'en' ? 'Refresh' : '刷新' }}</span>
      </button>
    </header>

    <div class="ann-cats">
      <button
        class="ann-chip"
        :class="{ active: activeCat === '__all__' }"
        @click="activeCat = '__all__'"
      >{{ t('all', lang) }}</button>
      <button
        v-for="c in categories"
        :key="c.key"
        class="ann-chip"
        :class="{ active: activeCat === c.key }"
        @click="activeCat = c.key"
      >{{ lang === 'en' ? (c.en || c.cn) : c.cn }}</button>
    </div>

    <div v-if="loading" class="ann-state">
      <FluentIcon icon="spinner-ios-20-regular" :width="28" class="spin" />
      <span>{{ lang === 'en' ? 'Loading...' : '加载中...' }}</span>
    </div>

    <div v-else-if="error" class="ann-state ann-error">
      <FluentIcon icon="warning-16-regular" :width="22" />
      <span>{{ t('annLoadFail', lang) }}</span>
      <button class="ann-retry" @click="load">{{ t('retry', lang) }}</button>
    </div>

    <div v-else class="ann-list">
      <article
        v-for="a in filtered"
        :key="a.id"
        class="ann-card"
        :class="{ pinned: a.pinned }"
      >
        <div class="ann-card-top">
          <span v-if="a.important" class="ann-imp-tag">
            <FluentIcon icon="warning-16-regular" :width="13" />
            {{ t('important', lang) }}
          </span>
          <h2 class="ann-card-title">{{ fmtField(a.title) }}</h2>
        </div>
        <div class="ann-meta">
          <span v-if="a.tag" class="ann-tag">{{ fmtField(a.tag) }}</span>
          <span v-if="a.time" class="ann-time">
            <FluentIcon icon="clock-16-regular" :width="13" /> {{ a.time }}
          </span>
        </div>
        <div class="ann-body" v-html="renderContent(a)"></div>
      </article>

      <div v-if="!filtered.length" class="ann-state">
        <FluentIcon icon="info-24-regular" :width="22" />
        <span>{{ t('emptyAnn', lang) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import FluentIcon from '../components/FluentIcon.vue'
import { useSettingsStore } from '../stores/settings'
import { fetchAnnouncements, sortAnnouncements } from '../utils/announcement'
import { renderMarkdown } from '../utils/markdown'
import { t } from '../utils/i18n'

const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)

const announcements = ref([])
const loading = ref(true)
const error = ref(false)
const activeCat = ref('__all__')

async function load(forceRefresh = false) {
  loading.value = true
  error.value = false
  try {
    announcements.value = await fetchAnnouncements({ noCache: !!forceRefresh })
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

function fmtField(field) {
  if (field == null) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return lang.value === 'en' ? (field.en || field.cn || '') : (field.cn || field.en || '')
  }
  return ''
}

const categories = computed(() => {
  const map = new Map()
  for (const a of announcements.value) {
    const key = fmtField(a.tag)
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, { key, cn: key, en: key })
    }
  }
  return [...map.values()]
})

const filtered = computed(() => {
  let list = announcements.value
  if (activeCat.value !== '__all__') {
    list = list.filter(a => fmtField(a.tag) === activeCat.value)
  }
  return sortAnnouncements(list)
})

function renderContent(a) {
  const md = fmtField(a.content) || a.content
  return renderMarkdown(md || '')
}

onMounted(() => load(true))
</script>

<style scoped>
.ann-view {
  max-width: 860px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}
.ann-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.ann-header-text { flex: 1; }
.ann-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-acrylic);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-ui);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}
.ann-refresh:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--accent);
}
.ann-refresh:disabled { opacity: 0.6; cursor: default; }
.ann-header-icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-50);
  color: var(--accent);
}
.dark .ann-header-icon { background: rgba(234, 94, 193, 0.15); }
.ann-title { font-size: 22px; font-weight: 600; color: var(--text-primary); margin: 0; }
.ann-subtitle { font-size: 13px; color: var(--text-secondary); margin: 2px 0 0; }

.ann-cats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.ann-chip {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  background: var(--bg-acrylic);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: all var(--duration-fast) ease;
}
.ann-chip:hover { color: var(--text-primary); border-color: var(--accent); }
.ann-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.ann-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}
.ann-error { flex-direction: column; }
.ann-retry {
  margin-top: 8px;
  padding: 6px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 13px;
}

.ann-list { display: flex; flex-direction: column; gap: 14px; }
.ann-card {
  background: var(--bg-acrylic);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-2);
}
.ann-card.pinned { border-color: var(--accent); }
.dark .ann-card.pinned { border-color: rgba(234, 94, 193, 0.5); }

.ann-card-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ann-imp-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: var(--radius-sm);
  background: rgba(234, 94, 193, 0.15);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}
.ann-card-title { font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0; }

.ann-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 8px 0 12px; }
.ann-tag {
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 12px;
}
.ann-time { display: inline-flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 12px; }

.ann-body { color: var(--text-primary); font-size: 14px; line-height: 1.7; }
.ann-body :deep(h1), .ann-body :deep(h2), .ann-body :deep(h3) { margin: 14px 0 8px; font-weight: 600; }
.ann-body :deep(p) { margin: 8px 0; }
.ann-body :deep(ul), .ann-body :deep(ol) { margin: 8px 0; padding-left: 22px; }
.ann-body :deep(li) { margin: 4px 0; }
.ann-body :deep(a) { color: var(--accent); }
.ann-body :deep(code) { background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.ann-body :deep(pre) { background: var(--bg-hover); padding: 12px; border-radius: var(--radius-md); overflow-x: auto; }
.ann-body :deep(pre code) { padding: 0; background: transparent; }
.ann-body :deep(blockquote) { border-left: 3px solid var(--accent); margin: 8px 0; padding: 4px 14px; color: var(--text-secondary); }
.ann-body :deep(hr) { border: none; border-top: 1px solid var(--border-subtle); margin: 14px 0; }

.spin { animation: ann-spin 1s linear infinite; }
@keyframes ann-spin { to { transform: rotate(360deg); } }
</style>
