import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

async function findBundleAssets(platform) {
  const bundleRoot = platform === 'linux'
    ? path.join(root, 'target', 'x86_64-unknown-linux-gnu', 'release', 'bundle')
    : path.join(root, 'target', 'release', 'bundle')
  const outputs = []
  try {
    const dirs = await fs.readdir(bundleRoot)
    for (const dir of dirs) {
      const fullDir = path.join(bundleRoot, dir)
      const stat = await fs.stat(fullDir)
      if (!stat.isDirectory()) continue
      const entries = await fs.readdir(fullDir)
      for (const entry of entries) {
        const lower = entry.toLowerCase()
        if (lower.endsWith('.exe') || lower.endsWith('.deb') || lower.endsWith('.appimage') || lower.endsWith('.msi')) {
          outputs.push({ dir, file: entry, full: path.join(fullDir, entry) })
        }
      }
    }
  } catch {
    return outputs
  }
  return outputs
}

function targetName(asset, version) {
  const lower = asset.file.toLowerCase()
  if (lower.endsWith('.msi')) return `CyreneNameRoller_${version}_x64.msi`
  if (lower.endsWith('.exe')) return `CyreneNameRoller_${version}_win64_setup.exe`
  if (lower.endsWith('.deb')) return `CyreneNameRoller_${version}_amd64_setup.deb`
  if (lower.endsWith('.appimage')) return `CyreneNameRoller_${version}_x86_64.AppImage`
  if (lower.endsWith('.dmg')) return `CyreneNameRoller_${version}_macos.dmg`
  return ''
}

async function main() {
  const config = await JSON.parse(await fs.readFile(path.join(root, 'src-tauri', 'tauri.conf.json'), 'utf8'))
  const version = config.version || '0.0.0'

  const argv = process.argv.slice(2)
  let platform = process.platform
  for (const flag of argv) {
    if (flag === '--on-linux' || flag === '--platform=linux') platform = 'linux'
    if (flag === '--platform=windows' || flag === '--platform=win32') platform = 'win32'
  }

  const buildArgs = ['build']
  if (platform === 'linux') {
    buildArgs.push('--config', path.join('src-tauri', 'tauri.linux.conf.json'))
    buildArgs.push('--target', 'x86_64-unknown-linux-gnu')
  }
  console.log(`[package-dist] platform=${platform} version=${version}`)
  console.log(`[package-dist] running: tauri ${buildArgs.join(' ')}`)
  await fs.rm(platform === 'linux'
    ? path.join(root, 'target', 'x86_64-unknown-linux-gnu', 'release', 'bundle')
    : path.join(root, 'target', 'release', 'bundle'), { recursive: true, force: true })

  const tauriBin = path.join(root, 'node_modules', '.bin', 'tauri' + (platform === 'win32' ? '.cmd' : ''))
  const run = spawnSync(tauriBin, buildArgs, { cwd: root, stdio: 'inherit', shell: platform === 'win32' })
  if (run.status !== 0) {
    console.error('[package-dist] tauri build failed')
    process.exit(run.status ?? 1)
  }

  const assets = await findBundleAssets(platform)  
  if (!assets.length) {
    console.error(`[package-dist] 未找到 Tauri 产物（${platform === 'linux' ? 'target/x86_64-unknown-linux-gnu/release/bundle' : 'target/release/bundle'} 下无 exe/deb/appimage）`)
    process.exit(1)
  }

  const outDir = path.join(root, 'dist-release')
  await fs.mkdir(outDir, { recursive: true })

  for (const asset of assets) {
    const name = targetName(asset, version)
    if (!name) {
      console.log(`[package-dist] 跳过（不属分发产物）: ${asset.file}`)
      continue
    }
    const dest = path.join(outDir, name)
    await fs.copyFile(asset.full, dest)
    console.log(`[package-dist] ${path.relative(root, asset.full)} -> ${path.relative(root, dest)}`)
  }
  console.log('[package-dist] done')
}

main().catch(error => {
  console.error('[package-dist]', error)
  process.exit(1)
})