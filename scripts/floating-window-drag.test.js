const test = require('node:test')
const assert = require('node:assert/strict')

const dragModule = import('../src/utils/floatingWindowDrag.mjs')

test('touch movement maps to the full physical window distance', async () => {
  const { floatingWindowDragPosition } = await dragModule

  assert.deepEqual(
    floatingWindowDragPosition(
      { x: 100, y: 200 },
      { x: 25, y: 12 },
      { x: 20, y: 16 },
      2
    ),
    { x: 110, y: 192 }
  )
})

test('window position stays stable after catching up with the touch point', async () => {
  const { floatingWindowDragPosition } = await dragModule

  assert.deepEqual(
    floatingWindowDragPosition(
      { x: 110, y: 192 },
      { x: 20, y: 16 },
      { x: 20, y: 16 },
      2
    ),
    { x: 110, y: 192 }
  )
})
