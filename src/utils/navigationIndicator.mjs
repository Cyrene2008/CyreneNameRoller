export function getIndicatorGeometry(itemRect, containerRect, indicatorHeight = 20, scaleY = 1) {
  const itemTop = (itemRect.top - containerRect.top) / scaleY
  const itemHeight = itemRect.height / scaleY
  const itemCenter = itemTop + itemHeight / 2
  const top = itemCenter - indicatorHeight / 2

  return {
    top,
    height: indicatorHeight,
    center: itemCenter,
    bottom: top + indicatorHeight
  }
}

export function getIndicatorDirection(previous, next) {
  if (!previous || !next || next.center === previous.center) return 'none'
  return next.center > previous.center ? 'down' : 'up'
}

export function getIndicatorTransition(previous, next, indicatorHeight = 20) {
  const direction = getIndicatorDirection(previous, next)
  if (direction === 'none') {
    return {
      direction,
      fromTop: next.top,
      toTop: next.top,
      stretchTop: next.top,
      stretchHeight: indicatorHeight
    }
  }

  const stretchTop = direction === 'down' ? previous.top : next.top
  const stretchBottom = direction === 'down' ? next.bottom : previous.bottom

  return {
    direction,
    fromTop: previous.top,
    toTop: next.top,
    stretchTop,
    stretchHeight: Math.max(indicatorHeight, stretchBottom - stretchTop)
  }
}
