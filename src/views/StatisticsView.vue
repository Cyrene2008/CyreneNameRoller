<template>
  <div class="statistics-view">
    <h1 class="page-title">
      <FluentIcon icon="chart-multiple-24-regular" :width="28" />
      {{ t('statistics', lang) }}
    </h1>

    <FluentCard class="stats-summary">
      <div class="summary-item">
        <span class="summary-label">{{ lang === 'en' ? 'Total Rolls' : '总计抽取' }}</span>
        <span class="summary-value">{{ statsData.totalCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ lang === 'en' ? 'Candidates' : '候选人数' }}</span>
        <span class="summary-value">{{ namesStore.currentNames.filter(n => n.cn !== '再来一次').length }}</span>
      </div>
    </FluentCard>

    <FluentCard class="stats-list-card">
      <ul class="stats-list">
        <li v-for="stat in statsData.stats" :key="stat.name" class="stats-item">
          <div class="stat-info">
            <span class="stat-name">{{ stat.name }}</span>
            <span class="stat-en">{{ stat.en }}</span>
          </div>
          <div class="stat-data">
            <span class="stat-count">{{ stat.count }} {{ lang === 'en' ? 'times' : '次' }}</span>
            <span class="stat-prob">{{ stat.probability.toFixed(2) }}%</span>
          </div>
        </li>
        <li v-if="statsData.stats.length === 0" class="stats-empty">
          {{ lang === 'en' ? 'No data yet' : '暂无数据' }}
        </li>
      </ul>
    </FluentCard>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'
import { t } from '../utils/i18n'
import FluentCard from '../components/FluentCard.vue'
import FluentIcon from '../components/FluentIcon.vue'

const namesStore = useNamesStore()
const settingsStore = useSettingsStore()
const statisticsStore = useStatisticsStore()

const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')

const statsData = computed(() => {
  return statisticsStore.getStatsForList(
    namesStore.currentNames,
    namesStore.currentWhiteList
  )
})
</script>

<style scoped>
.statistics-view {
  padding: 32px;
  max-width: 700px;
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

.stats-summary {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 13px;
  color: var(--text-muted);
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--accent);
}

.stats-list-card {
  padding: 0;
  overflow: hidden;
}

.stats-list {
  list-style: none;
  max-height: 50vh;
  overflow-y: auto;
}

.stats-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-default);
  transition: background var(--duration-fast) ease;
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-item:hover {
  background: var(--bg-hover);
}

.stat-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-name {
  font-weight: 500;
  color: var(--text-primary);
}

.stat-en {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-data {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-prob {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  min-width: 60px;
  text-align: right;
}

.stats-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
