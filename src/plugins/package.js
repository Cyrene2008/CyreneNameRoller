import JSZip from 'jszip'
import {
  PLUGIN_API_VERSION,
  PLUGIN_PERMISSIONS,
  PLUGIN_PLATFORM_CAPABILITIES,
  PLUGIN_PLATFORM_IDS
} from './constants'

const MAX_PLUGIN_SIZE = 32 * 1024 * 1024
const MAX_FILE_COUNT = 256
const ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/
export const CNRP_MAGIC = 'CNRP1\n'

export function comparePluginVersions(left, right) {
  const a = String(left || '0').split('.').map(value => Number(value) || 0)
  const b = String(right || '0').split('.').map(value => Number(value) || 0)
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] || 0) - (b[index] || 0)
    if (difference) return Math.sign(difference)
  }
  return 0
}


export function satisfiesPluginVersion(version, range = '*') {
  const wanted = String(range || '*').trim()
  if (!wanted || wanted === '*') return true
  if (wanted.startsWith('^')) {
    const base = wanted.slice(1)
    const major = Number(base.split('.')[0]) || 0
    return comparePluginVersions(version, base) >= 0 && Number(String(version).split('.')[0]) === major
  }
  if (wanted.startsWith('~')) {
    const base = wanted.slice(1)
    const [major = 0, minor = 0] = base.split('.').map(Number)
    const [actualMajor = 0, actualMinor = 0] = String(version).split('.').map(Number)
    return comparePluginVersions(version, base) >= 0 && actualMajor === major && actualMinor === minor
  }
  if (wanted.startsWith('>=')) return comparePluginVersions(version, wanted.slice(2).trim()) >= 0
  if (wanted.startsWith('>')) return comparePluginVersions(version, wanted.slice(1).trim()) > 0
  if (wanted.startsWith('<=')) return comparePluginVersions(version, wanted.slice(2).trim()) <= 0
  if (wanted.startsWith('<')) return comparePluginVersions(version, wanted.slice(1).trim()) < 0
  return comparePluginVersions(version, wanted) === 0
}

function validatePath(path) {
  const normalized = String(path || '').replace(/\\/g, '/')
  if (!normalized || normalized.includes('\0') || normalized.startsWith('/') || normalized.includes('../') || normalized.includes('/..')) {
    throw new Error(`插件包含不安全路径：${path}`)
  }
  return normalized
}

function normalizePlatforms(value, label) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error(`${label}必须是平台数组`)
  const platforms = [...new Set(value.map(item => String(item).toLowerCase()))]
  const unknown = platforms.find(item => !PLUGIN_PLATFORM_IDS.has(item))
  if (unknown) throw new Error(`${label}包含未知平台：${unknown}`)
  return platforms
}

