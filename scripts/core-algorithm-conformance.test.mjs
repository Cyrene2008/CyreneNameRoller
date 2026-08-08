import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import { pickCyreneBatch } from '../src/utils/cyrene-balance.js'

const vectors = JSON.parse(await fs.readFile(new URL('./fixtures/core-algorithm-v3.1.1.json', import.meta.url), 'utf8'))

for (const vector of vectors.vectors) {
  test(`CAF shared vector: ${vector.id}`, () => {
    let index = 0
    const picks = pickCyreneBatch(
      vector.names,
      vector.whiteList,
      vector.counts,
      vector.settings,
      vector.drawCount,
      vector.allowDuplicates,
      () => vector.random[Math.min(index++, vector.random.length - 1)]
    )
    assert.deepEqual(picks.map(pick => pick.id), vector.expectedIds)
  })
}
