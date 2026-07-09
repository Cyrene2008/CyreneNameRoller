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
        <FluentIcon icon="arrow-reset-16-regular" :width="14" /> {{ lang === 'en' ? 'Reset' : '恢复默认' }}
      </FluentButton>
    </div>

    <FluentCard class="curve-card">
      <p class="curve-explain">{{ lang === 'en' ? 'Names picked fewer times get higher probability next round. Drag points or edit values below.' : '被抽中次数越少，下次被抽中的概率越高。拖动点或编辑下方数值。' }}</p>
      <BalanceEditor v-model="balance.points" :lang="lang" @update:model-value="saveBalance" />
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
.curve-card { padding: 24px; }
.curve-explain { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; }
</style>
