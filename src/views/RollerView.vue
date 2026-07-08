<template>
  <div class="roller-view">
    <h1>{{ lang === 'en' ? 'Name Roller v3.0' : '点名器 v3.0' }}</h1>
    <p>{{ lang === 'en' ? 'Roller page - Coming soon' : '随机点名页 - 开发中' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
</script>

<style scoped>
.roller-view {
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
