function wrapNumbers(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
  const textNodes = []
  let node
  while ((node = walker.nextNode())) textNodes.push(node)

  for (const textNode of textNodes) {
    const text = textNode.textContent
    if (!text || !/\d/.test(text)) continue

    const frag = document.createDocumentFragment()
    // 匹配数字（含小数）和非数字部分
    const parts = text.split(/(\d+\.?\d*)/g)
    for (const part of parts) {
      if (!part) continue
      if (/^\d+\.?\d*$/.test(part)) {
        const span = document.createElement('span')
        span.className = 'auto-num'
        span.textContent = part
        frag.appendChild(span)
      } else {
        frag.appendChild(document.createTextNode(part))
      }
    }
    textNode.parentNode.replaceChild(frag, textNode)
  }
}

export const vNum = {
  mounted(el) {
    wrapNumbers(el)
    el._numObserver = new MutationObserver(() => wrapNumbers(el))
    el._numObserver.observe(el, { childList: true, subtree: true, characterData: true })
  },
  updated(el) {
    // 清理旧的auto-num spans，重新包装
    el.querySelectorAll('.auto-num').forEach(span => {
      span.replaceWith(document.createTextNode(span.textContent))
    })
    wrapNumbers(el)
  },
  unmounted(el) {
    if (el._numObserver) {
      el._numObserver.disconnect()
      delete el._numObserver
    }
  }
}
