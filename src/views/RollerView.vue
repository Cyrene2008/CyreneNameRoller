<template>
  <div class="roller-view">
    <h1 class="roller-title">{{ lang === 'en' ? 'Name Roller' : '随机点名' }}</h1>

    <div class="display-container">
      <div
        v-for="(display, i) in nameDisplays"
        :key="i"
        class="name-display"
        :class="{
          rainbow: settings.rainbowNames,
          final: display.animating,
          entering: display.entering
        }"
        :style="{ opacity: display.opacity }"
      >
        {{ display.text }}
      </div>
    </div>

    <div class="controls">
      <div class="switches">
        <FluentToggle
          v-model="settings.englishMode"
          :label="t('englishMode', lang)"
          @update:model-value="saveSetting('englishMode', $event)"
        />
        <FluentToggle
          v-model="settings.multiMode"
          :label="t('multiMode', lang)"
          @update:model-value="onMultiModeChange"
        />
        <FluentToggle
          v-model="settings.allowDuplicates"
          :label="t('allowDuplicates', lang)"
          @update:model-value="saveSetting('allowDuplicates', $event)"
        />
      </div>

      <div v-if="settings.multiMode" class="multi-settings">
        <span class="setting-label">{{ t('peopleCount', lang) }}</span>
        <div class="count-control">
          <FluentButton variant="secondary" size="sm" @click="changeCount(-1)">
            <FluentIcon icon="subtract-16-regular" :width="14" />
          </FluentButton>
          <FluentInput
            v-model="settings.peopleCount"
            type="number"
            :min="2"
            :max="20"
            style="width: 60px; text-align: center;"
            @update:model-value="onPeopleCountChange"
          />
          <FluentButton variant="secondary" size="sm" @click="changeCount(1)">
            <FluentIcon icon="add-16-regular" :width="14" />
          </FluentButton>
        </div>
      </div>

      <div class="list-selector-bar">
        <span class="selector-label">{{ t('currentList', lang) }}</span>
        <FluentSelect
          :model-value="namesStore.currentListId"
          :options="listOptions"
          @update:model-value="namesStore.switchList"
        />
      </div>

      <div class="start-row">
        <FluentButton
          :variant="isRunning ? 'danger' : 'primary'"
          size="lg"
          class="start-btn"
          @click="toggleRoll"
        >
          <FluentIcon :icon="isRunning ? 'stop-24-filled' : 'play-24-filled'" :width="18" />
          {{ isRunning ? t('stop', lang) : t('start', lang) }}
        </FluentButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'
import { t } from '../utils/i18n'
import { useRecordsStore } from '../stores/records'
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

const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')
const settings = computed(() => settingsStore.settings)

const listOptions = computed(() =>
  namesStore.allLists.map(l => ({ value: l.id, label: l.name }))
)

const nameDisplays = reactive([])
const isRunning = ref(false)
const isDecelerating = ref(false)
const currentSpeed = ref(0)
const lastPickedNames = ref([])

let intervalId = null
let decelerationFrame = 0
const maxSpeed = 100

const balanceSettings = ref({
  enabled: true, factor: 13.3, maxThreshold: 3, maxBoostPercent: 1200,
  points: [{ x: 0.3, y: 150 }, { x: 1.5, y: 420 }, { x: 2.4, y: 800 }]
})

onMounted(async () => {
  const saved = await window.electronAPI.loadData('balance')
  if (saved) balanceSettings.value = { ...balanceSettings.value, ...saved }
})

function initializeDisplays(count) {
  nameDisplays.splice(0)
  lastPickedNames.value = []
  for (let i = 0; i < count; i++) {
    nameDisplays.push({ text: '...', opacity: 0, animating: false, entering: false })
    lastPickedNames.value.push('')
  }
}

function saveSetting(key, value) { settingsStore.update(key, value) }

function onMultiModeChange(val) {
  settingsStore.update('multiMode', val)
  if (!val) initializeDisplays(1)
  else initializeDisplays(settings.value.peopleCount || 2)
}

function onPeopleCountChange(val) {
  const count = Math.max(2, Math.min(20, parseInt(val) || 2))
  settingsStore.update('peopleCount', count)
  if (settings.value.multiMode) initializeDisplays(count)
}

function changeCount(delta) {
  const count = Math.max(2, Math.min(20, (settings.value.peopleCount || 2) + delta))
  settingsStore.update('peopleCount', count)
  if (settings.value.multiMode) initializeDisplays(count)
}

function emphasize(index) {
  nameDisplays[index].animating = true
  setTimeout(() => { nameDisplays[index].animating = false }, 1200)
}

