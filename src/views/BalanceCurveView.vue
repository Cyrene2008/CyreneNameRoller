<template>
  <div class="balance-curve-view">
    <div class="curve-header">
      <div class="curve-header-left">
        <FluentButton variant="subtle" size="sm" icon-only @click="router.back()">
          <FluentIcon icon="arrow-left-16-regular" :width="18" />
        </FluentButton>
        <FluentIcon icon="data-line-24-regular" :width="22" />
        <h1 class="page-title">{{ lang === 'en' ? 'Balance Curve Editor' : '平衡曲线编辑器' }}</h1>
      </div>
      <FluentButton variant="secondary" size="sm" @click="resetBalance">
        <FluentIcon icon="arrow-undo-16-regular" :width="14" /> {{ lang === 'en' ? 'Reset All' : '全部恢复默认' }}
      </FluentButton>
    </div>

    <!-- 参数设置 -->
    <FluentCard class="params-card">
      <h3 class="params-title">{{ lang === 'en' ? 'Parameters' : '参数设置' }}</h3>
      <div class="params-grid">
        <div class="param-item">
          <span class="param-label">{{ lang === 'en' ? 'Factor' : '平衡因子' }}</span>
          <FluentInput v-model="balance.factor" type="number" :step="0.1" style="width: 100px;" @update:model-value="saveBalance" />
          <span class="param-hint">{{ lang === 'en' ? 'Higher = more aggressive balance' : '越高越积极平衡' }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">{{ lang === 'en' ? 'Max Threshold' : '最大阈值' }}</span>
          <FluentInput v-model="balance.maxThreshold" type="number" :step="0.1" style="width: 100px;" @update:model-value="saveBalance" />
          <span class="param-hint">{{ lang === 'en' ? 'Deficit cap for max boost' : '达到此差值时给予最大提升' }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">{{ lang === 'en' ? 'Max Boost (%)' : '最大提升值 (%)' }}</span>
          <FluentInput v-model="balance.maxBoostPercent" type="number" :step="10" style="width: 100px;" @update:model-value="saveBalance" />
          <span class="param-hint">{{ lang === 'en' ? 'Max probability multiplier' : '概率最大倍率' }}</span>
        </div>
      </div>
    </FluentCard>

    <!-- 曲线编辑器 -->
    <FluentCard class="curve-card">
      <p class="curve-explain">{{ lang === 'en' ? 'Names picked fewer times get higher probability. Drag points on the curve to adjust.' : '被抽中次数越少，下次被抽中的概率越高。拖动曲线上的点来调整。' }}</p>
      <BalanceEditor v-model="balance.points" :lang="lang" :max-y="balance.maxBoostPercent" @update:model-value="saveBalance" />
    </FluentCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { dataBridge } from '../utils/dataBridge'
import { DEFAULT_BALANCE_SETTINGS, normalizeSettings } from '../utils/balance'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentInput from '../components/FluentInput.vue'
import BalanceEditor from '../components/BalanceEditor.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)
const balance = ref(JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS)))

onMounted(async () => {
  const saved = await dataBridge.load('balance')
  if (saved) balance.value = normalizeSettings(saved)
})

async function saveBalance() {
  const n = normalizeSettings(balance.value)
  balance.value = n
  await dataBridge.save('balance', n)
}

function resetBalance() {
  balance.value = JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS))
  saveBalance()
}
</script>

<style scoped>
.balance-curve-view { padding: 32px; }
.curve-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.curve-header-left { display: flex; align-items: center; gap: 8px; }
.page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); }

.params-card { margin-bottom: 16px; }
.params-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.params-grid { display: flex; flex-direction: column; gap: 10px; }
.param-item { display: flex; align-items: center; gap: 12px; }
.param-label { font-size: 14px; color: var(--text-secondary); min-width: 120px; }
.param-hint { font-size: 12px; color: var(--text-muted); }

.curve-card { padding: 24px; }
.curve-explain { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; }
</style>
