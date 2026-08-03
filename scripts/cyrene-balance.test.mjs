import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/utils/cyrene-balance.js', import.meta.url), 'utf8')
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const {
  computeCyreneBalanceProbability,
  personKey,
  pickCyreneBatch
} = await import(moduleUrl)

test('fairness statistics use UUIDs for duplicate display names', () => {
  const people = [
    { id: 'person-a', cn: '同名', en: 'A' },
    { id: 'person-b', cn: '同名', en: 'B' },
    { id: 'person-c', cn: '甲' },
    { id: 'person-d', cn: '乙' }
  ]
  const probabilities = computeCyreneBalanceProbability(
    people,
    [],
    { 'person-a': 0, 'person-b': 10, 'person-c': 10, 'person-d': 10 },
    { enabled: true }
  )

  assert.equal(personKey(people[0]), 'person-a')
  assert.deepEqual(Object.keys(probabilities).sort(), people.map(person => person.id).sort())
  assert.ok(probabilities['person-a'] > probabilities['person-b'])
})

test('no-repeat batches keep same-name people independent', () => {
  const people = [
    { id: 'person-a', cn: '同名', en: 'A' },
    { id: 'person-b', cn: '同名', en: 'B' }
  ]
  const picks = pickCyreneBatch(people, [], {}, { enabled: false }, 2, false, () => 0)

  assert.deepEqual(picks.map(person => person.id), ['person-a', 'person-b'])
})
