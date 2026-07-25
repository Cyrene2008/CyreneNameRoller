const MAGIC = new TextEncoder().encode('CYRENE1\0')
const NONCE_LENGTH = 12
const KEY_MATERIAL = 'CyreneNameRoller:encrypted-data:v1:cn.cyrene2008.nameroller'

let cachedKey

async function getKey() {
  if (!cachedKey) {
    const material = new TextEncoder().encode(KEY_MATERIAL)
    const digest = await crypto.subtle.digest('SHA-256', material)
    cachedKey = crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  }
  return cachedKey
}

function hasMagic(bytes) {
  return MAGIC.every((byte, index) => bytes[index] === byte)
}

export async function encryptCyreneData(value) {
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH))
  const plain = new TextEncoder().encode(JSON.stringify(value))
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, await getKey(), plain))
  const output = new Uint8Array(MAGIC.length + nonce.length + encrypted.length)
  output.set(MAGIC)
  output.set(nonce, MAGIC.length)
  output.set(encrypted, MAGIC.length + nonce.length)
  return output
}

export async function decryptCyreneData(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  if (bytes.length <= MAGIC.length + NONCE_LENGTH + 16 || !hasMagic(bytes)) {
    throw new Error('数据文件格式无效')
  }
  try {
    const nonceStart = MAGIC.length
    const nonceEnd = nonceStart + NONCE_LENGTH
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.slice(nonceStart, nonceEnd) },
      await getKey(),
      bytes.slice(nonceEnd)
    )
    const value = JSON.parse(new TextDecoder().decode(plain))
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('数据内容无效')
    return value
  } catch {
    throw new Error('数据完整性校验失败，文件可能已被篡改')
  }
}
