export interface LocalAudioFile {
  id: string
  name: string
  size: number
  type: string
  createdAt: number
}

interface StoredAudioFile extends LocalAudioFile {
  blob: Blob
}

const DATABASE_NAME = 'cycle-order-local-audio'
const DATABASE_VERSION = 1
const STORE_NAME = 'audio-files'
const AUDIO_REFERENCE_PREFIX = 'local-audio://'

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('无法打开本地音频存储'))
  })

export const saveLocalAudio = async (file: File): Promise<LocalAudioFile> => {
  const database = await openDatabase()
  const metadata: LocalAudioFile = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    createdAt: Date.now(),
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ ...metadata, blob: file } satisfies StoredAudioFile)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('无法保存本地音频'))
  })
  database.close()
  return metadata
}

export const listLocalAudio = async (): Promise<LocalAudioFile[]> => {
  const database = await openDatabase()
  const files = await new Promise<LocalAudioFile[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result as StoredAudioFile[])
    request.onerror = () => reject(request.error ?? new Error('无法读取本地音频'))
  })
  database.close()
  return files.sort((left, right) => right.createdAt - left.createdAt)
}

export const getLocalAudioBlob = async (id: string): Promise<Blob> => {
  const database = await openDatabase()
  const file = await new Promise<StoredAudioFile | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result as StoredAudioFile | undefined)
    request.onerror = () => reject(request.error ?? new Error('无法读取本地音频'))
  })
  database.close()

  if (!file) {
    throw new Error('本地音频不存在，可能已被浏览器清理')
  }
  return file.blob
}

export const createAudioReference = (audio: LocalAudioFile): string =>
  `${AUDIO_REFERENCE_PREFIX}${audio.id}|||${audio.name}`

export const getAudioReferenceId = (value?: string): string | undefined => {
  if (!value?.startsWith(AUDIO_REFERENCE_PREFIX)) return undefined
  return value.slice(AUDIO_REFERENCE_PREFIX.length).split('|||')[0]
}

export const getAudioDisplayName = (value?: string): string => {
  if (!value) return ''
  return value.includes('|||') ? value.split('|||')[value.startsWith(AUDIO_REFERENCE_PREFIX) ? 1 : 0] : value
}