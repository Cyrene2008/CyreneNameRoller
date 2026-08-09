import { executeCoreCardRequest, executeCoreDrawRequest } from './coreService.js'

export function createCoreWorkerHandler(postMessage) {
  let queue = Promise.resolve()
  let coreState = null

  return event => {
    const message = event?.data || {}
    if (!['state.sync', 'draw.execute', 'card.commit'].includes(message.type) || typeof message.requestId !== 'string') return
    queue = queue.catch(() => {}).then(async () => {
      try {
        if (message.type === 'state.sync') {
          coreState = structuredClone(message.state)
          postMessage({ type: 'success', requestId: message.requestId, value: true })
          return
        }
        if (!coreState) throw Object.assign(new Error('Core Worker 尚未同步状态'), { code: 'CORE_TRANSACTION_REJECTED' })
        const value = message.type === 'card.commit'
          ? executeCoreCardRequest({ ...message, state: coreState })
          : executeCoreDrawRequest({ ...message, state: coreState })
        coreState = { ...coreState, statistics: value.nextStatistics, records: value.nextRecords }
        postMessage({ type: 'success', requestId: message.requestId, value })
      } catch (error) {
        postMessage({ type: 'error', requestId: message.requestId, code: error?.code || 'CORE_TRANSACTION_REJECTED', message: error?.message || String(error) })
      }
    })
    return queue
  }
}

if (typeof self !== 'undefined') self.onmessage = createCoreWorkerHandler(message => self.postMessage(message))
