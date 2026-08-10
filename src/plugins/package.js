import JSZip from 'jszip'
import {
  CNRP_MAGIC,
  CONTRIBUTION_ID_PATTERN,
  ID_PATTERN,
  MAX_FILE_COUNT,
  MAX_PLUGIN_ANIMATION_ACTIVE_MS,
  MAX_PLUGIN_SIZE,
  PLUGIN_API_VERSION,
  PLUGIN_PERMISSIONS,
  SETTING_PATH_PATTERN,
  comparePluginVersions,
  normalizeAnimationPack,
  normalizeAnimationPacks,
  normalizeAppearanceColor,
  normalizeAppearancePacks,
  normalizeAppearanceShadow,
  normalizeCapabilities,
  normalizeCommands,
  normalizeDependencies,
  normalizePages,
  normalizePlatformEntries,
  normalizePlatforms,
  normalizeSystemOperations,
  normalizeVisualSurfaces,
  opaqueRgb,
  contrastRatio,
  satisfiesPluginVersion,
  validatePath
} from '../../packages/cyrene-core/src/plugin-contract.js'
import { normalizeComponentStylePacks } from './ui/stylePolicy'
import { normalizeFonts, validateFontFiles } from './ui/fontRegistry'
import { normalizeComponentOverridePacks } from './ui/overridePolicy'
import { normalizeNativeViews, normalizeNativeViewDocument } from './ui/nativeViewPolicy'
import { normalizeResultPresentations } from './ui/resultPresentationPolicy'

export {
  CNRP_MAGIC,
  MAX_PLUGIN_ANIMATION_ACTIVE_MS,
  comparePluginVersions,
  normalizeAnimationPack,
  normalizeAppearanceColor,
  normalizeAppearanceShadow,
  opaqueRgb,
  contrastRatio,
  satisfiesPluginVersion
}

export function normalizePluginManifest(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('manifest.json 无效')
  const manifest = JSON.parse(JSON.stringify(raw))
  if (manifest.schemaVersion !== 1) throw new Error('不支持的插件清单版本')
  if (!ID_PATTERN.test(manifest.id || '')) throw new Error('插件 ID 无效，建议使用反向域名格式')
  if (!manifest.name || !manifest.version || !manifest.author) throw new Error('插件名称、版本或开发者缺失')
  if (!manifest.engine || comparePluginVersions(PLUGIN_API_VERSION, manifest.engine.min || '0') < 0) {
    throw new Error(`插件需要 API ${manifest.engine?.min || '未知'}，当前为 ${PLUGIN_API_VERSION}`)
  }
  manifest.permissions = [...new Set(manifest.permissions || [])]
  const unknownPermission = manifest.permissions.find(permission => !PLUGIN_PERMISSIONS.has(permission))
  if (unknownPermission) throw new Error(`未知插件权限：${unknownPermission}`)
  manifest.contributes = manifest.contributes && typeof manifest.contributes === 'object' ? manifest.contributes : {}
  manifest.contributes.pages = normalizePages(manifest.contributes.pages)
  manifest.contributes.commands = normalizeCommands(manifest.contributes.commands)
  manifest.contributes.animationPacks = normalizeAnimationPacks(manifest.contributes.animationPacks, manifest.permissions)
  manifest.contributes.visualSurfaces = normalizeVisualSurfaces(manifest.contributes.visualSurfaces, manifest.permissions)
  manifest.contributes.appearancePacks = normalizeAppearancePacks(manifest.contributes.appearancePacks, manifest.permissions)
  manifest.contributes.componentStylePacks = normalizeComponentStylePacks(manifest.contributes.componentStylePacks, manifest.permissions, { pluginId: manifest.id })
  manifest.contributes.fonts = normalizeFonts(manifest.contributes.fonts, manifest.permissions, { pluginId: manifest.id })
  manifest.contributes.componentOverridePacks = normalizeComponentOverridePacks(manifest.contributes.componentOverridePacks, manifest.permissions)
  manifest.contributes.nativeViews = normalizeNativeViews(manifest.contributes.nativeViews, manifest.permissions)
  manifest.contributes.resultPresentations = normalizeResultPresentations(manifest.contributes.resultPresentations, manifest.permissions)
  manifest.supportedPlatforms = normalizePlatforms(manifest.supportedPlatforms, 'supportedPlatforms')
  manifest.platformEntries = normalizePlatformEntries(manifest.platformEntries, 'platformEntries')
  manifest.capabilities = normalizeCapabilities(manifest.capabilities, manifest.permissions)
  manifest.systemOperations = normalizeSystemOperations(manifest.systemOperations, manifest.permissions)
  manifest.dependencies = normalizeDependencies(manifest.dependencies, manifest.id)
  if (manifest.entry) manifest.entry = validatePath(manifest.entry)
  if (manifest.contributes.commands.length && !manifest.entry && !Object.keys(manifest.platformEntries).length) {
    throw new Error('commands 需要插件 Worker 入口')
  }
  if (!manifest.entry && !Object.keys(manifest.platformEntries).length && !(manifest.contributes.pages || []).length && !manifest.contributes.commands.length && !manifest.contributes.visualSurfaces.length && !manifest.contributes.appearancePacks.length && !manifest.contributes.componentStylePacks.length && !manifest.contributes.componentOverridePacks.length && !manifest.contributes.nativeViews.length && !manifest.contributes.resultPresentations.length && !manifest.contributes.fonts.length) {
    throw new Error('插件至少需要一个 Worker、页面、视觉层或外观包入口')
  }
  if (manifest.icon) manifest.icon = validatePath(manifest.icon)
  if (manifest.readme) manifest.readme = validatePath(manifest.readme)
  return manifest
}

