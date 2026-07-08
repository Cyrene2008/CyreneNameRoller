<template>
  <div class="card-view">
    <h1 class="card-title">{{ lang === 'en' ? 'Card Mode' : '翻牌抽名器' }}</h1>

    <div class="card-controls">
      <span class="control-label">{{ lang === 'en' ? 'Cards:' : '牌子数量:' }}</span>
      <FluentInput v-model="cardCount" type="number" :min="2" :max="20" style="width: 70px;" />
      <FluentButton variant="primary" @click="shuffle">{{ lang === 'en' ? 'Shuffle' : '洗牌' }}</FluentButton>
      <FluentButton variant="secondary" @click="reset">{{ lang === 'en' ? 'Reset' : '重置' }}</FluentButton>
    </div>

    <div class="cards-grid">
      <div
        v-for="(card, i) in cards"
        :key="card.id"
        class="card"
        :class="{ show: card.visible, flipped: card.flipped }"
        :style="{ animationDelay: (i * 0.08) + 's' }"
        @click="flipCard(i)"
      >
        <div class="card-inner">
          <div class="card-face card-back">
            <span class="card-question">?</span>
          </div>
          <div class="card-face card-front">
            {{ card.name }}
          </div>
        </div>
      </div>
    </div>

    <div class="tray">
      <div class="tray-label">{{ lang === 'en' ? 'History' : '收牌区域' }}</div>
      <div class="tray-stack">
        <TransitionGroup name="tray-item">
          <div v-for="item in history" :key="item" class="history-chip">
            {{ item }}
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNamesStore } from '../stores/names'
import { useSettingsStore } from '../stores/settings'
import FluentButton from '../components/FluentButton.vue'
import FluentInput from '../components/FluentInput.vue'

const namesStore = useNamesStore()
const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.settings.englishMode ? 'en' : 'zh')

const cardCount = ref(5)
const cards = ref([])
const history = ref([])
const usedNames = ref(new Set())
const flippedCount = ref(0)

let cardIdCounter = 0

function getAvailableNames() {
  const names = namesStore.currentNames
    .map(n => settingsStore.settings.englishMode && n.en ? n.en : n.cn)
    .filter(n => n !== '再来一次' && !usedNames.value.has(n))
  return [...new Set(names)]
}

function shuffle() {
  const available = getAvailableNames()
  const k = Math.min(parseInt(cardCount.value) || 5, available.length)

  if (k < 2) return

  const chosen = []
  const copy = [...available]
  while (chosen.length < k && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length)
    chosen.push(copy.splice(idx, 1)[0])
  }

  cards.value = chosen.map(name => ({
    id: ++cardIdCounter,
    name,
    visible: false,
    flipped: false
  }))

  flippedCount.value = 0

  cards.value.forEach((card, i) => {
    setTimeout(() => { card.visible = true }, i * 80)
  })
}

function flipCard(index) {
  const card = cards.value[index]
  if (!card || card.flipped) return

  card.flipped = true
  flippedCount.value++
  usedNames.value.add(card.name)
  history.value.unshift(card.name)
}

function reset() {
  cards.value = []
  history.value = []
  usedNames.value.clear()
  flippedCount.value = 0
}

onMounted(() => {
  if (namesStore.isLoaded && namesStore.currentNames.length > 0) {
    shuffle()
  }
})
</script>

<style scoped>
.card-view {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
}

.card-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.card-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-4);
  margin-bottom: 32px;
}

.control-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 900px;
  justify-items: center;
  margin-bottom: 40px;
}

.card {
  width: 140px;
  height: 200px;
  perspective: 1500px;
  cursor: pointer;
  opacity: 0;
  transform: translateY(30px);
}

.card.show {
  animation: card-deal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes card-deal {
  to { opacity: 1; transform: translateY(0); }
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card:hover .card-inner {
  transform: translateY(-8px);
}

.card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-default);
  box-shadow: var(--shadow-8);
}

.card-back {
  background: linear-gradient(135deg, var(--bg-card-solid), var(--bg-hover));
}

.card-question {
  font-size: 48px;
  color: var(--accent);
  opacity: 0.3;
  font-weight: 700;
}

.card-front {
  transform: rotateY(180deg);
  background: var(--bg-card-solid);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  color: var(--accent);
  padding: 12px;
  text-align: center;
  border-color: var(--accent);
  text-shadow: 0 0 12px rgba(234, 94, 193, 0.3);
}

.tray {
  width: 100%;
  max-width: 900px;
}

.tray-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.tray-stack {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 48px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
}

.history-chip {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: #fff;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.tray-item-enter-active {
  animation: slide-in 0.3s ease-out;
}

.tray-item-leave-active {
  animation: slide-in 0.2s ease-in reverse;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