function normalizePlatformEntries(value, label) {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}无效`)
  const result = {}
  for (const [platform, path] of Object.entries(value)) {
    if (!PLUGIN_PLATFORM_IDS.has(platform)) throw new Error(`${label}包含未知平台：${platform}`)
    result[platform] = validatePath(path)
  }
  return result
}

function normalizeCapabilities(value, permissions) {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('capabilities 必须是对象')
  const result = {}
  for (const [id, raw] of Object.entries(value)) {
    if (!PLUGIN_PLATFORM_CAPABILITIES.has(id)) throw new Error(`未知平台能力：${id}`)
    const declaration = raw === true ? { required: true } : raw === false ? { required: false } : raw
    if (!declaration || typeof declaration !== 'object' || Array.isArray(declaration)) throw new Error(`平台能力声明无效：${id}`)
    if (!permissions.includes(id)) throw new Error(`平台能力 ${id} 必须同时加入 permissions`)
    result[id] = {
      required: !!declaration.required,
      platforms: normalizePlatforms(declaration.platforms, `${id}.platforms`)
    }
  }
  const undeclared = permissions.find(permission => permission.startsWith('system:') && !result[permission])
  if (undeclared) throw new Error(`系统权限 ${undeclared} 必须在 capabilities 中声明是否为必需能力`)
  return result
}

function normalizeSystemOperations(value, permissions) {
  if (value === undefined || (Array.isArray(value) && value.length === 0)) return []
  if (!permissions.includes('system:execute')) throw new Error('systemOperations 需要 system:execute 权限')
  if (!Array.isArray(value)) throw new Error('systemOperations 必须是数组')
  const ids = new Set()
  return value.map(operation => {
    if (!operation || typeof operation !== 'object' || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(operation.id || '') || ids.has(operation.id)) {
      throw new Error(`系统操作 ID 无效或重复：${operation?.id || '未知'}`)
    }
    ids.add(operation.id)
    if (!operation.label || String(operation.label).length > 100) throw new Error(`系统操作 ${operation.id} 缺少简短说明`)
    const platforms = normalizePlatforms(operation.platforms, `${operation.id}.platforms`)
    if (!platforms.length || platforms.includes('web')) throw new Error(`系统操作 ${operation.id} 必须声明非 Web 平台`)
    const command = operation.command
    if (!command || typeof command !== 'object') throw new Error(`系统操作 ${operation.id} 缺少固定命令`)
    const program = String(command.program || '')
    if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(program)) throw new Error(`系统操作 ${operation.id} 的程序名无效`)
    const args = Array.isArray(command.args) ? command.args.map(String) : []
    if (args.length > 32 || args.some(argument => argument.includes('\0') || argument.length > 2048)) {
      throw new Error(`系统操作 ${operation.id} 的固定参数无效`)
    }
    return {
      id: operation.id,
      label: String(operation.label),
      platforms,
      command: { program, args },
      timeoutMs: Math.max(1000, Math.min(30000, Number(operation.timeoutMs) || 10000))
    }
  })
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
  if (manifest.engine.max && comparePluginVersions(PLUGIN_API_VERSION, manifest.engine.max) > 0) {
    throw new Error(`插件仅支持 API ${manifest.engine.max} 及以下`)
  }
  manifest.permissions = [...new Set(manifest.permissions || [])]
  const unknownPermission = manifest.permissions.find(permission => !PLUGIN_PERMISSIONS.has(permission))
  if (unknownPermission) throw new Error(`未知插件权限：${unknownPermission}`)
  manifest.contributes = manifest.contributes && typeof manifest.contributes === 'object' ? manifest.contributes : {}
  manifest.supportedPlatforms = normalizePlatforms(manifest.supportedPlatforms, 'supportedPlatforms')
  manifest.platformEntries = normalizePlatformEntries(manifest.platformEntries, 'platformEntries')
  manifest.capabilities = normalizeCapabilities(manifest.capabilities, manifest.permissions)
  manifest.systemOperations = normalizeSystemOperations(manifest.systemOperations, manifest.permissions)
  manifest.dependencies = Array.isArray(manifest.dependencies) ? manifest.dependencies : []
  for (const dependency of manifest.dependencies) {
    if (!dependency || !ID_PATTERN.test(dependency.id || '') || dependency.id === manifest.id) {
      throw new Error(`插件依赖声明无效：${dependency?.id || '未知'}`)
    }
  }
  if (manifest.entry) manifest.entry = validatePath(manifest.entry)
  if (!manifest.entry && !Object.keys(manifest.platformEntries).length && !(manifest.contributes.pages || []).length) {
    throw new Error('插件至少需要一个 Worker 或页面入口')
  }
  for (const page of manifest.contributes.pages || []) {
    if (!page.id || !page.title || (!page.entry && !page.platformEntries)) throw new Error('插件页面声明不完整')
    if (page.entry) page.entry = validatePath(page.entry)
    page.platformEntries = normalizePlatformEntries(page.platformEntries, `页面 ${page.id}.platformEntries`)
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
    ...(manifest.contributes.pages || []).flatMap(page => [page.entry, ...Object.values(page.platformEntries || {})])
  ].filter(Boolean)
  for (const name of requiredFiles) if (!files[name]) throw new Error(`插件清单引用的文件不存在：${name}`)

  const integrity = manifest.integrity || {}
  for (const name of fileNames) {
    if (name !== 'manifest.json' && !Object.hasOwn(integrity, name)) throw new Error(`完整性清单未覆盖文件：${name}`)
  }
  for (const [name, expected] of Object.entries(integrity)) {
    const encoded = files[validatePath(name)]
    if (!encoded) throw new Error(`完整性清单文件缺失：${name}`)
    const actual = await sha256Hex(Uint8Array.from(atob(encoded), character => character.charCodeAt(0)))
    if (actual !== String(expected).toLowerCase()) throw new Error(`插件文件完整性校验失败：${name}`)
  }
  const packageHash = await sha256Hex(packageBytes)
  return {
    manifest,
    files,
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
