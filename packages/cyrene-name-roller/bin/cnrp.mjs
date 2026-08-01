#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'
import { build } from 'esbuild'
import JavaScriptObfuscator from 'javascript-obfuscator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const MAGIC = Buffer.from('CNRP1\n', 'utf8')
const API_VERSION = '1.0.0'
const MAX_FILE_COUNT = 256
const MAX_PACKAGE_SIZE = 32 * 1024 * 1024
const ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/
const PLATFORM_IDS = new Set(['web', 'tauri', 'windows', 'macos', 'linux', 'android', 'ios'])
const PLATFORM_CAPABILITIES = new Set([
  'notifications:show', 'audio:select', 'audio:play', 'system:open-url', 'system:select-file',
  'system:select-directory', 'system:clipboard-read', 'system:clipboard-write', 'system:reveal-file', 'system:execute'
])

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const subtle = crypto.webcrypto.subtle

function fail(message) {
  throw new Error(message)
}

function parseArgs(argv) {
  const positional = []
  const options = {}
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i]
    if (!value.startsWith('--')) {
      positional.push(value)
      continue
    }
    const key = value.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      options[key] = next
      i += 1
    } else {
      options[key] = true
    }
  }
  return { positional, options }
}

function compareVersions(left, right) {
  const a = String(left || '0').split('.').map(value => Number(value) || 0)
  const b = String(right || '0').split('.').map(value => Number(value) || 0)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0)
    if (difference) return Math.sign(difference)
  }
  return 0
}


function normalizePath(value) {
  const normalized = String(value || '').replaceAll('\\', '/')
  if (!normalized || normalized.startsWith('/') || normalized.includes('../') || normalized.includes('/..')) {
    fail(`unsafe plugin path: ${value}`)
  }
  return normalized
}

function normalizePlatforms(value, label) {
  if (value === undefined) return []
  if (!Array.isArray(value)) fail(`${label} must be an array`)
  const platforms = [...new Set(value.map(item => String(item).toLowerCase()))]
  const unknown = platforms.find(item => !PLATFORM_IDS.has(item))
  if (unknown) fail(`${label} contains unknown platform: ${unknown}`)
  return platforms
}

