import { getUpdateAssetSignature } from './desktopRuntime.js'

export function findPlatformAsset(assets, platform = 'win64', version = '') {
  if (!platform || platform === 'web') return null
  const signature = getUpdateAssetSignature(platform)
  const rawVersion = String(version || '').replace(/^v/i, '').trim()

  const candidates = (assets || []).filter(asset => {
    const name = String(asset?.name || '').toLowerCase()
    const architectureAllowed = name.includes('x64') || name.includes('amd64') || name.includes('win64') || platform === 'macos'
    const suffixAllowed = signature.suffixes.some(suffix => name.endsWith(suffix))
    return architectureAllowed && suffixAllowed
  })

  // 命中标志优先，其次要求资产名同时包含新版版本号（重要：防止多版本 release 下选错）
  const versionHit = rawVersion ? candidates.filter(asset => String(asset?.name || '').toLowerCase().includes(rawVersion.toLowerCase())) : candidates
  const preferred = versionHit.find(asset => String(asset?.name || '').toLowerCase().includes(signature.tag))
  if (preferred) return preferred
  if (versionHit.length === 1) return versionHit[0]
  // 二次：仅平台标志匹配（兼容旧命名，无版本号也可选）
  if (candidates.length === 1) return candidates[0]
  return null
}