export async function sha256Hex(bytes) {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0))
}

async function verifyPublisherSignature(envelope, expectedPublisherKey = '') {
  if (!envelope.signature) {
    if (expectedPublisherKey) throw new Error('插件目录要求发布者签名，但插件包未签名')
    return { verified: false, publisherKey: '' }
  }
  if (envelope.signatureAlgorithm !== 'Ed25519' || !envelope.publisherKey) {
    throw new Error('插件发布者签名格式无效')
  }
  if (expectedPublisherKey && envelope.publisherKey !== expectedPublisherKey) {
    throw new Error('插件发布者公钥与目录登记不一致')
  }
  let key
  try {
    key = await crypto.subtle.importKey('spki', fromBase64(envelope.publisherKey), { name: 'Ed25519' }, false, ['verify'])
  } catch {
    throw new Error('插件发布者公钥无效')
  }
  const signed = new TextEncoder().encode(`${envelope.id}\0${envelope.version}\0${envelope.hash}`)
  const valid = await crypto.subtle.verify('Ed25519', key, fromBase64(envelope.signature), signed)
  if (!valid) throw new Error('插件发布者签名验证失败，文件可能已被替换')
  return { verified: true, publisherKey: envelope.publisherKey }
}

async function decryptCnrp(bytes) {
  const header = new TextDecoder().decode(bytes.subarray(0, CNRP_MAGIC.length))
  if (header !== CNRP_MAGIC) throw new Error('不是有效的 .cnrp 插件包')
  let envelope
  try {
    envelope = JSON.parse(new TextDecoder().decode(bytes.subarray(CNRP_MAGIC.length)))
  } catch {
    throw new Error('CNRP 封装数据无效')
  }
  if (envelope.v !== 1 || !envelope.id || !envelope.version || !envelope.salt || !envelope.iv || !envelope.data || !envelope.hash) {
    throw new Error('CNRP 加密封装无效')
  }
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${envelope.id}@${envelope.version}:CyreneNameRollerPlugin-v1`),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(envelope.salt), iterations: 120000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  const additionalData = new TextEncoder().encode(`${envelope.id}\0${envelope.version}\0${envelope.hash}`)
  let decrypted
  try {
    decrypted = new Uint8Array(await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv), additionalData },
      key,
      fromBase64(envelope.data)
    ))
  } catch {
    throw new Error('插件包解密或认证失败，文件可能已被篡改')
  }
  if (await sha256Hex(decrypted) !== envelope.hash) throw new Error('插件包整体哈希不匹配')
  return { bytes: decrypted, envelope }
}

export async function parsePluginPackage(input, { expectedPublisherKey = '' } = {}) {
  const packageBytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  if (packageBytes.byteLength > MAX_PLUGIN_SIZE) throw new Error('插件包超过 32 MB 限制')
  const { bytes, envelope } = await decryptCnrp(packageBytes)
  const publisher = await verifyPublisherSignature(envelope, expectedPublisherKey)
  const archive = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false })
  const fileNames = Object.keys(archive.files).filter(name => !archive.files[name].dir)
  if (fileNames.length > MAX_FILE_COUNT) throw new Error('插件包文件数量过多')
  fileNames.forEach(validatePath)
  const manifestEntry = archive.file('manifest.json')
  if (!manifestEntry) throw new Error('插件包缺少 manifest.json')
  const manifest = normalizePluginManifest(JSON.parse(await manifestEntry.async('string')))
  if (manifest.id !== envelope.id || manifest.version !== envelope.version) {
    throw new Error('插件清单与 CNRP 封装身份不一致')
  }
  const files = {}
  let totalUncompressedSize = 0
  for (const name of fileNames) {
    const content = await archive.file(name).async('uint8array')
    totalUncompressedSize += content.byteLength
    if (totalUncompressedSize > 64 * 1024 * 1024) throw new Error('插件解压内容超过 64 MB 限制')
    let binary = ''
    for (let index = 0; index < content.length; index += 0x8000) binary += String.fromCharCode(...content.subarray(index, index + 0x8000))
    files[name] = btoa(binary)
  }

  const requiredFiles = [
    manifest.entry,
    ...Object.values(manifest.platformEntries || {}),
    manifest.icon,
    manifest.readme,
    ...(manifest.contributes.pages || []).flatMap(page => [page.entry, ...Object.values(page.platformEntries || {})]),
    ...(manifest.contributes.animationPacks || []).map(pack => pack.source),
    ...(manifest.contributes.fonts || []).map(font => font.source),
    ...(manifest.contributes.nativeViews || []).map(view => view.source),
    ...(manifest.contributes.visualSurfaces || []).flatMap(surface => [surface.entry, ...Object.values(surface.platformEntries || {})])
  ].filter(Boolean)
  for (const name of requiredFiles) if (!files[name]) throw new Error(`插件清单引用的文件不存在：${name}`)
  validateFontFiles(manifest.contributes.fonts || [], files)
  const integrity = manifest.integrity || {}
  for (const name of fileNames) {
    if (name !== 'manifest.json' && !Object.hasOwn(integrity, name)) throw new Error(`完整性清单未覆盖文件：${name}`)
  }
  const nativeViews = (manifest.contributes.nativeViews || []).map(declaration => {
    try {
      return { ...declaration, document: normalizeNativeViewDocument(JSON.parse(decodePluginFile({ files }, declaration.source)), `nativeView ${declaration.id}`) }
    } catch (error) {
      if (error?.code) throw error
      throw new Error(`原生视图 ${declaration.id} 无法解析：${error.message || error}`)
    }
  })
  for (const [name, expected] of Object.entries(integrity)) {
    const encoded = files[validatePath(name)]
    if (!encoded) throw new Error(`完整性清单文件缺失：${name}`)
    const actual = await sha256Hex(Uint8Array.from(atob(encoded), character => character.charCodeAt(0)))
    if (actual !== String(expected).toLowerCase()) throw new Error(`插件文件完整性校验失败：${name}`)
  }
  const packageHash = await sha256Hex(packageBytes)
  const animationPacks = (manifest.contributes.animationPacks || []).map(declaration => {
    let raw
    try {
      raw = JSON.parse(decodePluginFile({ files }, declaration.source))
    } catch (error) {
      throw new Error(`动画包 ${declaration.id} 无法解析：${error.message || error}`)
    }
    return normalizeAnimationPack(raw, declaration)
  })
  return {
    manifest,
    files,
    animationPacks,
    nativeViews,
    packageHash,
    packageSignature: envelope.signature || '',
    publisherKey: publisher.publisherKey,
    publisherVerified: publisher.verified,
    signatureAlgorithm: envelope.signatureAlgorithm || '',
    readme: archive.file(manifest.readme || 'README.md') ? await archive.file(manifest.readme || 'README.md').async('string') : ''
  }
}

export function decodePluginFile(plugin, path, binary = false) {
  const encoded = plugin?.files?.[validatePath(path)]
  if (!encoded) throw new Error(`插件文件不存在：${path}`)
  const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
  return binary ? bytes : new TextDecoder().decode(bytes)
}
