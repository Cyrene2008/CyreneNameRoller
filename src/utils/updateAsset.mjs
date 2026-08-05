export function findPlatformAsset(assets, platform = 'tauri-win64') {
  const platformName = platform.startsWith('tauri') ? 'tauri' : ''
  if (!platformName) return null

  const x64Installers = (assets || []).filter(asset => {
    const name = String(asset?.name || '').toLowerCase()
    const isWin64 = name.includes('win64') || name.includes('x64') || name.includes('amd64')
    return name.endsWith('.exe') && isWin64
  })

  return x64Installers.find(asset => String(asset?.name || '').toLowerCase().includes(platformName))
    || (x64Installers.length === 1 ? x64Installers[0] : null)
}
