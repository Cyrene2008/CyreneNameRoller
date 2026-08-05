export function floatingWindowDragPosition(windowPosition, pointerPosition, anchorPosition, scaleFactor) {
  return {
    x: Math.round(windowPosition.x + (pointerPosition.x - anchorPosition.x) * scaleFactor),
    y: Math.round(windowPosition.y + (pointerPosition.y - anchorPosition.y) * scaleFactor)
  }
}
