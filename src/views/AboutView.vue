<template>
  <div class="about-view">
    <h1>{{ lang === 'en' ? 'About' : '关于' }}</h1>
    <p>{{ lang === 'en' ? 'About page - Coming soon' : '关于页 - 开发中' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
</script>

<style scoped>
.about-view {
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
