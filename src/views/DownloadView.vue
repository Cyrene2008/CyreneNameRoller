<template>
  <div class="download-view">
    <div class="download-header">
      <FluentIcon icon="arrow-download-24-regular" :width="28" />
      <h1 class="page-title">{{ lang === 'en' ? 'Download Client' : '下载客户端' }}</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <FluentIcon icon="spinner-ios-20-regular" :width="24" class="spin-icon" />
      <span>{{ lang === 'en' ? 'Loading...' : '正在获取最新版本信息...' }}</span>
    </div>

    <div v-else-if="error" class="error-state">
      <FluentIcon icon="warning-16-regular" :width="20" />
      <span>{{ error }}</span>
      <FluentButton variant="secondary" size="sm" @click="fetchAssets">
        <FluentIcon icon="arrow-sync-16-regular" :width="14" /> {{ lang === 'en' ? 'Retry' : '重试' }}
      </FluentButton>
    </div>

    <template v-else>
      <div class="version-info">
        <span class="version-tag">{{ tagName }}</span>
        <span class="version-time">{{ publishedAt }}</span>
      </div>

      <div class="asset-list">
        <div v-for="asset in sortedAssets" :key="asset.name" class="asset-card">
          <div class="asset-header">
            <FluentIcon :icon="asset.name.includes('Tauri') ? 'box-24-regular' : 'laptop-24-regular'" :width="20" />
            <span class="asset-name">{{ asset.name }}</span>
          </div>
          <div class="asset-meta">
            <span class="meta-item">
              <FluentIcon icon="lock-closed-16-regular" :width="12" />
              sha256:<span class="num">{{ asset.digest ? asset.digest.split(':')[1]?.substring(0, 16) + '...' : 'N/A' }}</span>
            </span>
            <span class="meta-item">
              <FluentIcon icon="arrow-download-16-regular" :width="12" />
              <span class="num">{{ asset.download_count }}</span> {{ lang === 'en' ? 'downloads' : '次下载' }}
            </span>
            <span class="meta-item">
              <FluentIcon icon="database-16-regular" :width="12" />
              <span class="num">{{ formatSize(asset.size).num }}</span> {{ formatSize(asset.size).unit }}
            </span>
            <span class="meta-item">
              <FluentIcon icon="clock-16-regular" :width="12" />
              <template v-if="formatTime(asset.updated_at).num"><span class="num">{{ formatTime(asset.updated_at).num }}</span> {{ formatTime(asset.updated_at).unit }}</template>
              <template v-else>{{ formatTime(asset.updated_at).unit }}</template>
            </span>
          </div>
          <FluentButton variant="primary" size="sm" @click="downloadAsset(asset)">
            <FluentIcon icon="arrow-download-16-regular" :width="14" />
            {{ lang === 'en' ? 'Download' : '下载' }}
          </FluentButton>
        </div>
      </div>

      <div class="fallback-section">
        <FluentButton variant="secondary" size="sm" @click="openGitHub">
          <FluentIcon icon="link-16-regular" :width="14" />
          {{ lang === 'en' ? 'View on GitHub' : '前往 GitHub 下载页面' }}
        </FluentButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import FluentCard from '../components/FluentCard.vue'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'

const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.language)

const GITHUB_REPO = 'Cyrene2008/CyreneNameRoller'
const GITHUB_API = 'https://api.github.com/repos/'

const loading = ref(true)
const error = ref('')
const tagName = ref('')
const publishedAt = ref('')
const assets = ref([])

const sortedAssets = computed(() => {
  return [...assets.value].sort((a, b) => {
    if (a.name.includes('Tauri') && !b.name.includes('Tauri')) return -1
    if (!a.name.includes('Tauri') && b.name.includes('Tauri')) return 1
    return 0
  })
})

function formatSize(bytes) {
  if (!bytes) return { num: 'N/A', unit: '' }
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return { num: mb.toFixed(1), unit: 'MB' }
  return { num: (bytes / 1024).toFixed(1), unit: 'KB' }
}

function formatTime(iso) {
  if (!iso) return { num: 'N/A', unit: '' }
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return { num: '', unit: lang.value === 'en' ? 'Just now' : '刚刚' }
  if (hours < 24) return { num: hours, unit: lang.value === 'en' ? 'hours ago' : '小时前' }
  if (days < 30) return { num: days, unit: lang.value === 'en' ? 'days ago' : '天前' }
  return { num: '', unit: d.toLocaleDateString() }
}

async function fetchAssets() {
  loading.value = true
  error.value = ''
  assets.value = []

  const urls = [
    GITHUB_API + GITHUB_REPO + '/releases/latest',
    'https://api.kkgithub.com/repos/' + GITHUB_REPO + '/releases/latest'
  ]

  let data = null
  for (const url of urls) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10000)
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: ctrl.signal
      })
      clearTimeout(timer)
      if (resp.ok) { data = await resp.json(); break }
    } catch {}
  }

  if (!data) {
    error.value = lang.value === 'en' ? 'Failed to fetch release info' : '无法获取版本信息'
    loading.value = false
    return
  }

  tagName.value = data.tag_name || ''
  publishedAt.value = data.published_at ? new Date(data.published_at).toLocaleDateString() : ''
  assets.value = (data.assets || []).filter(a => a.name.endsWith('.exe') || a.name.endsWith('.dmg') || a.name.endsWith('.AppImage'))
  loading.value = false
}

async function downloadAsset(asset) {
  const ghproxyUrl = 'https://gh.昔涟.cn/' + asset.browser_download_url
  window.open(ghproxyUrl, '_blank')
}

function openGitHub() {
  window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank')
}

onMounted(fetchAssets)
</script>

<style scoped>
.download-view {
  padding: 32px;
  max-width: 720px;
}

.download-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.loading-state, .error-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: var(--text-muted);
  font-size: 14px;
}

.error-state {
  color: #c42b1c;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.version-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.version-tag {
  font-family: var(--font-num);
  font-size: calc(16px * var(--font-num-scale, 1.6));
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-50);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  transform: translateY(-4px);
}

.version-time {
  font-size: 13px;
  color: var(--text-muted);
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.asset-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asset-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.asset-name {
  font-family: var(--font-num);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}

.asset-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-ui);
}

.meta-item .num {
  font-family: var(--font-num);
  font-size: calc(12px * var(--font-num-scale, 1.6));
}

.fallback-section {
  padding-top: 16px;
  border-top: 1px solid var(--border-default);
}
</style>
