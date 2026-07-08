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
      <div class="stats-table-header">
        <span class="th-name">{{ lang === 'en' ? 'Name' : '姓名' }}</span>
        <span class="th-en">{{ lang === 'en' ? 'English' : '英文名' }}</span>
        <span class="th-count">{{ lang === 'en' ? 'Count' : '次数' }}</span>
        <span class="th-prob">{{ lang === 'en' ? 'Probability' : '概率' }}</span>
        <span class="th-balanced">{{ lang === 'en' ? 'Balanced' : '平衡概率' }}</span>
      </div>
      <ul class="stats-list">
        <li v-for="stat in statsWithBalance" :key="stat.name" class="stats-item">
          <span class="stat-name">{{ stat.name }}</span>
          <span class="stat-en">{{ stat.en }}</span>
          <span class="stat-count">{{ stat.count }}</span>
          <span class="stat-prob">{{ stat.probability.toFixed(2) }}%</span>
          <span class="stat-balanced">{{ stat.balancedProbability.toFixed(2) }}%</span>
        </li>
        <li v-if="statsWithBalance.length === 0" class="stats-empty">
          {{ lang === 'en' ? 'No data yet' : '暂无数据' }}
        </li>
      </ul>
    </FluentCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'
import { computeBalancedProbability } from '../utils/balance'
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

const statsWithBalance = computed(() => {
  const balanceSettings = { enabled: true, factor: 13.3, maxThreshold: 3, maxBoostPercent: 1200, points: [{ x: 0.3, y: 150 }, { x: 1.5, y: 420 }, { x: 2.4, y: 800 }] }
  const probMap = computeBalancedProbability(
    namesStore.currentNames,
    namesStore.currentWhiteList,
    statisticsStore.counts,
    balanceSettings
  )
  return statsData.value.stats.map(s => ({
    ...s,
    balancedProbability: probMap[s.name] || 0
  }))
})
</script>

<style scoped>
.statistics-view {
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

.stats-table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 80px 100px 100px;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border-default);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stats-list {
  list-style: none;
  max-height: 50vh;
  overflow-y: auto;
}

.stats-item {
  display: grid;
  grid-template-columns: 1fr 1fr 80px 100px 100px;
  gap: 8px;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-default);
  transition: background var(--duration-fast) ease;
  font-size: 14px;
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-item:hover {
  background: var(--bg-hover);
}

.stat-name {
  font-weight: 500;
  color: var(--text-primary);
}

.stat-en {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-count {
  color: var(--text-secondary);
  text-align: center;
}

.stat-prob {
  font-weight: 500;
  color: var(--text-secondary);
  text-align: right;
}

.stat-balanced {
  font-weight: 600;
  color: var(--accent);
  text-align: right;
}

.stats-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
