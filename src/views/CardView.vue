<template>
  <div class="card-view">
    <h1>{{ lang === 'en' ? 'Card Mode' : '翻牌点名' }}</h1>
    <p>{{ lang === 'en' ? 'Card page - Coming soon' : '翻牌点名页 - 开发中' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
</script>

<style scoped>
.card-view {
  padding: 32px;
}
h1 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}
</style>
