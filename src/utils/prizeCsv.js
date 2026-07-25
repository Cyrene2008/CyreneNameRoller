function escapeCell(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function serializePrizeListCsv(list) {
  const rows = [['listName', 'name', 'quality', 'quantity', 'weight', 'id']]
  if (!list.prizes.length) rows.push([list.name, '', '', '', '', ''])
  else list.prizes.forEach(prize => rows.push([list.name, prize.name, prize.quality, prize.quantity, prize.weight, prize.id]))
  return `\ufeff${rows.map(row => row.map(escapeCell).join(',')).join('\r\n')}`
}

function parseRows(content) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const source = String(content || '').replace(/^\ufeff/, '')
  for (let index = 0; index < source.length; index++) {
    const character = source[index]
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') quoted = false
      else cell += character
    } else if (character === '"') quoted = true
    else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else cell += character
  }
  row.push(cell.replace(/\r$/, ''))
  if (row.some(value => value !== '')) rows.push(row)
  if (quoted) throw new Error('CSV 引号未闭合')
  return rows
}

export function parsePrizeListCsv(content) {
  const rows = parseRows(content)
  if (rows.length < 2) throw new Error('CSV 没有奖品数据')
  const headers = rows[0].map(header => header.trim())
  const indexOf = (...candidates) => headers.findIndex(header => candidates.includes(header))
  const columns = {
    listName: indexOf('listName', '奖品单'),
    name: indexOf('name', '奖品'),
    quality: indexOf('quality', '品质'),
    quantity: indexOf('quantity', '库存'),
    weight: indexOf('weight', '权重'),
    id: indexOf('id', '奖品ID')
  }
  if (columns.name < 0 || columns.quantity < 0 || columns.weight < 0) throw new Error('CSV 缺少 name、quantity 或 weight 列')
  const valueAt = (row, index) => index < 0 ? '' : String(row[index] || '').trim()
  const listName = rows.slice(1).map(row => valueAt(row, columns.listName)).find(Boolean) || '导入的奖品单'
  const prizes = rows.slice(1).filter(row => valueAt(row, columns.name)).map(row => ({
    id: valueAt(row, columns.id) || undefined,
    name: valueAt(row, columns.name),
    quality: valueAt(row, columns.quality) || '普通',
    quantity: Number(valueAt(row, columns.quantity)),
    weight: Number(valueAt(row, columns.weight))
  }))
  if (!prizes.length && rows.length > 2) throw new Error('CSV 中没有有效奖品')
  if (prizes.some(prize => !Number.isFinite(prize.quantity) || prize.quantity < 0 || !Number.isFinite(prize.weight) || prize.weight <= 0)) {
    throw new Error('库存必须为非负数，权重必须大于 0')
  }
  return { name: listName, prizes }
}
