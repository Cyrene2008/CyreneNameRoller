const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const forbiddenName = ['electron'].join('')
const scannedPaths = [
  'index.html',
  'package.json',
  'package-lock.json',
  'README.md',
  'README_EN.md',
  'src'
]

function collectFiles(target) {
  const absolute = path.join(root, target)
  if (!fs.existsSync(absolute)) return []
  const stat = fs.statSync(absolute)
  if (stat.isFile()) return [absolute]
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(target, entry.name)
    return entry.isDirectory() ? collectFiles(relative) : [path.join(root, relative)]
  })
}

test('current project support excludes the removed desktop runtime', () => {
  assert.equal(fs.existsSync(path.join(root, forbiddenName)), false, `${forbiddenName}/ still exists`)
  assert.equal(fs.existsSync(path.join(root, 'scripts', 'activate-fuses.js')), false, 'obsolete fuse script still exists')

  const matches = scannedPaths
    .flatMap(collectFiles)
    .filter(file => fs.statSync(file).isFile())
    .flatMap(file => {
      const content = fs.readFileSync(file, 'utf8')
      return content.toLowerCase().includes(forbiddenName)
        ? [path.relative(root, file)]
        : []
    })

  assert.deepEqual(matches, [], `removed runtime references remain:\n${matches.join('\n')}`)
})
