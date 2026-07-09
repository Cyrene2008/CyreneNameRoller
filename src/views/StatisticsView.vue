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
        <span class="col-name">{{ lang === 'en' ? 'Name' : '姓名' }}</span>
        <span class="col-en">{{ lang === 'en' ? 'English' : '英文名' }}</span>
        <span class="col-count">{{ lang === 'en' ? 'Count' : '次数' }}</span>
        <span class="col-prob">{{ lang === 'en' ? 'Probability' : '概率' }}</span>
        <span class="col-balanced">{{ lang === 'en' ? 'Balanced' : '平衡概率' }}</span>
      </div>
      <ul class="stats-list">
        <li v-for="stat in statsWithBalance" :key="stat.name" class="stats-item">
          <span class="col-name">{{ stat.name }}</span>
          <span class="col-en">{{ stat.en }}</span>
          <span class="col-count">{{ stat.count }}</span>
          <span class="col-prob">{{ stat.probability.toFixed(2) }}%</span>
          <span class="col-balanced">{{ stat.balancedProbability.toFixed(2) }}%</span>
        </li>
        <li v-if="statsWithBalance.length === 0" class="stats-empty">
          {{ lang === 'en' ? 'No data yet' : '暂无数据' }}
        </li>
      </ul>
    </FluentCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'
import { computeBalancedProbability, DEFAULT_BALANCE_SETTINGS, normalizeSettings } from '../utils/balance'
import { dataBridge } from '../utils/dataBridge'
import { t } from '../utils/i18n'
import FluentCard from '../components/FluentCard.vue'
import FluentIcon from '../components/FluentIcon.vue'

const namesStore = useNamesStore()
const settingsStore = useSettingsStore()
const statisticsStore = useStatisticsStore()

const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
const balanceSettings = ref({ ...DEFAULT_BALANCE_SETTINGS })

const statsData = computed(() => {
  return statisticsStore.getStatsForList(
    namesStore.currentNames,
    namesStore.currentWhiteList
  )
})

const statsWithBalance = computed(() => {
  const probMap = computeBalancedProbability(
    namesStore.currentNames,
    namesStore.currentWhiteList,
    statisticsStore.counts,
    balanceSettings.value
  )
  return statsData.value.stats.map(s => ({
    ...s,
    balancedProbability: probMap[s.name] || 0
  }))
})

onMounted(async () => {
  const saved = await dataBridge.load('balance')
  if (saved) balanceSettings.value = normalizeSettings(saved)
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

.stats-table-header,
.stats-item {
  display: grid;
  grid-template-columns: 1fr 1fr 70px 90px 90px;
  align-items: center;
  padding: 10px 20px;
  gap: 0;
}

.stats-table-header {
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
  margin: 0;
  padding: 0;
}

.stats-item {
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

.col-name {
  font-weight: 500;
  color: var(--text-primary);
}

.col-en {
  font-size: 12px;
  color: var(--text-muted);
}

.col-count {
  color: var(--text-secondary);
  text-align: center;
}

.col-prob {
  font-weight: 500;
  color: var(--text-secondary);
  text-align: right;
}

.col-balanced {
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
