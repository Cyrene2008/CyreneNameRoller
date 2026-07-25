<template>
  <div class="roller-view" ref="rollerViewRef">
    <h1 class="roller-title">{{ t('h1', lang) }}</h1>

    <div
      class="display-container"
      ref="displayRef"
    >
      <div
        v-for="(display, i) in nameDisplays"
        :key="i"
        class="name-display"
        :class="{ rainbow: settings.nameColorMode === 'gradient', final: display.animating }"
        :style="getNameStyle(display, i)"
      >
        {{ display.text }}
      </div>
    </div>

    <!-- 用于测量文字宽度的隐藏探针 -->
    <span ref="probeRef" class="fit-probe" aria-hidden="true"></span>

    <div class="controls-center" ref="controlsCenterRef">
      <div class="switches">
        <FluentToggle v-model="settings.englishMode" label="English Mode" @update:model-value="saveSetting('englishMode', $event)" />
        <FluentToggle v-model="settings.groupMode" :label="t('groupMode', lang)" @update:model-value="onGroupModeChange" />
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
            <FluentInput v-model="settings.peopleCount" type="number" :min="2" :max="maxPeopleCount" class="count-input" @update:model-value="onPeopleCountChange" />
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
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick, inject } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'
import { t } from '../utils/i18n'
import { useRecordsStore } from '../stores/records'
import { dataBridge } from '../utils/dataBridge'
import {
  pickCyreneBalanced,
  pickCyreneBatch,
  DEFAULT_CYRENE_BALANCE_SETTINGS,
  normalizeCyreneBalanceSettings
} from '../utils/cyrene-balance'
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

const groupPoolCount = computed(() => {
  const groups = namesStore.currentList.groups || []
  const hasUnassigned = namesStore.currentNames.some(n => !n.groupId)
  return groups.length + (hasUnassigned ? 1 : 0)
})

const nonWhiteListCount = computed(() => namesStore.currentNames.filter(n => !n.isWhiteList).length)
const maxPeopleCount = computed(() => {
  if (!settings.value.multiMode) return 1
  if (settings.value.forbidDuplicates) {
    return Math.max(2, settings.value.groupMode ? groupPoolCount.value : nonWhiteListCount.value)
  }
  return 9999
})
const canStart = computed(() => {
  if (settings.value.groupMode) {
    if (groupPoolCount.value < 1) return false
    if (settings.value.multiMode && settings.value.forbidDuplicates && (settings.value.peopleCount || 2) > groupPoolCount.value) return false
    return true
  }
  if (nonWhiteListCount.value < 2) return false
  if (settings.value.multiMode && settings.value.forbidDuplicates && (settings.value.peopleCount || 2) > nonWhiteListCount.value) return false
  return true
})

const nameDisplays = reactive([])
const isRunning = ref(false)
const lastPickedNames = ref([])
const sessionCounts = ref({})
let intervalId = null
const pendingTimers = []
const revealed = ref([])
const gridParams = reactive({ valid: false, font: 52, lineH: 60, cellW: 0, count: 0, positions: [], revealScale: 1 })

const balanceSettings = ref({ ...DEFAULT_CYRENE_BALANCE_SETTINGS })

onMounted(async () => {
  const saved = await dataBridge.load('balance')
  balanceSettings.value = normalizeCyreneBalanceSettings(saved)
  if (balanceSettings.value.enabled && !settings.value.recordCounts) {
    settingsStore.update('recordCounts', true)
  }
  if (saved && JSON.stringify(saved) !== JSON.stringify(balanceSettings.value)) {
    await dataBridge.save('balance', balanceSettings.value)
  }
})

function initializeDisplays(count) {
  nameDisplays.splice(0); lastPickedNames.value = []
  const pool = settings.value.groupMode ? getCurrentPool() : namesStore.currentNames
  for (let i = 0; i < count; i++) {
    const src = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { cn: '...', en: '' }
    const txt = getDisplayName(src)
    nameDisplays.push({ text: txt, opacity: 0, animating: false, isWhiteList: false })
    lastPickedNames.value.push('')
  }
  nextTick(() => { computeGridParams(); computeNameLayout() })
}

