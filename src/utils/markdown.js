
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url) {
  const u = String(url).trim()
  if (/^(https?:\/\/|mailto:|\/)/i.test(u)) return u
  return '#'
}

function renderInline(text) {
  let s = escapeHtml(text)
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>')
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) =>
    `<a href="${sanitizeUrl(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`
  )
  return s
}

export function renderMarkdown(md) {
  if (!md) return ''
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  let html = ''
  let paragraph = []
  let listType = null
  let listBuffer = []
  let inCode = false
  let codeBuffer = []

  const flushParagraph = () => {
    if (paragraph.length) {
      html += `<p>${renderInline(paragraph.join(' '))}</p>`
      paragraph = []
    }
  }
  const flushList = () => {
    if (listBuffer.length) {
      const tag = listType
      html += `<${tag}>` + listBuffer.map(li => `<li>${renderInline(li)}</li>`).join('') + `</${tag}>`
      listBuffer = []
      listType = null
    }
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (inCode) {
      if (/^\s*```/.test(line)) {
        html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`
        codeBuffer = []
        inCode = false
      } else {
        codeBuffer.push(line)
      }
      continue
    }
    if (/^\s*```/.test(line)) {
      flushParagraph(); flushList()
      inCode = true
      continue
    }
    if (/^\s*$/.test(line)) {
      flushParagraph(); flushList()
      continue
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushParagraph(); flushList()
      html += `<h${h[1].length}>${renderInline(h[2])}</h${h[1].length}>`
      continue
    }
    if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph(); flushList()
      html += '<hr/>'
      continue
    }
    const q = line.match(/^\s*>\s?(.*)$/)
    if (q) {
      flushParagraph(); flushList()
      html += `<blockquote>${renderInline(q[1])}</blockquote>`
      continue
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      flushParagraph()
      if (listType && listType !== 'ul') flushList()
      listType = 'ul'
      listBuffer.push(ul[1])
      continue
    }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      flushParagraph()
      if (listType && listType !== 'ol') flushList()
      listType = 'ol'
      listBuffer.push(ol[1])
      continue
    }
    flushList()
    paragraph.push(line.trim())
  }
  if (inCode) html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`
  flushParagraph(); flushList()
  return html
}
