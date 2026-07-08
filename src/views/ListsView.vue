<template>
  <div class="lists-view">
    <h1>{{ lang === 'en' ? 'List Manager' : '名单管理' }}</h1>
    <p>{{ lang === 'en' ? 'Lists page - Coming soon' : '名单管理页 - 开发中' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
</script>

<style scoped>
.lists-view {
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