function normalizePlatformEntries(value, label) {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`)
  const result = {}
  for (const [platform, entry] of Object.entries(value)) {
    if (!PLATFORM_IDS.has(platform)) fail(`${label} contains unknown platform: ${platform}`)
    result[platform] = normalizePath(entry)
  }
  return result
}

function normalizeCapabilities(value, permissions) {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('capabilities must be an object')
  const result = {}
  for (const [id, raw] of Object.entries(value)) {
    if (!PLATFORM_CAPABILITIES.has(id)) fail(`unknown platform capability: ${id}`)
    const declaration = raw === true ? { required: true } : raw === false ? { required: false } : raw
    if (!declaration || typeof declaration !== 'object' || Array.isArray(declaration)) fail(`invalid capability declaration: ${id}`)
    if (!permissions.includes(id)) fail(`capability ${id} must also appear in permissions`)
    result[id] = { required: !!declaration.required, platforms: normalizePlatforms(declaration.platforms, `${id}.platforms`) }
  }
  const undeclared = permissions.find(permission => permission.startsWith('system:') && !result[permission])
  if (undeclared) fail(`system permission ${undeclared} must be declared in capabilities`)
  return result
}

function normalizeSystemOperations(value, permissions) {
  if (value === undefined || (Array.isArray(value) && value.length === 0)) return []
  if (!permissions.includes('system:execute')) fail('systemOperations requires system:execute permission')
  if (!Array.isArray(value)) fail('systemOperations must be an array')
  const ids = new Set()
  return value.map(operation => {
    if (!operation || typeof operation !== 'object' || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(operation.id || '') || ids.has(operation.id)) fail(`invalid or duplicate system operation id: ${operation?.id || 'unknown'}`)
    ids.add(operation.id)
    if (!operation.label || String(operation.label).length > 100) fail(`system operation ${operation.id} needs a short label`)
    const platforms = normalizePlatforms(operation.platforms, `${operation.id}.platforms`)
    if (!platforms.length || platforms.includes('web')) fail(`system operation ${operation.id} must target a non-Web platform`)
    const command = operation.command
    if (!command || typeof command !== 'object') fail(`system operation ${operation.id} needs a fixed command`)
    const program = String(command.program || '')
    if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(program)) fail(`invalid program for system operation ${operation.id}`)
    const args = Array.isArray(command.args) ? command.args.map(String) : []
    if (args.length > 32 || args.some(argument => argument.includes('\0') || argument.length > 2048)) fail(`invalid fixed arguments for system operation ${operation.id}`)
    return { id: operation.id, label: String(operation.label), platforms, command: { program, args }, timeoutMs: Math.max(1000, Math.min(30000, Number(operation.timeoutMs) || 10000)) }
  })
}

function normalizeNativePage(value, label) {
  if (value === undefined || value === null) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`)
  if (value.type !== 'settings') fail(`${label}.type must be settings`)
  if (!Array.isArray(value.controls) || value.controls.length > 64) fail(`${label}.controls must be an array with at most 64 items`)
  const ids = new Set()
  const controls = value.controls.map((control, index) => {
    if (!control || typeof control !== 'object' || !/^[a-z][a-z0-9._-]{0,63}$/i.test(control.id || '') || ids.has(control.id)) fail(`${label}.controls[${index}] has an invalid or duplicate id`)
    ids.add(control.id)
    const type = String(control.type || '')
    if (!['toggle', 'range', 'select', 'audio'].includes(type)) fail(`${label}.controls[${index}] has an unsupported type`)
    if (!control.label || !/^[a-z][a-z0-9._-]{0,63}$/i.test(control.path || '')) fail(`${label}.controls[${index}] needs label and path`)
    if (type === 'select' && (!Array.isArray(control.options) || !control.options.length || control.options.length > 32)) fail(`${label}.controls[${index}] needs options`)
    if (type === 'range' && (!Number.isFinite(Number(control.min)) || !Number.isFinite(Number(control.max)) || Number(control.min) >= Number(control.max))) fail(`${label}.controls[${index}] has an invalid range`)
    return structuredClone(control)
  })
  return { type: 'settings', settingsKey: String(value.settingsKey || 'settings'), controls }
}

function normalizeManifest(raw) {
  if (!raw || typeof raw !== 'object') fail('manifest.json must be an object')
  const manifest = structuredClone(raw)
  if (manifest.schemaVersion !== 1) fail('schemaVersion must be 1')
  if (!ID_PATTERN.test(manifest.id || '')) fail('manifest.id must use reverse-domain style')
  if (!manifest.name || !manifest.version || !manifest.author) fail('manifest.name, version and author are required')
  if (!manifest.engine || compareVersions(API_VERSION, manifest.engine.min || '0') < 0) fail(`plugin requires API ${manifest.engine?.min || 'unknown'}`)
  if (manifest.engine.max && compareVersions(API_VERSION, manifest.engine.max) > 0) fail(`plugin supports API ${manifest.engine.max} or lower`)
  manifest.permissions = [...new Set(manifest.permissions || [])]
  const permissions = new Set(['storage:read', 'storage:write', 'events:draw', 'notifications:show', 'audio:select', 'audio:play', 'names:read', 'records:read', 'statistics:read', 'balance:read'])
  for (const permission of ['system:open-url', 'system:select-file', 'system:select-directory', 'system:clipboard-read', 'system:clipboard-write', 'system:reveal-file', 'system:execute']) permissions.add(permission)
  const unknown = manifest.permissions.find(permission => !permissions.has(permission))
  if (unknown) fail(`unknown permission: ${unknown}`)
  manifest.supportedPlatforms = normalizePlatforms(manifest.supportedPlatforms, 'supportedPlatforms')
  manifest.platformEntries = normalizePlatformEntries(manifest.platformEntries, 'platformEntries')
  manifest.capabilities = normalizeCapabilities(manifest.capabilities, manifest.permissions)
  manifest.systemOperations = normalizeSystemOperations(manifest.systemOperations, manifest.permissions)
  manifest.dependencies = Array.isArray(manifest.dependencies) ? manifest.dependencies : []
  manifest.contributes = manifest.contributes && typeof manifest.contributes === 'object' ? manifest.contributes : {}
  if (manifest.entry) manifest.entry = normalizePath(manifest.entry)
  if (manifest.icon) manifest.icon = normalizePath(manifest.icon)
  if (manifest.readme) manifest.readme = normalizePath(manifest.readme)
  for (const page of manifest.contributes.pages || []) {
    if (!page.id || !page.title || (!page.entry && !page.platformEntries && !page.native)) fail('each contributed page needs id, title and an entry or native schema')
    if (page.entry) page.entry = normalizePath(page.entry)
    page.platformEntries = normalizePlatformEntries(page.platformEntries, `page ${page.id}.platformEntries`)
    page.native = normalizeNativePage(page.native, `page ${page.id}.native`)
  }
  return manifest
}

