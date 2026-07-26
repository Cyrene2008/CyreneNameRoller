const CSV_HEADERS = [
  'record_type',
  'list_name',
  'list_id',
  'record_id',
  'chinese_name',
  'english_name',
  'group_id',
  'group_name',
  'group_english_name',
  'is_whitelist'
]

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function serializeListFile(list, format = 'csv') {
  if (format === 'json') return JSON.stringify(list, null, 2)

  const rows = [
    CSV_HEADERS,
    ['list', list.name, list.id, '', '', '', '', '', '', ''],
    ...(list.groups || []).map(group => [
      'group', list.name, list.id, group.id, '', '', group.id,
      group.name, group.enName || '', ''
    ]),
    ...(list.names || []).map(person => [
      'person', list.name, list.id, person.id || '', person.cn || '', person.en || '',
      person.groupId || '', '', '', person.isWhiteList ? 'true' : 'false'
    ])
  ]
  // UTF-8 BOM keeps Chinese headers and names readable when opened directly in Excel.
  return `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`
}

function parseCsv(content) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < content.length; index++) {
    const character = content[index]
    if (quoted) {
      if (character === '"' && content[index + 1] === '"') {
        cell += '"'
        index++
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && content[index + 1] === '\n') index++
      row.push(cell)
      if (row.some(value => value.trim() !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (quoted) throw new Error('CSV 中存在未闭合的引号')
  row.push(cell)
  if (row.some(value => value.trim() !== '')) rows.push(row)
  return rows
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function field(record, aliases) {
  for (const alias of aliases) {
    const value = record[alias]
    if (value !== undefined && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function csvToList(content) {
  const rows = parseCsv(content.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('CSV 中没有可导入的数据')
  const headers = rows[0].map(normalizeHeader)
  const records = rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
  const typeOf = record => field(record, ['record_type', 'type', '类型']).toLowerCase()
  const listRecord = records.find(record => typeOf(record) === 'list')
  const listName = field(listRecord || records[0], ['list_name', '名单名称', '名单名']) || '导入名单'
  const listId = field(listRecord || records[0], ['list_id', '名单id', '名单_id'])
  const groups = []
  const knownGroups = new Set()

  function addGroup(id, name, enName = '') {
    if (!id || knownGroups.has(id)) return
    knownGroups.add(id)
    groups.push({ id, name: name || id, enName })
  }

  records.forEach(record => {
    const type = typeOf(record)
    if (type !== 'group' && type !== '小组') return
    const id = field(record, ['group_id', 'record_id', '小组id', '小组_id'])
    addGroup(
      id,
      field(record, ['group_name', '小组名称', '组名']),
      field(record, ['group_english_name', 'group_en_name', '小组英文名'])
    )
  })

  const names = []
  records.forEach(record => {
    const type = typeOf(record)
    if (type === 'list' || type === 'group' || type === '小组') return
    const cn = field(record, ['chinese_name', 'cn', 'name', '姓名', '中文名', '名称'])
    if (!cn) return
    const groupId = field(record, ['group_id', '小组id', '小组_id'])
    addGroup(
      groupId,
      field(record, ['group_name', '小组名称', '组名']),
      field(record, ['group_english_name', 'group_en_name', '小组英文名'])
    )
    const whiteListValue = field(record, ['is_whitelist', 'whitelist', '白名单']).toLowerCase()
    const count = Number(field(record, ['count', '次数', '抽取次数']))
    names.push({
      id: field(record, ['record_id', 'person_id', 'uuid', '人员id', '人员_id']),
      cn,
      en: field(record, ['english_name', 'en', '英文名']),
      groupId,
      isWhiteList: ['true', '1', 'yes', '是'].includes(whiteListValue),
      count: Number.isFinite(count) && count > 0 ? count : 0
    })
  })

  if (!names.length && !groups.length) throw new Error('CSV 中未识别到人员或小组数据')
  return { id: listId, name: listName, groups, names }
}

export function parseListFile(content) {
  const normalized = String(content || '').replace(/^\uFEFF/, '').trim()
  if (!normalized) throw new Error('文件内容为空')
  if (normalized.startsWith('{') || normalized.startsWith('[')) {
    const parsed = JSON.parse(normalized)
    const list = Array.isArray(parsed) ? { name: '导入名单', groups: [], names: parsed } : parsed
    if (!list || !list.name || !Array.isArray(list.names)) throw new Error('JSON 名单结构无效')
    return { format: 'json', list }
  }
  return { format: 'csv', list: csvToList(normalized) }
}
