import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'src-csharp', 'Cyrene.Host', 'Assets')
mkdirSync(outDir, { recursive: true })

await build({
  entryPoints: [path.join(root, 'packages/cyrene-core/src/index.js')],
  bundle: true,
  format: 'iife',
  globalName: 'CyreneCore',
  outfile: path.join(outDir, 'cyrene-core-bundle.js'),
  platform: 'browser',
  target: ['es2020'],
  legalComments: 'none',
  banner: { js: '// 由 scripts/build-core-bundle.mjs 生成，请勿手改。' }
})

console.log('core bundle written:', path.join(outDir, 'cyrene-core-bundle.js'))