function toBase64(bytes) { return Buffer.from(bytes).toString('base64') }
function fromBase64(value) { return Buffer.from(value, 'base64') }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex') }

async function bundleWorker(sourcePath) {
  const sdkPath = path.resolve(packageRoot, 'src/plugin-sdk.mjs')
  const result = await build({
    entryPoints: [sourcePath],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    minify: false,
    sourcemap: false,
    legalComments: 'none',
    alias: {
      '@cyrene2008/cyrene-name-roller/plugin-sdk': sdkPath,
      '@cyrene2008/cyrene-name-roller': sdkPath
    }
  })
  const source = result.outputFiles[0].text
  const obfuscated = JavaScriptObfuscator.obfuscate(source, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.55,
    deadCodeInjection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    selfDefending: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.7,
    unicodeEscapeSequence: false
  })
  return `${obfuscated.getObfuscatedCode()}\n`
}

async function collectFiles(root, current = root, result = []) {
  const entries = await fs.readdir(current, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.DS_Store') continue
    const full = path.join(current, entry.name)
    if (entry.isDirectory()) await collectFiles(root, full, result)
    else result.push(path.relative(root, full).replaceAll('\\', '/'))
  }
  return result
}

async function validateDirectory(directory) {
  const manifestPath = path.join(directory, 'manifest.json')
  const raw = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  const manifest = normalizeManifest(raw)
  const files = new Set(await collectFiles(directory))
  if (files.size > MAX_FILE_COUNT) fail(`plugin has more than ${MAX_FILE_COUNT} files`)
  const requiredFiles = [
    manifest.entry,
    ...Object.values(manifest.platformEntries || {}),
    manifest.icon,
    manifest.readme,
    ...(manifest.contributes.pages || []).flatMap(page => [page.entry, ...Object.values(page.platformEntries || {})])
  ].filter(Boolean)
  for (const required of requiredFiles) {
    if (!files.has(required)) fail(`manifest references missing file: ${required}`)
  }
  return { manifest, files: [...files].filter(file => file !== 'manifest.json') }
}

async function encryptEnvelope(zipBytes, manifest, options = {}) {
  const hash = sha256(zipBytes)
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const material = await subtle.importKey('raw', textEncoder.encode(`${manifest.id}@${manifest.version}:CyreneNameRollerPlugin-v1`), 'PBKDF2', false, ['deriveKey'])
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  const additionalData = textEncoder.encode(`${manifest.id}\0${manifest.version}\0${hash}`)
  const encrypted = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, zipBytes))
  const envelope = {
    v: 1,
    id: manifest.id,
    version: manifest.version,
    salt: toBase64(salt),
    iv: toBase64(iv),
    hash,
    data: toBase64(encrypted),
    signatureAlgorithm: '',
    signature: '',
    publisherKey: ''
  }
  if (options.privateKey) {
    const privateKey = crypto.createPrivateKey(await fs.readFile(options.privateKey, 'utf8'))
    const signed = Buffer.from(`${manifest.id}\0${manifest.version}\0${hash}`, 'utf8')
    const signature = crypto.sign(null, signed, privateKey)
    const publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' })
    envelope.signatureAlgorithm = 'Ed25519'
    envelope.signature = toBase64(signature)
    envelope.publisherKey = toBase64(publicKey)
  }
  const output = Buffer.concat([MAGIC, Buffer.from(JSON.stringify(envelope), 'utf8')])
  if (output.byteLength > MAX_PACKAGE_SIZE) fail(`output package exceeds ${MAX_PACKAGE_SIZE} bytes`)
  return { output, envelope }
}

