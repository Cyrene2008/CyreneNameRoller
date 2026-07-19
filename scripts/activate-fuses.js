const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')
const path = require('path')

module.exports = async function activateFuses(context) {
  if (context.electronPlatformName !== 'win32') return

  const executableName = `${context.packager.appInfo.productFilename}.exe`
  const appPath = path.join(context.appOutDir, executableName)
  await flipFuses(appPath, {
    version: FuseVersion.V1,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false
  })
  console.log(`[fuses] Security fuses enabled for ${executableName}`)
}
