import { isTauri, tauriAPI } from './tauriAPI.js'

export function emitFileNotice(message, path = '') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cyrene:data-saved', {
    detail: { message, location: path, path }
  }))
}

function browserDownload(content, defaultName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = defaultName
  anchor.click()
  URL.revokeObjectURL(url)
  return { success: true, browser: true, filePath: defaultName }
}

export async function saveTextFile(content, defaultName, extension = 'json') {
  let result
  if (isTauri()) {
    result = await tauriAPI.saveTextFile(content, defaultName, extension)
  } else {
    const mimeType = extension === 'json'
      ? 'application/json'
      : (extension === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain')
    return browserDownload(content, defaultName, mimeType)
  }
  return result || { success: false, error: '保存失败' }
}

export async function openTextFile(extension = 'json') {
  const extensions = (Array.isArray(extension) ? extension : [extension])
    .map(value => String(value).replace(/[^a-z0-9]/gi, '').toLowerCase())
    .filter(Boolean)
  const accepted = extensions.length ? extensions : ['json']
  if (isTauri()) return tauriAPI.openTextFile(accepted)
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accepted.map(value => `.${value}`).join(',')
    input.onchange = async event => {
      const file = event.target.files?.[0]
      if (!file) return resolve({ success: false, cancelled: true })
      try {
        resolve({ success: true, content: await file.text(), filePath: file.name })
      } catch (error) {
        resolve({ success: false, error: error.message })
      }
    }
    input.click()
  })
}

export async function revealFile(path) {
  if (isTauri()) return tauriAPI.revealFile(path)
  return false
}
