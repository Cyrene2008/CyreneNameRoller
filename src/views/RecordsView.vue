<template>
  <div class="records-view">
    <h1 class="page-title">
      <FluentIcon icon="clipboard-text-24-regular" :width="28" />
      {{ lang === 'en' ? 'Extraction Records' : '抽取记录' }}
    </h1>

    <FluentCard class="records-card">
      <div class="records-header">
        <span class="rh-time">{{ lang === 'en' ? 'Time' : '时间' }}</span>
        <span class="rh-name">{{ lang === 'en' ? 'Name' : '姓名' }}</span>
        <span class="rh-list">{{ lang === 'en' ? 'List' : '名单' }}</span>
        <span class="rh-source">{{ lang === 'en' ? 'Source' : '来源' }}</span>
      </div>
      <div class="records-list" ref="listRef">
        <div v-for="(rec, i) in records" :key="i" class="record-item">
          <span class="ri-time">{{ formatTime(rec.time) }}</span>
          <span class="ri-name">{{ rec.cn }} ({{ rec.en }})</span>
          <span class="ri-list">{{ rec.listName }}</span>
          <span class="ri-source">{{ rec.source === 'roller' ? (lang === 'en' ? 'Roller' : '随机点名') : (lang === 'en' ? 'Card' : '翻牌点名') }}</span>
        </div>
        <div v-if="records.length === 0" class="records-empty">
          {{ lang === 'en' ? 'No records yet' : '暂无抽取记录' }}
        </div>
      </div>
    </FluentCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useRecordsStore } from '../stores/records'
import FluentCard from '../components/FluentCard.vue'
import FluentIcon from '../components/FluentIcon.vue'

const settingsStore = useSettingsStore()
const recordsStore = useRecordsStore()

const lang = computed(() => settingsStore.settings.language)
const records = computed(() => recordsStore.records)
const listRef = ref(null)

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  recordsStore.initialize()
})
</script>

<style scoped>
.records-view {
  padding: 32px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.records-card {
  padding: 0;
  overflow: hidden;
}

.records-header {
  display: grid;
  grid-template-columns: 180px 1fr 140px 120px;
  gap: 12px;
  padding: 10px 20px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border-default);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.records-list {
  max-height: 60vh;
  overflow-y: auto;
}

.record-item {
  display: grid;
  grid-template-columns: 180px 1fr 140px 120px;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-default);
  font-size: 14px;
  transition: background var(--duration-fast) ease;
}

.record-item:hover {
  background: var(--bg-hover);
}

.ri-time {
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.ri-name {
  font-weight: 500;
  color: var(--text-primary);
}

.ri-list {
  color: var(--text-secondary);
}

.ri-source {
  color: var(--accent);
  font-size: 13px;
}

.records-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
