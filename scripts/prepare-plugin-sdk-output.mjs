import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'packages', 'cyrene-name-roller')
const output = path.join(root, 'build-output', 'plugin-sdk')
const stage = path.join(output, 'stage')
const packageJson = JSON.parse(await fs.readFile(path.join(source, 'package.json'), 'utf8'))
const baseName = `cyrene-name-roller-plugin-sdk-${packageJson.version}`

async function run(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)))
  })
}

async function collect(directory, rootDirectory = directory, files = []) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) await collect(full, rootDirectory, files)
    else files.push({ full, relative: path.relative(rootDirectory, full).replaceAll('\\', '/') })
  }
  return files
}

await fs.rm(output, { recursive: true, force: true })
await fs.mkdir(stage, { recursive: true })
await fs.cp(source, stage, { recursive: true })
await fs.copyFile(path.join(root, 'LICENSE'), path.join(stage, 'LICENSE'))

const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('npm_execpath is unavailable; run this command through npm run plugin:sdk:pack')
await run(process.execPath, [npmCli, 'pack', stage, '--pack-destination', output], root)
const generatedTgz = (await fs.readdir(output)).find(name => name.endsWith('.tgz'))
if (!generatedTgz) throw new Error('npm pack did not produce a .tgz file')
await fs.rename(path.join(output, generatedTgz), path.join(output, `${baseName}.tgz`))

const zip = new JSZip()
for (const file of await collect(stage)) zip.file(`${baseName}/${file.relative}`, await fs.readFile(file.full))
await fs.writeFile(path.join(output, `${baseName}.zip`), await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }))
await fs.rm(stage, { recursive: true, force: true })

console.log(`Prepared ${path.join(output, `${baseName}.tgz`)}`)
console.log(`Prepared ${path.join(output, `${baseName}.zip`)}`)