function getNameStyle(display, i) {
  const style = { opacity: display.opacity }
  const layout = nameLayout.value[i]
  if (layout) {
    style.left = layout.x + 'px'
    style.top = layout.y + 'px'
    style.width = gridParams.cellW + 'px'
    style.textAlign = 'center'
    style.fontSize = (nameFontSize.value * (settings.value.nameFontSize || 1)) + 'px'
    style['--reveal-scale'] = gridParams.revealScale
  }
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
  if (!val) initializeDisplays(1)
  else {
    let c = Math.min(settings.value.peopleCount || 2, maxPeopleCount.value)
    if (settings.value.groupMode && settings.value.forbidDuplicates) c = Math.min(c, groupPoolCount.value)
    settingsStore.update('peopleCount', c); initializeDisplays(c)
  }
  nextTick(computeNameLayout)
}

function onGroupModeChange(val) {
  settingsStore.update('groupMode', val)
  if (settings.value.multiMode && settings.value.forbidDuplicates && (settings.value.peopleCount || 2) > groupPoolCount.value) {
    const c = Math.max(2, groupPoolCount.value)
    settingsStore.update('peopleCount', c); initializeDisplays(c)
  }
  nextTick(computeNameLayout)
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

function getCurrentPool() {
  const groups = (namesStore.currentList.groups || [])
  const pool = groups.map(g => ({ cn: g.name, en: g.enName || '', id: g.id, isGroup: true }))
  const hasUnassigned = namesStore.currentNames.some(n => !n.groupId)
  if (hasUnassigned) pool.push({ cn: t('unassigned', lang.value), en: 'Unassigned', id: '__unassigned__', isGroup: true, isUnassigned: true })
  return pool
}

function doPick(excludeList = []) {
  if (settings.value.groupMode) {
    const pool = getCurrentPool()
    const forbidDup = settings.value.multiMode && settings.value.forbidDuplicates
    if (forbidDup) {
      const avail = pool.filter(p => !excludeList.includes(p.id))
      return avail.length ? avail[Math.floor(Math.random() * avail.length)] : pool[Math.floor(Math.random() * pool.length)]
    }
    return pool[Math.floor(Math.random() * pool.length)]
  }
  const names = namesStore.currentNames
  const wl = names.filter(n => n.isWhiteList).map(n => n.cn)
  const forbidDup = settings.value.multiMode && settings.value.forbidDuplicates
  const combinedCounts = { ...statisticsStore.counts }
  for (const [k, v] of Object.entries(sessionCounts.value)) {
    combinedCounts[k] = (combinedCounts[k] || 0) + v
  }
  return pickCyreneBalanced(
    names,
    wl,
    combinedCounts,
    balanceSettings.value,
    excludeList,
    !forbidDup
  )
}

function animationLoop() {
  if (!isRunning.value) return
  const count = settings.value.multiMode ? (settings.value.peopleCount || 2) : 1
  for (let i = 0; i < count; i++) {
    const pick = doPick([])
    const txt = getDisplayName(pick)
    if (nameDisplays[i]) {
      nameDisplays[i].text = txt
      nameDisplays[i].opacity = 1
      nameDisplays[i].isWhiteList = !!pick.isWhiteList
    }
    if (pick.cn && !pick.isWhiteList) {
      sessionCounts.value[pick.cn] = (sessionCounts.value[pick.cn] || 0) + 1
    }
  }
  // 只更新文字内容的位置，不重新计算网格参数（避免抖动）
  updateNamePositionsOnly()
  intervalId = setTimeout(animationLoop, 50)
}

function updateNamePositionsOnly() {
  const n = nameDisplays.length
  if (!displayRef.value || n === 0 || !gridParams.valid) return
  nameFontSize.value = gridParams.font
  nameLayout.value = gridParams.positions.slice(0, n)
}

function toggleRoll() {
  if (isRunning.value) { clearTimeout(intervalId); isRunning.value = false; finishRoll(); return }
  pendingTimers.forEach(id => clearTimeout(id)); pendingTimers.length = 0
  if (!canStart.value) {
    if (settings.value.groupMode && groupPoolCount.value < 1) {
      showBanner({ message: lang.value === 'en' ? 'No groups yet, create some in Group Management' : '还没有小组，请先在「小组管理」中创建小组♪', icon: 'info-16-regular', type: 'warning', duration: 8000 })
    } else if (nonWhiteListCount.value < 2) {
      showBanner({ message: lang.value === 'en' ? 'No names available yet' : '唔...你还没添加名单呢♪', icon: 'info-16-regular', type: 'warning', duration: 8000 })
    } else {
      showBanner({ message: lang.value === 'en' ? 'Too many people for available names' : '人数超过了可用名单数量', icon: 'warning-16-regular', type: 'warning', duration: 8000 })
    }
    return
  }
  isRunning.value = true
  sessionCounts.value = {}
  initializeDisplays(settings.value.multiMode ? (settings.value.peopleCount || 2) : 1)
  // 动画开始前先计算好网格参数
  nextTick(() => {
    computeGridParams()
    computeNameLayout()
    animationLoop()
  })
}

function finishRoll() {
  const count = settings.value.multiMode ? (settings.value.peopleCount || 2) : 1
  const names = namesStore.currentNames
  const wl = names.filter(n => n.isWhiteList).map(n => n.cn)
  const forbidDup = settings.value.multiMode && settings.value.forbidDuplicates
  lastPickedNames.value = []
  let finalPicks = []
  if (settings.value.groupMode) {
    for (let i = 0; i < count; i++) {
      const ex = lastPickedNames.value.filter(n => n)
      const pool = getCurrentPool()
      if (forbidDup) {
        const avail = pool.filter(p => !ex.includes(p.id))
        const pick = avail.length ? avail[Math.floor(Math.random() * avail.length)] : pool[Math.floor(Math.random() * pool.length)]
        finalPicks.push(pick)
        lastPickedNames.value.push(pick.id)
      } else {
        const pick = pool[Math.floor(Math.random() * pool.length)]
        finalPicks.push(pick)
        lastPickedNames.value.push(pick.id)
      }
    }
  } else {
    finalPicks = pickCyreneBatch(
      names,
      wl,
      statisticsStore.counts,
      balanceSettings.value,
      count,
      !forbidDup
    )
    lastPickedNames.value = finalPicks.map(pick => pick.cn)
  }
  const shouldRecordCounts = settings.value.recordCounts || balanceSettings.value.enabled
  if (shouldRecordCounts) {
    statisticsStore.incrementCounts(finalPicks.filter(pick => !pick.isWhiteList).map(pick => pick.cn))
  }
  for (let i = 0; i < finalPicks.length; i++) {
    const pick = finalPicks[i]
    recordsStore.addRecord({ cn: pick.cn, en: pick.en, listName: namesStore.currentList.name, source: 'roller' })
  }
  nextTick(computeNameLayout)

  const useStepStop = settings.value.multiMode && settings.value.multiStepStop
  const stagger = useStepStop ? Math.round((settings.value.stepStopInterval || 0.15) * 1000) : 0
  revealed.value = new Array(count).fill(false)
  for (let i = 0; i < count; i++) {
    const tid = setTimeout(() => {
      revealed.value[i] = true
      const pick = finalPicks[i]
      nameDisplays[i].text = getDisplayName(pick)
      nameDisplays[i].opacity = 1
      nameDisplays[i].isWhiteList = !!pick.isWhiteList
      emphasize(i)
    }, i * stagger)
    pendingTimers.push(tid)
  }
  if (settings.value.multiMode) windDownLoop(count, useStepStop ? stagger : 0)
}

function windDownLoop(count, stagger) {
  let tick = 0
  const maxTicks = stagger > 0 ? Math.ceil((count - 1) * stagger / 50) + 3 : 1
  function tickFn() {
    if (tick++ > maxTicks) return
    for (let i = 0; i < count; i++) {
      if (revealed.value[i]) continue
      const pick = doPick([])
      nameDisplays[i].text = getDisplayName(pick)
      nameDisplays[i].opacity = 1
    }
    computeNameLayout()
    const tid = setTimeout(tickFn, 50)
    pendingTimers.push(tid)
  }
  tickFn()
}

const rollerViewRef = ref(null)
const displayRef = ref(null)
const controlsCenterRef = ref(null)
const probeRef = ref(null)
const nameFontSize = ref(52)
const nameLayout = ref([])

const measureCache = new Map()
function measureNameWidth(text) {
  const key = text && text.length ? text : '...'
  if (measureCache.has(key)) return measureCache.get(key)
  let w
  if (!probeRef.value) { w = key.length * 30 }
  else { probeRef.value.textContent = key; w = probeRef.value.offsetWidth }
  measureCache.set(key, w)
  return w
}

function getPoolMaxWidth() {
  const pool = settings.value.groupMode ? getCurrentPool() : namesStore.currentNames
  let m = 1
  for (const p of pool) {
    const w = measureNameWidth(getDisplayName(p))
    if (w > m) m = w
  }
  return m
}

function computeGridParams() {
  const cont = displayRef.value
  if (!cont || nameDisplays.length === 0) { gridParams.valid = false; return }
  const cW = cont.clientWidth
  const cH = cont.clientHeight
  const factor = settings.value.nameFontSize || 1
  const n = nameDisplays.length
  const maxW = getPoolMaxWidth()
  const exclusion = getControlsExclusion(cont, cW, cH)
  const visualCenter = getVisualCenter(cont, cW, cH)

  if (n === 1) {
    const font = 52
    const actualFont = font * factor
    const lineH = actualFont * 1.18
    const textLineH = actualFont * 1.05
    const cellW = Math.max(actualFont * 1.5, maxW * (font / 52) * factor + 2)
    const x = Math.max(0, Math.min(cW - cellW, visualCenter.x - cellW / 2))
    const y = Math.max(0, Math.min(cH - textLineH, visualCenter.y - textLineH / 2))
    Object.assign(gridParams, {
      valid: true,
      font,
      lineH,
      cellW,
      positions: [{ x, y }],
      score: 0,
      count: 1,
      revealScale: 2.2
    })
    return
  }

  function buildPlan(font, columns, rows, allowLeftRegion = false) {
    const actualFont = font * factor
    const lineH = actualFont * 1.18
    const gapX = Math.max(8, actualFont * 0.42)
    const gapY = Math.max(8, actualFont * 0.42)
    const cellW = Math.max(actualFont * 1.5, maxW * (font / 52) * factor + 2)
    const contentW = columns * cellW + (columns - 1) * gapX
    const contentH = rows * lineH + (rows - 1) * gapY
    if (contentW > cW + 0.5 || contentH > cH + 0.5) return null

    const origins = []
    const addOrigin = (left, top, width, height) => {
      if (width < contentW || height < contentH) return
      const originX = left + (width - contentW) / 2
      const originY = top + (height - contentH) / 2
      const cells = []
      let blocked = false
      for (let row = 0; row < rows && !blocked; row++) {
        const cellTop = originY + row * (lineH + gapY)
        for (let column = 0; column < columns; column++) {
          const x = originX + column * (cellW + gapX)
          const cell = { left: x, top: cellTop, right: x + cellW, bottom: cellTop + lineH }
          if (exclusion && rectanglesOverlap(cell, exclusion)) {
            blocked = true
            break
          }
          cells.push({ x, y: cellTop + (lineH - actualFont) / 2 })
        }
      }
      if (!blocked) origins.push({ originX, originY, width, height, cells })
    }

    const fullOriginX = Math.max(0, Math.min(cW - contentW, visualCenter.x - contentW / 2))
    const fullOriginY = Math.max(0, Math.min(cH - contentH, visualCenter.y - contentH / 2))
    addOrigin(fullOriginX - (cW - contentW) / 2, fullOriginY - (cH - contentH) / 2, cW, cH)
    if (exclusion) {
      addOrigin(0, 0, cW, exclusion.top)
      if (allowLeftRegion) addOrigin(0, 0, exclusion.left, cH)
    }
    if (origins.length === 0) return null

    const emptySlots = columns * rows - n
    const layoutAspect = contentW / Math.max(1, contentH)
    const best = origins.reduce((current, origin) => {
      const targetAspect = origin.width / Math.max(1, origin.height)
      const centerDistance = ((origin.originX + contentW / 2 - visualCenter.x) / cW) ** 2
        + ((origin.originY + contentH / 2 - visualCenter.y) / cH) ** 2
      const score = Math.abs(Math.log(Math.max(0.01, layoutAspect / targetAspect))) * 34
        + (emptySlots / n) * 18
        + centerDistance * 12
        + (n <= 4 ? (rows - 1) * 100 : 0)
      return !current || score < current.score ? { ...origin, score } : current
    }, null)

    const basePerRow = Math.floor(n / rows)
    const extraRows = n % rows
    const positions = []
    for (let row = 0, index = 0; row < rows && index < n; row++) {
      const rowCount = basePerRow + (row < extraRows ? 1 : 0)
      const rowStart = (columns - rowCount) / 2
      for (let column = 0; column < rowCount; column++, index++) {
        positions.push({
          x: best.originX + (rowStart + column) * (cellW + Math.max(8, actualFont * 0.42)),
          y: best.originY + row * (lineH + Math.max(8, actualFont * 0.42)) + (lineH - actualFont) / 2
        })
      }
    }
    return { font, lineH, cellW, positions, score: best.score }
  }

  function findPlan(allowLeftRegion) {
    for (let font = 52; font >= 2; font--) {
      const actualFont = font * factor
      const gapX = Math.max(8, actualFont * 0.42)
      const gapY = Math.max(8, actualFont * 0.42)
      const lineH = actualFont * 1.18
      const cellW = Math.max(actualFont * 1.5, maxW * (font / 52) * factor + 2)
      const plans = []

      const maxColumns = Math.min(n, Math.floor((cW + gapX) / (cellW + gapX)))
      const maxRows = Math.min(n, Math.floor((cH + gapY) / (lineH + gapY)))
      for (let columns = 1; columns <= maxColumns; columns++) {
        for (let rows = 1; rows <= maxRows; rows++) {
          if (columns * rows < n) continue
          const plan = buildPlan(font, columns, rows, allowLeftRegion)
          if (plan) plans.push(plan)
        }
      }
      if (plans.length > 0) return plans.reduce((best, plan) => plan.score < best.score ? plan : best)
    }
    return null
  }
  let chosen = findPlan(false)
  if (!chosen) chosen = findPlan(true)
  if (!chosen) { gridParams.valid = false; return }

  const revealScale = n === 1 ? 2.2 : 1
  Object.assign(gridParams, { valid: true, ...chosen, count: n, revealScale })
}

function rectanglesOverlap(left, right) {
  return left.left < right.right
    && left.right > right.left
    && left.top < right.bottom
    && left.bottom > right.top
}

function getVisualCenter(container, containerWidth, containerHeight) {
  const view = rollerViewRef.value
  if (!view) return { x: containerWidth / 2, y: containerHeight / 2 }
  const containerRect = container.getBoundingClientRect()
  const viewRect = view.getBoundingClientRect()
  const scaleX = containerWidth / Math.max(1, containerRect.width)
  const scaleY = containerHeight / Math.max(1, containerRect.height)
  return {
    x: Math.max(0, Math.min(containerWidth, (viewRect.left + viewRect.width / 2 - containerRect.left) * scaleX)),
    y: Math.max(0, Math.min(containerHeight, (viewRect.top + viewRect.height / 2 - containerRect.top) * scaleY))
  }
}

function getControlsExclusion(container, containerWidth, containerHeight) {
  const controls = controlsCenterRef.value
  if (!controls) return null
  const containerRect = container.getBoundingClientRect()
  const controlsRect = controls.getBoundingClientRect()
  if (containerRect.width <= 0 || containerRect.height <= 0) return null

  const scaleX = containerWidth / containerRect.width
  const scaleY = containerHeight / containerRect.height
  const margin = Math.max(16, Math.min(28, containerWidth * 0.018))
  const left = Math.max(0, Math.min(containerWidth, (controlsRect.left - containerRect.left) * scaleX - margin))
  const top = Math.max(0, Math.min(containerHeight, (controlsRect.top - containerRect.top) * scaleY - margin))
  if (left >= containerWidth || top >= containerHeight) return null
  return { left, top, right: containerWidth, bottom: containerHeight }
}

function computeNameLayout() {
  const n = nameDisplays.length
  if (!displayRef.value || n === 0) { nameFontSize.value = 52; nameLayout.value = []; return }
  if (!gridParams.valid || gridParams.count !== n) computeGridParams()
  if (!gridParams.valid) { nameLayout.value = []; return }
  nameFontSize.value = gridParams.font
  nameLayout.value = gridParams.positions.slice(0, n)
}

function onResize() { computeGridParams(); computeNameLayout() }

let layoutObserver = null

onMounted(() => {
  if (namesStore.isLoaded) initializeDisplays(settings.value.multiMode ? (settings.value.peopleCount || 2) : 1)
  watch(() => namesStore.isLoaded, (loaded) => { if (loaded) initializeDisplays(settings.value.multiMode ? (settings.value.peopleCount || 2) : 1) })
  watch(() => namesStore.currentListId, () => nextTick(() => { computeGridParams(); computeNameLayout() }))
  watch(() => settings.value.englishMode, () => nextTick(() => { computeGridParams(); computeNameLayout() }))
  watch(() => [settings.value.multiMode, settings.value.groupMode, settings.value.forbidDuplicates, settings.value.peopleCount, settings.value.nameFontSize], () => nextTick(() => { computeGridParams(); computeNameLayout() }))
  layoutObserver = new ResizeObserver(onResize)
  if (displayRef.value) layoutObserver.observe(displayRef.value)
  if (controlsCenterRef.value) layoutObserver.observe(controlsCenterRef.value)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => { if (intervalId) clearTimeout(intervalId); pendingTimers.forEach(id => clearTimeout(id)); layoutObserver?.disconnect(); window.removeEventListener('resize', onResize) })
</script>

<style scoped>
.roller-view { padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; position: relative; }
.roller-title { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; width: 100%; text-align: center; position: absolute; top: 32px; left: 0; right: 0; z-index: 5; }

/* 展示区：绝对定位占据标题与 controls-center 之间的区域，名字以绝对定位摆放，
   仅避让右下角的控件区域（controls-center），其余空间均可显示名字 */
.display-container {
  position: absolute;
  top: 96px;
  left: 24px;
  right: 24px;
  bottom: 24px;
  overflow: hidden;
}

.name-display { position: absolute; white-space: nowrap; overflow: hidden; text-overflow: clip; font-family: var(--font-display); font-weight: 700; color: var(--text-primary); line-height: 1.05; letter-spacing: 0.5px; transition: left 0.3s ease, top 0.3s ease, width 0.3s ease, font-size 0.3s ease, opacity 0.3s ease; text-shadow: 0 4px 20px rgba(234, 94, 193, 0.15); z-index: 5; }
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
@keyframes final-reveal { 0% { transform: scale(var(--reveal-scale, 1)); opacity: 0; filter: brightness(2); } 100% { transform: scale(1); filter: brightness(1); } }

/* 隐藏的文字测量探针 */
.fit-probe {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 52px;
  letter-spacing: 0.5px;
  top: 0;
  left: 0;
  pointer-events: none;
}

.controls-center { position: absolute; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; z-index: 10; }
.switches { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
.multi-settings { display: flex; align-items: center; gap: 12px; }
.setting-label { font-size: 14px; color: var(--text-secondary); }
.count-control { display: flex; align-items: center; gap: 8px; }
.count-input { width: 60px; text-align: center; }
.count-input :deep(input) { text-align: center; -moz-appearance: textfield; }
.count-input :deep(input)::-webkit-inner-spin-button,
.count-input :deep(input)::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.list-selector-bar { display: flex; align-items: center; gap: 12px; background: var(--bg-card); backdrop-filter: blur(20px); padding: 8px 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-default); box-shadow: var(--shadow-4); width: 100%; justify-content: center; }
.selector-label { font-size: 14px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
.start-btn { min-width: 280px; font-size: 16px; min-height: 48px; margin-top: 8px; }
.btn-dimmed { opacity: 0.45; cursor: not-allowed; }

.toggle-expand-enter-active { animation: toggle-in 0.25s cubic-bezier(0.1, 0.9, 0.2, 1); }
.toggle-expand-leave-active { animation: toggle-in 0.15s ease-in reverse; }
@keyframes toggle-in { from { opacity: 0; transform: translateY(-8px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 40px; } }
</style>