async function packDirectory(directory, outFile, options = {}) {
  const { manifest, files } = await validateDirectory(directory)
  const workerEntries = new Set([manifest.entry, ...Object.values(manifest.platformEntries || {})].filter(Boolean))
  const bundledWorkers = new Map()
  for (const entry of workerEntries) bundledWorkers.set(entry, Buffer.from(await bundleWorker(path.resolve(directory, entry)), 'utf8'))
  const finalFiles = await collectFiles(directory)
  const integrity = {}
  const archive = new JSZip()
  for (const file of finalFiles) {
    const bytes = bundledWorkers.get(file) || await fs.readFile(path.join(directory, file))
    if (file !== 'manifest.json') integrity[file] = sha256(bytes)
    archive.file(file, bytes)
  }
  const packageManifest = { ...manifest, integrity }
  archive.file('manifest.json', JSON.stringify(packageManifest, null, 2))
  const zipBytes = await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
  const { output, envelope } = await encryptEnvelope(zipBytes, packageManifest, options)
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, output)
  return { manifest: packageManifest, output, envelope, packageHash: sha256(output), outFile }
}

async function createTemplate(directory, kind = 'basic') {
  const templateName = ['sound', 'sound-effects'].includes(kind) ? 'sound-effects' : 'basic'
  const templateDirectory = path.join(packageRoot, 'templates', templateName)
  await fs.access(path.join(templateDirectory, 'manifest.json'))
  await fs.mkdir(directory, { recursive: true })
  const existing = await fs.readdir(directory)
  if (existing.length) fail(`target directory is not empty: ${directory}`)
  await fs.cp(templateDirectory, directory, { recursive: true })
}

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2))
  const command = positional[0] || 'help'
  if (command === 'help' || options.help) {
    console.log('cnrp create <dir> [--template basic|sound-effects]')
    console.log('cnrp validate <dir>')
    console.log('cnrp pack <dir> --out <file.cnrp> [--private-key key.pem]')
    return
  }
  if (command === 'create') {
    const directory = path.resolve(positional[1] || 'my-cyrene-plugin')
    await createTemplate(directory, options.template || 'basic')
    console.log(`Created plugin template at ${directory}`)
    return
  }
  if (command === 'validate') {
    const directory = path.resolve(positional[1] || '.')
    const result = await validateDirectory(directory)
    console.log(`Valid: ${result.manifest.id} v${result.manifest.version} (${result.files.length} files)`)
    return
  }
  if (command === 'pack') {
    const directory = path.resolve(positional[1] || '.')
    const outFile = path.resolve(options.out || path.join(directory, 'dist', `${path.basename(directory)}.cnrp`))
    const result = await packDirectory(directory, outFile, { privateKey: options['private-key'] })
    console.log(`Packed ${result.manifest.id} v${result.manifest.version}`)
    console.log(`Output: ${result.outFile}`)
    console.log(`SHA-256: ${result.packageHash}`)
    console.log(`Publisher signature: ${result.envelope.signature ? 'Ed25519' : 'none (local/unverified)'}`)
    return
  }
  fail(`unknown command: ${command}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`cnrp: ${error.message || error}`)
    process.exitCode = 1
  })
}

export { packDirectory, validateDirectory, createTemplate }
