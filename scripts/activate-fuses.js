const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')
const path = require('path')

async function activateFuses() {
  const appPath = path.join(__dirname, '..', 'release-electron', 'win-unpacked', 'CyreneNameRoller.exe')
  
  try {
    await flipFuses(appPath, {
      version: FuseVersion.V1,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false
    })
    console.log('[fuses] ASAR integrity validation enabled successfully')
  } catch (e) {
    console.error('[fuses] Failed to activate fuses:', e.message)
  }
}

activateFuses()
