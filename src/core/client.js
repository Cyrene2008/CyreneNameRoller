import { dataBridge } from '../utils/dataBridge.js'
import { useNamesStore } from '../stores/names.js'
import { useRecordsStore } from '../stores/records.js'
import { useStatisticsStore } from '../stores/statistics.js'
import { commitCoreStateTransaction } from '../plugins/coreDraw.js'
import { normalizeCoreCaller, normalizeCoreDrawInput } from './protocol.js'
import { executeCoreDrawRequest } from './web/coreService.js'

class CoreClient {
  constructor() {
    this.worker = null
    this.pending = new Map()
    this.requestSequence = 0
    this.lastStateSignature = ''
    this.fallbackState = null
    this.commitQueue = Promise.resolve()
  }

  ensureWorker() {
    if (this.worker || typeof Worker === 'undefined') return this.worker
    this.worker = new Worker(new URL('./web/core.worker.js', import.meta.url), { type: 'module', name: 'cyrene-core' })
    this.worker.onmessage = event => {
      const message = event.data || {}
      const pending = this.pending.get(message.requestId)
      if (!pending) return
      this.pending.delete(message.requestId)
      if (message.type === 'success') pending.resolve(message.value)
      else pending.reject(Object.assign(new Error(message.message || 'Core transaction failed'), { code: message.code || 'CORE_TRANSACTION_REJECTED' }))
    }
    this.worker.onerror = event => {
      const error = Object.assign(new Error(event.message || 'Core Worker crashed'), { code: 'CORE_TRANSACTION_REJECTED' })
      for (const pending of this.pending.values()) pending.reject(error)
      this.pending.clear()
      this.worker?.terminate()
      this.worker = null
    }
    return this.worker
  }

  request(message) {
    const worker = this.ensureWorker()
    if (!worker) {
      if (message.type === 'state.sync') {
        this.fallbackState = JSON.parse(JSON.stringify(message.state))
        return Promise.resolve(true)
      }
      const value = executeCoreDrawRequest({ ...message, state: this.fallbackState })
      this.fallbackState = { ...this.fallbackState, statistics: value.nextStatistics, records: value.nextRecords }
      return Promise.resolve(value)
    }
    const requestId = `core-${++this.requestSequence}`
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject })
      worker.postMessage({ ...message, requestId })
    })
  }

  async executeDraw({ caller: rawCaller, input: rawInput }) {
    const caller = normalizeCoreCaller(rawCaller)
    const input = normalizeCoreDrawInput(rawInput)
    const namesStore = useNamesStore()
    const recordsStore = useRecordsStore()
    const statisticsStore = useStatisticsStore()
    await Promise.all([namesStore.initialize(), recordsStore.initialize(), statisticsStore.initialize()])
    const balance = await dataBridge.load('balance')
    const stateSignature = `${namesStore.revision}:${recordsStore.revision}:${statisticsStore.revision}:${JSON.stringify(balance || {})}`
    if (stateSignature !== this.lastStateSignature) {
      await this.request({
        type: 'state.sync',
        state: {
        names: { currentListId: namesStore.currentListId, lists: JSON.parse(JSON.stringify(namesStore.nameLists)) },
        records: recordsStore.snapshotState(),
        statistics: statisticsStore.snapshotState(),
          balance
        }
      })
      this.lastStateSignature = stateSignature
    }
    const value = await this.request({ type: 'draw.execute', caller, input })
    const commit = this.commitQueue.catch(() => {}).then(() => commitCoreStateTransaction({
      statisticsStore,
      recordsStore,
      nextStatistics: value.nextStatistics,
      nextRecords: value.nextRecords
    }))
    this.commitQueue = commit
    await commit
    this.lastStateSignature = `${namesStore.revision}:${recordsStore.revision}:${statisticsStore.revision}:${JSON.stringify(balance || {})}`
    return JSON.parse(JSON.stringify(value.receipt))
  }
}

const client = new CoreClient()
export function getCoreClient() { return client }
