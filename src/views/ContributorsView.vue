<template>
  <div class="contributors-view">
    <div class="contributors-header">
      <FluentButton variant="subtle" size="sm" icon-only @click="router.back()">
        <FluentIcon icon="arrow-left-16-regular" :width="18" />
      </FluentButton>
      <FluentIcon icon="people-team-24-regular" :width="22" />
      <h1 class="page-title">{{ lang === 'en' ? 'Contributors' : '贡献人员' }}</h1>
    </div>

    <div class="contributors-grid">
      <FluentCard v-for="c in contributors" :key="c.github" class="contributor-card">
        <img :src="c.avatar" :alt="c.name" class="contributor-avatar" />
        <div class="contributor-info">
          <h3 class="contributor-name">{{ c.name }}</h3>
          <p class="contributor-alias">{{ c.alias }}</p>
          <div class="contributor-roles">
            <span v-for="role in c.roles" :key="role" class="role-badge">{{ role }}</span>
          </div>
          <a href="#" @click.prevent="openLink(`https://github.com/${c.github}`)" class="contributor-link">
            <FluentIcon icon="mark-github-16-regular" :width="16" />
          </a>
        </div>
      </FluentCard>
    </div>

    <FluentCard class="attribution-card">
      <h3 class="attr-title">
        <FluentIcon icon="shield-16-regular" :width="16" />
        {{ lang === 'en' ? 'Third-Party Resources' : '非商用资源引用声明' }}
      </h3>
      <p class="attr-text">
        {{ lang === 'en'
          ? 'This application uses game resources from Honkai: Star Rail. All related copyrights belong to miHoYo/HoYoverse. This project is non-commercial and for educational purposes only.'
          : '本应用使用了来自崩坏：星穹铁道的游戏资源，相关版权归 miHoYo/HoYoverse 所有。本项目为非商业用途，仅供学习交流。' }}
      </p>
    </FluentCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { openExternal } from '../utils/openExternal'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)

function openLink(url) { openExternal(url) }

const contributors = [
  {
    github: 'Cyrene2008',
    name: 'Cyrene2008',
    alias: '星海昔涟',
    roles: ['Main Idea', 'Code', 'Design'],
    avatar: './avatars/Cyrene2008.png'
  },
  {
    github: 'LeafS825',
    name: 'LeafS825',
    alias: '叶背影',
    roles: ['Idea', 'Code', 'Design'],
    avatar: './avatars/LeafS825.png'
  }
]
</script>

<style scoped>
.contributors-view { padding: 32px; }
.contributors-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
.page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); }

.contributors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.contributor-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.contributor-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--bg-hover);
}

.contributor-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.contributor-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.contributor-alias {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.contributor-roles {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.role-badge {
  font-size: 11px;
  color: var(--accent);
  background: var(--accent-50);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.contributor-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.contributor-link:hover {
  color: var(--accent);
}

.attribution-card { padding: 20px; }
.attr-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px; }
.attr-text { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0; }
</style>
