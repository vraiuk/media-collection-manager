const DB_NAME = 'media-previews'
const STORE_NAME = 'thumbnails'
const DB_VERSION = 1
const MAX_ENTRIES = 100

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function makeKey(name: string, size: number): string {
  return `${name}__${size}`
}

async function getCount(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function deleteOldestEntry(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        cursor.delete()
        resolve()
      } else {
        resolve()
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export const previewCache = {
  async get(name: string, size: number): Promise<string | null> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(makeKey(name, size))
      req.onsuccess = () => {
        const blob: Blob | undefined = req.result
        resolve(blob ? URL.createObjectURL(blob) : null)
      }
      req.onerror = () => reject(req.error)
    })
  },

  async set(name: string, size: number, blob: Blob): Promise<void> {
    const db = await openDB()
    const count = await getCount(db)
    if (count >= MAX_ENTRIES) {
      await deleteOldestEntry(db)
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).put(blob, makeKey(name, size))
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  },
}
