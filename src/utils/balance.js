const DEFAULT_BALANCE_SETTINGS = {
  enabled: true,
  factor: 13.3,
  maxThreshold: 3,
  maxBoostPercent: 1200,
  points: [
    { x: 0.3, y: 150 },
    { x: 1.5, y: 420 },
    { x: 2.4, y: 800 }
  ]
}

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_BALANCE_SETTINGS))
}

function normalizeSettings(raw) {
  const s = cloneDefault()
  if (!raw || typeof raw !== 'object') return s
  s.enabled = raw.enabled !== false

  const factor = parseFloat(raw.factor)
  if (Number.isFinite(factor) && factor > 0) s.factor = factor

  const maxThreshold = parseFloat(raw.maxThreshold)
  if (Number.isFinite(maxThreshold) && maxThreshold >= 0) s.maxThreshold = maxThreshold

  const maxBoostPercent = parseFloat(raw.maxBoostPercent)
  if (Number.isFinite(maxBoostPercent) && maxBoostPercent >= 200) s.maxBoostPercent = maxBoostPercent

  if (Array.isArray(raw.points)) {
    const pts = raw.points.slice(0, 3).map(p => ({
      x: Number.isFinite(parseFloat(p.x)) ? Math.max(0, parseFloat(p.x)) : 0,
      y: Number.isFinite(parseFloat(p.y)) ? Math.max(100, parseFloat(p.y)) : 100
    }))
    while (pts.length < 3) pts.push({ x: 0, y: 100 })
    s.points = pts
  }
  s.points.sort((a, b) => a.x - b.x)
  if (s.points[0].y < 100) s.points[0].y = 100
  if (s.points[1].y < 100) s.points[1].y = 100
  if (s.points[2].y < 100) s.points[2].y = 100
  return s
}

function interpolateQuadratic(points, x) {
  const pts = points.slice().sort((a, b) => a.x - b.x)
  const [p1, p2, p3] = pts
  if (!p1 || !p2 || !p3) return NaN
  const x1 = p1.x, y1 = p1.y
  const x2 = p2.x, y2 = p2.y
  const x3 = p3.x, y3 = p3.y
  const d1 = (x1 - x2) * (x1 - x3)
  const d2 = (x2 - x1) * (x2 - x3)
  const d3 = (x3 - x1) * (x3 - x2)
  if (d1 === 0 || d2 === 0 || d3 === 0) return NaN
  const l1 = ((x - x2) * (x - x3)) / d1
  const l2 = ((x - x1) * (x - x3)) / d2
  const l3 = ((x - x1) * (x - x2)) / d3
  const raw = y1 * l1 + y2 * l2 + y3 * l3
  return raw
}

function computeBoostPercent(deficit, candidateCount, settings) {
  if (!settings.enabled) return 100

  const factor = Number(settings.factor) > 0 ? Number(settings.factor) : 1
  const theoreticalThreshold = candidateCount > 0 ? (candidateCount / factor) : 1
  const maxThreshold = Math.max(0, Number(settings.maxThreshold) || 0)
  const maxBoostPercent = Math.max(200, Number(settings.maxBoostPercent) || 200)
  const d = Math.max(0, Number(deficit) || 0)

  if (maxThreshold > 0 && d >= maxThreshold) {
    return maxBoostPercent
  }

  const normSettings = normalizeSettings(settings)
  const points = normSettings.points.map(p => ({
    x: p.x / Math.max(theoreticalThreshold, 1e-6),
    y: p.y
  }))
  const normalizedX = d / Math.max(theoreticalThreshold, 1e-6)
  let boostedPercent = interpolateQuadratic(points, normalizedX)

  if (!Number.isFinite(boostedPercent)) {
    const sorted = points.slice().sort((a, b) => a.x - b.x)
    if (normalizedX <= sorted[0].x) boostedPercent = sorted[0].y
    else if (normalizedX >= sorted[2].x) boostedPercent = sorted[2].y
    else boostedPercent = 100
  }

  if (boostedPercent < 100) boostedPercent = 100
  if (boostedPercent > maxBoostPercent) boostedPercent = maxBoostPercent
  return boostedPercent
}

