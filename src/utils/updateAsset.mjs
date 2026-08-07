import { getUpdateAssetSignature } from './desktopRuntime.js'

export function findPlatformAsset(assets, platform = 'tauri-win64') {
  if (!platform || platform === 'web') return null
  const signature = getUpdateAssetSignature(platform)

  const candidates = (assets || []).filter(asset => {
    const name = String(asset?.name || '').toLowerCase()
    const architectureAllowed = name.includes('x64') || name.includes('amd64') || name.includes('win64') || platform === 'tauri-macos'
    const suffixAllowed = signature.suffixes.some(suffix => name.endsWith(suffix))
    return architectureAllowed && suffixAllowed
  })

  const preferred = candidates.find(asset => String(asset?.name || '').toLowerCase().includes(signature.tag))
  return preferred || (candidates.length === 1 ? candidates[0] : null)
}
