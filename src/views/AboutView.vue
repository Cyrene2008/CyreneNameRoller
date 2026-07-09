<template>
  <div class="about-view">
    <h1 class="page-title">
      <FluentIcon icon="info-24-regular" :width="28" />
      {{ t('about', lang) }}
    </h1>

    <FluentCard class="about-card">
      <div class="about-logo">
        <img src="/cyrene256.png" alt="CyreneNameRoller" class="logo-img" />
      </div>

      <h2 class="app-name">{{ APP_NAME }}</h2>
      <p class="app-version">{{ APP_VERSION }}</p>
      <p class="app-desc">{{ lang === 'en' ? 'A random name picker with Fluent Design' : '一个采用 Fluent Design 的随机点名器' }}</p>

      <div class="about-divider" />

      <div class="about-section about-actions">
        <FluentButton variant="secondary" size="sm" @click="router.push('/about/contributors')">
          <FluentIcon icon="people-team-16-regular" :width="14" />
          {{ lang === 'en' ? 'Contributors' : '贡献人员' }}
        </FluentButton>
      </div>

      <div class="about-section">
        <h3>{{ lang === 'en' ? 'Author' : '作者' }}</h3>
        <p><a href="#" @click.prevent="openLink('https://github.com/Cyrene2008')">Cyrene2008</a></p>
      </div>

      <div class="about-section">
        <h3>{{ lang === 'en' ? 'Repository' : '仓库' }}</h3>
        <a href="#" @click.prevent="openLink('https://github.com/Cyrene2008/CyreneNameRoller')">github.com/Cyrene2008/CyreneNameRoller</a>
      </div>

      <div class="about-section">
        <h3>{{ lang === 'en' ? 'License' : '许可证' }}</h3>
        <p>GNU General Public License v3.0</p>
        <p class="license-note">
          {{ lang === 'en'
            ? 'This is free software: you are free to change and redistribute it.'
            : '这是自由软件：你可以自由修改和分发它。' }}
        </p>
      </div>

      <div class="about-section">
        <h3>{{ lang === 'en' ? 'Copyright' : '版权声明' }}</h3>
        <p>Copyright &copy; 2025-2026 <a href="#" @click.prevent="openLink('https://github.com/Cyrene2008')">Cyrene2008</a>, All Rights Reserved.</p>
      </div>

      <div class="about-section">
        <p class="icp-link">
          <a href="https://icp.gov.moe/?keyword=20260093" target="_blank" rel="noopener">萌ICP备20260093号</a>
        </p>
      </div>
    </FluentCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { t } from '../utils/i18n'
import { APP_VERSION, APP_NAME } from '../utils/version'
import { openExternal } from '../utils/openExternal'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)

function openLink(url) { openExternal(url) }
</script>

<style scoped>
.about-view {
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

.about-card {
  text-align: center;
}

.about-logo {
  margin-bottom: 16px;
}

.logo-img {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-4);
}

.app-name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.app-version {
  font-size: 14px;
  color: var(--accent);
  margin-bottom: 8px;
}

.app-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.about-divider {
  height: 1px;
  background: var(--border-default);
  margin: 20px 0;
}

.about-section {
  margin-bottom: 16px;
  text-align: center;
}

.about-section h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.about-section p {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.about-section a {
  color: var(--accent);
  font-size: 14px;
}

.license-note {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.icp-link {
  margin-top: 8px;
}

.icp-link a {
  font-size: 12px;
  color: var(--text-muted);
}

.about-actions {
  margin: 16px 0;
}
</style>
