<template>
  <div class="roller-view">
    <h1 class="roller-title">{{ t('h1', lang) }}</h1>

    <div class="display-container">
      <div
        v-for="(display, i) in nameDisplays"
        :key="i"
        class="name-display"
        :class="{ rainbow: settings.nameColorMode === 'gradient', final: display.animating }"
        :style="getNameStyle(display)"
      >
        {{ display.text }}
      </div>
    </div>

    <div class="controls-center">
      <div class="switches">
        <FluentToggle v-model="settings.englishMode" label="English Mode" @update:model-value="saveSetting('englishMode', $event)" />
        <FluentToggle v-model="settings.multiMode" :label="t('multiMode', lang)" @update:model-value="onMultiModeChange" />
        <Transition name="toggle-expand">
          <FluentToggle v-if="settings.multiMode" v-model="settings.forbidDuplicates" :label="t('allowDuplicates', lang)" @update:model-value="onForbidDuplicatesChange" />
        </Transition>
      </div>

      <Transition name="toggle-expand">
        <div v-if="settings.multiMode" class="multi-settings">
          <span class="setting-label">{{ t('peopleCount', lang) }}</span>
          <div class="count-control">
            <FluentButton variant="secondary" size="sm" @click="changeCount(-1)"><FluentIcon icon="subtract-16-regular" :width="14" /></FluentButton>
            <FluentInput v-model="settings.peopleCount" type="number" :min="2" :max="maxPeopleCount" style="width: 60px; text-align: center;" @update:model-value="onPeopleCountChange" />
            <FluentButton variant="secondary" size="sm" @click="changeCount(1)"><FluentIcon icon="add-16-regular" :width="14" /></FluentButton>
          </div>
        </div>
      </Transition>

      <div class="list-selector-bar">
        <span class="selector-label">{{ t('currentList', lang) }}</span>
        <FluentSelect :model-value="namesStore.currentListId" :options="listOptions" @update:model-value="namesStore.switchList" />
      </div>

      <FluentButton :variant="isRunning ? 'danger' : 'primary'" size="lg" class="start-btn" :class="{ 'btn-dimmed': !canStart && !isRunning }" @click="toggleRoll">
        <FluentIcon :icon="isRunning ? 'stop-24-filled' : 'play-24-filled'" :width="18" />
        {{ isRunning ? t('stop', lang) : t('start', lang) }}
      </FluentButton>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'
import { t } from '../utils/i18n'
import { useRecordsStore } from '../stores/records'
import { dataBridge } from '../utils/dataBridge'
import { pickUniform, pickBalanced } from '../utils/balance'
import FluentButton from '../components/FluentButton.vue'
import FluentIcon from '../components/FluentIcon.vue'
import FluentToggle from '../components/FluentToggle.vue'
import FluentSelect from '../components/FluentSelect.vue'
import FluentInput from '../components/FluentInput.vue'

const namesStore = useNamesStore()
const settingsStore = useSettingsStore()
const statisticsStore = useStatisticsStore()
const recordsStore = useRecordsStore()
const showBanner = inject('banner')

const lang = computed(() => settingsStore.settings.language)
const settings = computed(() => settingsStore.settings)
const listOptions = computed(() => namesStore.allLists.map(l => ({ value: l.id, label: l.name })))

const nonWhiteListCount = computed(() => namesStore.currentNames.filter(n => !namesStore.isWhiteList(n.cn) && n.cn !== '再来一次').length)
const maxPeopleCount = computed(() => Math.max(2, nonWhiteListCount.value))
const canStart = computed(() => nonWhiteListCount.value >= 2 && !(settings.value.multiMode && (settings.value.peopleCount || 2) > nonWhiteListCount.value))

const nameDisplays = reactive([])
const isRunning = ref(false)
const lastPickedNames = ref([])
const sessionCounts = ref({})
let intervalId = null

const balanceSettings = ref({
  enabled: true, factor: 13.3, maxThreshold: 3, maxBoostPercent: 1200,
  points: [{ x: 0.3, y: 150 }, { x: 1.5, y: 420 }, { x: 2.4, y: 800 }]
})