function doPick() {
  const names = namesStore.currentNames
  const whiteList = namesStore.currentWhiteList
  const countsMap = statisticsStore.counts
  const allowDup = settings.value.allowDuplicates
  const excludeList = lastPickedNames.value.filter(n => n)
  if (settings.value.multiMode) return pickBalanced(names, whiteList, countsMap, balanceSettings.value, excludeList, allowDup)
  if (balanceSettings.value.enabled) return pickBalanced(names, whiteList, countsMap, balanceSettings.value, [], true)
  return pickUniform(names, [], true)
}

function animationLoop() {
  if (!isRunning.value) return
  if (isDecelerating.value) {
    decelerationFrame++
    currentSpeed.value = maxSpeed * Math.pow(1 - decelerationFrame / 100, 2)
    if (currentSpeed.value <= 0.5) { currentSpeed.value = 0; finishRoll(); return }
  } else {
    if (currentSpeed.value < maxSpeed) currentSpeed.value = Math.min(maxSpeed, currentSpeed.value + 3)
  }
  const count = settings.value.multiMode ? (settings.value.peopleCount || 2) : 1
  for (let i = 0; i < count; i++) {
    const pick = doPick()
    if (nameDisplays[i]) { nameDisplays[i].text = settings.value.englishMode && pick.en ? pick.en : pick.cn; nameDisplays[i].opacity = 1 }
  }
  intervalId = setTimeout(animationLoop, Math.max(16, 50 - currentSpeed.value * 0.3))
}

function toggleRoll() {
  if (isRunning.value) { isDecelerating.value = true; return }
  if (!namesStore.currentNames || namesStore.currentNames.length === 0) return
  isRunning.value = true; isDecelerating.value = false; currentSpeed.value = 0; decelerationFrame = 0
  initializeDisplays(settings.value.multiMode ? (settings.value.peopleCount || 2) : 1)
  animationLoop()
}

function finishRoll() {
  isRunning.value = false; isDecelerating.value = false
  const count = settings.value.multiMode ? (settings.value.peopleCount || 2) : 1
  const names = namesStore.currentNames; const whiteList = namesStore.currentWhiteList
  const countsMap = statisticsStore.counts; const allowDup = settings.value.allowDuplicates
  lastPickedNames.value = []
  for (let i = 0; i < count; i++) {
    const excludeList = lastPickedNames.value.filter(n => n)
    const pick = allowDup
      ? (balanceSettings.value.enabled ? pickBalanced(names, whiteList, countsMap, balanceSettings.value, excludeList, true) : pickUniform(names, excludeList, true))
      : (balanceSettings.value.enabled ? pickBalanced(names, whiteList, countsMap, balanceSettings.value, excludeList, false) : pickUniform(names, excludeList, false))
    nameDisplays[i].text = settings.value.englishMode && pick.en ? pick.en : pick.cn
    nameDisplays[i].opacity = 1; lastPickedNames.value.push(pick.cn)
    if (settings.value.recordCounts && !whiteList.some(w => w.cn === pick.cn)) statisticsStore.incrementCount(pick.cn)
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
.roller-view {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
  position: relative;
}

.roller-title {
  font-family: 'HarmonyOS Sans SC', var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 32px;
}

.display-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 32px;
  min-height: 80px;
}

.name-display {
  font-family: 'Wengfaluosi', 'HarmonyOS Sans SC', var(--font-display);
  font-size: calc(52px * var(--name-font-factor, 1));
  font-weight: 700;
  color: var(--text-primary);
  min-width: 120px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
}

.name-display::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.name-display.rainbow {
  background: linear-gradient(90deg, #E50012, #FF8C00, #FFEF00, #00811F, #0044FF, #760089, #E50012);
  background-size: 400% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow-flow 5s linear infinite;
  text-shadow: none;
}

@keyframes rainbow-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
}

.name-display.entering { animation: name-enter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes name-enter {
  0% { transform: scale(0.3) rotate(-10deg); opacity: 0; filter: blur(10px); }
  50% { transform: scale(1.1) rotate(2deg); filter: blur(0); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0); }
}

.name-display.final { animation: final-reveal 0.5s cubic-bezier(0.1, 0.9, 0.2, 1); }
@keyframes final-reveal {
  0% { transform: scale(4); opacity: 0; filter: brightness(2); }
  100% { transform: scale(1); filter: brightness(1); }
}

.controls {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  z-index: 10;
  transform: scale(var(--ui-scale, 1));
  transform-origin: bottom right;
}

.switches {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.multi-settings {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.count-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-selector-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-4);
  align-self: stretch;
}

.selector-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.start-row {
  display: flex;
  justify-content: flex-end;
  align-self: stretch;
}

.start-btn {
  min-width: 200px;
  font-size: 16px;
}
</style>
