import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const projectRoot = path.resolve(import.meta.dirname, '..')
const cardViewPath = path.join(projectRoot, 'src/views/CardView.vue')

test('CardView tracks every delayed deal task behind one operation generation', async () => {
  const source = await fs.readFile(cardViewPath, 'utf8')
  assert.match(source, /const pendingOperationTimers = new Set\(\)/)
  assert.match(source, /let operationGeneration = 0/)
  assert.match(source, /function cancelPendingOperations\(\)/)
  assert.match(source, /for \(const timer of pendingOperationTimers\) clearTimeout\(timer\)/)
  assert.match(source, /function scheduleOperation\(generation, callback, delay\)/)

  const rawTimeouts = [...source.matchAll(/setTimeout\s*\(/g)]
  assert.equal(rawTimeouts.length, 1, 'all CardView delays must go through scheduleOperation')
})

test('CardView invalidates nested callbacks and asynchronous animation continuations', async () => {
  const source = await fs.readFile(cardViewPath, 'utf8')
  assert.match(source, /if \(!operationIsActive\(generation\)\) return false[\s\S]*await nextTick\(\)[\s\S]*if \(!operationIsActive\(generation\)\) return false/)
  assert.match(source, /function flipCard\(index, operation = null, generation = operationGeneration\) \{\s*if \(!operationIsActive\(generation\)\) return/)
  assert.match(source, /scheduleOperation\(generation, \(\) => \{[\s\S]*scheduleOperation\(generation, \(\) => flipCard/)
  assert.match(source, /nextTick\(\(\) => \{\s*if \(operationIsActive\(generation\)\) pluginsStore\.startAnimation\('card\.flip'/)
})

test('CardView reset and unmount cancel pending operations before clearing state', async () => {
  const source = await fs.readFile(cardViewPath, 'utf8')
  assert.match(source, /function reset\(\) \{\s*cancelPendingOperations\(\)\s*cards\.value = \[\]/)
  assert.match(source, /onBeforeUnmount\(\(\) => \{\s*unmounted = true\s*stopNamesLoadedWatch\?\.\(\)\s*cancelPendingOperations\(\)/)
  assert.match(source, /Promise\.all\(\[loadCardSettings\(\), loadTrayState\(\)\]\)\.then\(\(\) => \{\s*if \(!unmounted/)
})