onMounted(async () => { const saved = await dataBridge.load('balance'); if (saved) balanceSettings.value = { ...balanceSettings.value, ...saved } })

function initializeDisplays(count) {
  nameDisplays.splice(0); lastPickedNames.value = []
  for (let i = 0; i < count; i++) { nameDisplays.push({ text: '...', opacity: 0, animating: false }); lastPickedNames.value.push('') }
}

function getNameStyle(display) {
  const style = { opacity: display.opacity }
  if (settings.value.nameColorMode === 'custom') {
    const color = settingsStore.darkMode
      ? (settings.value.customNameColorDark || '#f09bd7')
      : (settings.value.customNameColorLight || '#d04a9d')
    style.color = color
  }
  return style
}

function saveSetting(key, value) { settingsStore.update(key, value) }

function onMultiModeChange(val) {
  settingsStore.update('multiMode', val)
  if (!val) { settingsStore.update('forbidDuplicates', false); initializeDisplays(1) }
  else { const c = Math.min(settings.value.peopleCount || 2, maxPeopleCount.value); settingsStore.update('peopleCount', c); initializeDisplays(c) }
}

function onForbidDuplicatesChange(val) { settingsStore.update('forbidDuplicates', val) }

function onPeopleCountChange(val) {
  const c = Math.max(2, Math.min(maxPeopleCount.value, parseInt(val) || 2))
  settingsStore.update('peopleCount', c); if (settings.value.multiMode) initializeDisplays(c)
}

function changeCount(delta) {
  const c = Math.max(2, Math.min(maxPeopleCount.value, (settings.value.peopleCount || 2) + delta))
  settingsStore.update('peopleCount', c); if (settings.value.multiMode) initializeDisplays(c)
}

function emphasize(index) { nameDisplays[index].animating = true; setTimeout(() => { nameDisplays[index].animating = false }, 1200) }

function getDisplayName(person) {
  return settings.value.englishMode && person.en ? person.en : person.cn
}

function doPick(excludeList = []) {
  const names = namesStore.currentNames; const wl = namesStore.currentWhiteList
  const forbidDup = settings.value.multiMode && settings.value.forbidDuplicates
  const combinedCounts = { ...statisticsStore.counts }
  for (const [k, v] of Object.entries(sessionCounts.value)) {
    combinedCounts[k] = (combinedCounts[k] || 0) + v
  }
  if (forbidDup) return pickUniform(names, excludeList, false)
  if (settings.value.multiMode) return pickBalanced(names, wl, combinedCounts, balanceSettings.value, excludeList, true)
  if (balanceSettings.value.enabled) return pickBalanced(names, wl, combinedCounts, balanceSettings.value, [], true)
  return pickUniform(names, [], true)
}

function animationLoop() {
  if (!isRunning.value) return
  const count = settings.value.multiMode ? (settings.value.peopleCount || 2) : 1
  for (let i = 0; i < count; i++) {
    const pick = doPick([])
    if (nameDisplays[i]) { nameDisplays[i].text = getDisplayName(pick); nameDisplays[i].opacity = 1 }
    if (pick.cn && pick.cn !== '再来一次' && !namesStore.isWhiteList(pick.cn)) {
      sessionCounts.value[pick.cn] = (sessionCounts.value[pick.cn] || 0) + 1
    }
  }
  intervalId = setTimeout(animationLoop, 50)
}

function toggleRoll() {
  if (isRunning.value) { clearTimeout(intervalId); isRunning.value = false; finishRoll(); return }
  if (!canStart.value) {
    if (nonWhiteListCount.value < 2) {
      showBanner({ message: lang.value === 'en' ? 'No names available yet' : '唔...你还没添加名单呢♪', icon: 'info-16-regular', type: 'warning', duration: 8000 })
    } else {
      showBanner({ message: lang.value === 'en' ? 'Too many people for available names' : '人数超过了可用名单数量', icon: 'warning-16-regular', type: 'warning', duration: 8000 })
    }
    return
  }
  isRunning.value = true
  sessionCounts.value = {}
  initializeDisplays(settings.value.multiMode ? (settings.value.peopleCount || 2) : 1)
  animationLoop()
}

