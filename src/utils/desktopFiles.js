import { isTauri, tauriAPI } from './tauriAPI'

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
  if (window.electronAPI?.saveTextFile) {
    result = await window.electronAPI.saveTextFile(content, defaultName, extension)
  } else if (isTauri()) {
    result = await tauriAPI.saveTextFile(content, defaultName, extension)
  } else {
    return browserDownload(content, defaultName, extension === 'json' ? 'application/json' : 'text/plain')
  }
  if (result?.success && result.filePath) emitFileNotice(`已保存：${result.filePath}`, result.filePath)
  return result || { success: false, error: '保存失败' }
}

export async function openTextFile(extension = 'json') {
  if (window.electronAPI?.openTextFile) return window.electronAPI.openTextFile(extension)
  if (isTauri()) return tauriAPI.openTextFile(extension)
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = `.${extension}`
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
  if (window.electronAPI?.revealFile) return window.electronAPI.revealFile(path)
  if (isTauri()) return tauriAPI.revealFile(path)
  return false
}
