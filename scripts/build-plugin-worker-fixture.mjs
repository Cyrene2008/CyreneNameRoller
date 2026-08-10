import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outFile = path.join(root, 'scripts', 'fixtures', 'sound-effects-worker.bundle.js')

const result = await build({
  entryPoints: [path.join(root, 'plugin-dev/sound-effects/src/worker.js')],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  alias: {
    '@cyrene2008/cyrene-name-roller/plugin-sdk': path.join(root, 'packages/cyrene-name-roller/src/plugin-sdk.mjs')
  },
  banner: { js: '// 由 scripts/build-plugin-worker-fixture.mjs 生成，请勿手改。' }
})

fs.writeFileSync(outFile, result.outputFiles[0].text)
console.log('worker fixture written:', outFile)