function finishRoll() {
  const count = settings.value.multiMode ? (settings.value.peopleCount || 2) : 1
  const names = namesStore.currentNames; const wl = namesStore.currentWhiteList
  const forbidDup = settings.value.multiMode && settings.value.forbidDuplicates
  lastPickedNames.value = []
  for (let i = 0; i < count; i++) {
    const ex = lastPickedNames.value.filter(n => n)
    const pick = forbidDup ? pickUniform(names, ex, false) : pickBalanced(names, wl, statisticsStore.counts, balanceSettings.value, ex, true)
    nameDisplays[i].text = getDisplayName(pick); nameDisplays[i].opacity = 1; lastPickedNames.value.push(pick.cn)
    if (settings.value.recordCounts && !wl.some(w => w.cn === pick.cn)) statisticsStore.incrementCount(pick.cn)
    recordsStore.addRecord({ cn: pick.cn, en: pick.en, listName: namesStore.currentList.name, source: 'roller' })
    setTimeout(() => emphasize(i), 50 * i)
  }
}

onMounted(() => {
  if (namesStore.isLoaded) initializeDisplays(settings.value.multiMode ? (settings.value.peopleCount || 2) : 1)
  watch(() => namesStore.isLoaded, (loaded) => { if (loaded) initializeDisplays(settings.value.multiMode ? (settings.value.peopleCount || 2) : 1) })
})
onBeforeUnmount(() => { if (intervalId) clearTimeout(intervalId) })
</script>

<style scoped>
.roller-view { padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; position: relative; }
.roller-title { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; width: 100%; text-align: center; position: absolute; top: 32px; left: 0; right: 0; }
.display-container { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 32px; min-height: 80px; }

.name-display { font-family: var(--font-display); font-size: calc(52px * var(--name-font-factor, 1)); font-weight: 700; color: var(--text-primary); min-width: 120px; text-align: center; white-space: nowrap; overflow: hidden; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); text-shadow: 0 4px 20px rgba(234, 94, 193, 0.15); position: relative; }
.name-display::before { content: ''; position: absolute; inset: -4px; background: var(--accent); border-radius: var(--radius-sm); z-index: -1; opacity: 0; transition: opacity 0.3s ease; }
.name-display.rainbow {
  background: linear-gradient(90deg, #ff6ad9, #72afec, #ff6ad9, #72afec, #ff6ad9, #72afec, #ff6ad9, #72afec, #ff6ad9);
  background-size: 800% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  animation: gradient-shift 32s linear infinite;
}

.name-display.rainbow.final {
  animation: gradient-shift 32s linear infinite, final-reveal 0.5s cubic-bezier(0.1, 0.9, 0.2, 1);
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 800% 50%; }
}

.name-display:not(.rainbow).final {
  animation: final-reveal 0.5s cubic-bezier(0.1, 0.9, 0.2, 1);
}
@keyframes final-reveal { 0% { transform: scale(4); opacity: 0; filter: brightness(2); } 100% { transform: scale(1); filter: brightness(1); } }

.controls-center { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; z-index: 10; }
.switches { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
.multi-settings { display: flex; align-items: center; gap: 12px; }
.setting-label { font-size: 14px; color: var(--text-secondary); }
.count-control { display: flex; align-items: center; gap: 8px; }
.list-selector-bar { display: flex; align-items: center; gap: 12px; background: var(--bg-card); backdrop-filter: blur(20px); padding: 8px 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-default); box-shadow: var(--shadow-4); width: 100%; justify-content: center; }
.selector-label { font-size: 14px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
.start-btn { min-width: 280px; font-size: 16px; min-height: 48px; margin-top: 8px; }
.btn-dimmed { opacity: 0.45; cursor: not-allowed; }

.toggle-expand-enter-active { animation: toggle-in 0.25s cubic-bezier(0.1, 0.9, 0.2, 1); }
.toggle-expand-leave-active { animation: toggle-in 0.15s ease-in reverse; }
@keyframes toggle-in { from { opacity: 0; transform: translateY(-8px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 40px; } }
</style>
