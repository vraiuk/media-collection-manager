const DB_NAME = 'media-previews'
const STORE_NAME = 'thumbnails'
const DB_VERSION = 1
const MAX_ENTRIES = 100

// Singleton DB connection — avoids leaking a handle per operation and
// prevents blocking version upgrades from un-closed connections.
let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE_NAME)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => { dbPromise = null; reject(req.error) }
    })
  }
  return dbPromise
}

function makeKey(name: string, size: number): string {
  return `${name}__${size}`
}

// URL registry: maps cache key → blob URL so the same URL is returned on
// repeated get() calls, preventing unbounded URL creation for the same entry.
const urlRegistry = new Map<string, string>()

export const previewCache = {
  async get(name: string, size: number): Promise<string | null> {
    const key = makeKey(name, size)
    const cached = urlRegistry.get(key)
    if (cached) return cached

    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => {
        const blob: Blob | undefined = req.result
        if (!blob) { resolve(null); return }
        const url = URL.createObjectURL(blob)
        urlRegistry.set(key, url)
        resolve(url)
      }
      req.onerror = () => reject(req.error)
    })
  },

  async set(name: string, size: number, blob: Blob): Promise<void> {
    const key = makeKey(name, size)
    const db = await openDB()

    // Perform count check, optional eviction, and put in a single readwrite
    // transaction to prevent concurrent callers from exceeding MAX_ENTRIES.
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      const countReq = store.count()
      countReq.onsuccess = () => {
        const count: number = countReq.result
        if (count >= MAX_ENTRIES) {
          // Delete first cursor entry (oldest by insertion order in key space)
          const cursorReq = store.openCursor()
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result
            if (cursor) {
              const evictedKey = cursor.key as string
              urlRegistry.delete(evictedKey)
              cursor.delete()
            }
            store.put(blob, key).onsuccess = () => resolve()
          }
          cursorReq.onerror = () => reject(cursorReq.error)
        } else {
          store.put(blob, key).onsuccess = () => resolve()
        }
      }
      countReq.onerror = () => reject(countReq.error)
      tx.onerror = () => reject(tx.error)
    })
  },
}
