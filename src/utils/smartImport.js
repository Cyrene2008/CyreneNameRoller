import * as XLSX from 'xlsx'
import { parseListFile } from './listFile'
import { parsePrizeListCsv } from './prizeCsv'

const textDecoder = new TextDecoder('utf-8')

function baseName(name) {
  return String(name || '导入名单').replace(/\.[^.]+$/, '') || '导入名单'
}

function extensionOf(name) {
  return String(name || '').split('.').pop()?.toLowerCase() || ''
}

function looksLikePrizeHeader(text) {
  const header = String(text || '').split(/\r?\n/, 1)[0].toLowerCase()
  return /(quantity|库存)/.test(header) && /(weight|权重)/.test(header)
}

function normalizeJson(value, name) {
  const fallbackName = baseName(name)
  if (Array.isArray(value)) {
    if (value.some(item => item && ('quantity' in item || 'weight' in item || '库存' in item || '权重' in item))) {
      return { kind: 'prizes', list: { name: fallbackName, prizes: value } }
    }
    return { kind: 'names', list: { name: fallbackName, groups: [], names: value } }
  }
  if (value?.prizes && Array.isArray(value.prizes)) return { kind: 'prizes', list: value }
  if (value?.names && Array.isArray(value.names)) return { kind: 'names', list: value }
  throw new Error('JSON 中未识别到人员名单或奖品单')
}

function parseTextFile(name, text) {
  const normalized = String(text || '').replace(/^\uFEFF/, '').trim()
  if (!normalized) throw new Error('文件内容为空')
  if (extensionOf(name) === 'json' || normalized.startsWith('{') || normalized.startsWith('[')) {
    return normalizeJson(JSON.parse(normalized), name)
  }
  if (looksLikePrizeHeader(normalized)) {
    return { kind: 'prizes', list: parsePrizeListCsv(normalized) }
  }
  const parsed = parseListFile(normalized)
  if (parsed.list.name === '导入名单') parsed.list.name = baseName(name)
  return { kind: 'names', list: parsed.list }
}

function simpleSheetToList(rows, name) {
  const groups = []
  const groupIds = new Map()
  const names = []
  for (const row of rows) {
    const cn = String(row?.[0] ?? '').trim()
    if (!cn) continue
    const en = String(row?.[1] ?? '').trim()
    const genderText = String(row?.[2] ?? '').trim().toLowerCase()
    const groupName = String(row?.[3] ?? '').trim()
    let groupId = ''
    if (groupName) {
      groupId = groupIds.get(groupName) || `group-${groupIds.size + 1}`
      if (!groupIds.has(groupName)) {
        groupIds.set(groupName, groupId)
        groups.push({ id: groupId, name: groupName, enName: '' })
      }
    }
    names.push({ cn, en, gender: ['female', 'f', '女'].includes(genderText) ? 'female' : 'male', groupId, isWhiteList: false })
  }
  if (!names.length) throw new Error('XLSX 中没有可导入的人员')
  return { name: baseName(name), groups, names }
}

function parseWorkbook(name, bytes) {
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: false })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error('XLSX 中没有工作表')
  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
    .filter(row => row.some(value => String(value).trim()))
  if (!rows.length) throw new Error('XLSX 工作表为空')
  const firstRow = rows[0].map(value => String(value).trim().toLowerCase())
  const knownHeaders = ['姓名', '中文名', 'name', 'cn', '奖品', 'quantity', '库存', 'weight', '权重', '名单名称']
  const hasHeader = firstRow.some(value => knownHeaders.includes(value))
  if (!hasHeader) return { kind: 'names', list: simpleSheetToList(rows, name) }
  return parseTextFile(`${baseName(name)}.csv`, XLSX.utils.sheet_to_csv(sheet))
}

export function parseSmartFile(name, input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  const extension = extensionOf(name)
  if (extension === 'cyrene') return { kind: 'data', bytes, name }
  if (extension === 'xlsx' || extension === 'xls') return parseWorkbook(name, bytes)
  if (!['csv', 'json'].includes(extension)) throw new Error('仅支持 CSV、XLSX、JSON 和 CYRENE 文件')
  return parseTextFile(name, textDecoder.decode(bytes))
}