export function computeBalancedProbability(names, whiteList, countsMap, settings) {
  const wlSet = new Set(whiteList || [])
  const isWL = (cn) => wlSet.has(cn)
  const available = names
  const validList = available.filter(n => !isWL(n.cn))
  const calcList = validList.length > 0 ? validList : available

  let sum = 0
  calcList.forEach(n => { sum += countsMap[n.cn] || 0 })
  const avgCount = calcList.length > 0 ? sum / calcList.length : 0
  const candidateCount = calcList.length

  const probMap = {}
  const choices = []
  const weights = []

  for (const name of available) {
    if (isWL(name.cn)) {
      choices.push(name)
      weights.push(1)
      continue
    }
    const observedCount = countsMap[name.cn] || 0
    const deficit = Math.max(0, avgCount - observedCount)
    const boostPercent = computeBoostPercent(deficit, candidateCount, settings)
    const boostMultiplier = boostPercent / 100
    const baseWeight = 1 / (observedCount + 1)
    const weight = Math.max(1e-6, baseWeight * boostMultiplier)
    choices.push(name)
    weights.push(weight)
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1
  for (let i = 0; i < choices.length; i++) {
    probMap[choices[i].cn] = (weights[i] / totalWeight) * 100
  }

  return probMap
}

export function weightedRandomChoice(choices, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) {
    return choices[Math.floor(Math.random() * choices.length)]
  }
  let r = Math.random() * total
  for (let i = 0; i < choices.length; i++) {
    r -= weights[i]
    if (r <= 0) return choices[i]
  }
  return choices[choices.length - 1]
}

export function pickUniform(names, excludeList = [], allowDuplicates = true) {
  let available = names
  if (!allowDuplicates && excludeList.length > 0) {
    available = available.filter(n => !excludeList.includes(n.cn))
  }
  if (available.length === 0) {
    return { cn: '(没人选了!)', en: '(No one left!)' }
  }
  const n = available[Math.floor(Math.random() * available.length)]
  return { cn: n.cn, en: n.en, index: names.indexOf(n), isWhiteList: n.isWhiteList }
}

export function pickBalanced(names, whiteList, countsMap, settings, excludeList = [], allowDuplicates = true) {
  const wlSet = new Set(whiteList || [])
  const isWL = (cn) => wlSet.has(cn)
  let available = names
  if (!allowDuplicates && excludeList.length > 0) {
    available = available.filter(n => !excludeList.includes(n.cn))
  }

  if (available.length === 0) {
    return { cn: '(没人选了!)', en: '(No one left!)' }
  }

  const validList = available.filter(n => !isWL(n.cn))
  const calcList = validList.length > 0 ? validList : available

  let sum = 0
  calcList.forEach(n => {
    sum += countsMap[n.cn] || 0
  })
  const avgCount = calcList.length > 0 ? sum / calcList.length : 0
  const candidateCount = calcList.length

  const namesArr = available.map((n, i) => ({ cn: n.cn, en: n.en, index: i, isWhiteList: n.isWhiteList }))
  const choices = []
  const weights = []

  for (let i = 0; i < available.length; i++) {
    const name = available[i]
    if (isWL(name.cn)) {
      choices.push(namesArr[i])
      weights.push(1)
      continue
    }

    const observedCount = countsMap[name.cn] || 0
    const deficit = Math.max(0, avgCount - observedCount)
    const boostPercent = computeBoostPercent(deficit, candidateCount, settings)
    const boostMultiplier = boostPercent / 100
    const baseWeight = 1 / (observedCount + 1)
    const weight = Math.max(1e-6, baseWeight * boostMultiplier)

    choices.push(namesArr[i])
    weights.push(weight)
  }

  return weightedRandomChoice(choices, weights)
}

export { DEFAULT_BALANCE_SETTINGS, normalizeSettings, interpolateQuadratic }
