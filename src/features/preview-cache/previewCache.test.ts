// @vitest-environment node
// fake-indexeddb/auto + jsdom has a Blob round-trip bug; node env works correctly.

import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { previewCache } from './previewCache'

// Reset fake-indexeddb and the module-level connection/URL state between tests.
// Without this, IDB state (and the singleton dbPromise) bleeds across tests.
beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  // Reset the module singleton so the next openDB() gets a fresh connection
  const mod = await import('./previewCache')
  // The singleton is module-internal; we reset by forcing a re-import via cache bust.
  // Instead, we isolate tests by using unique keys per test (simpler approach).
})

describe('previewCache', () => {
  it('returns null on cache miss', async () => {
    const result = await previewCache.get('miss-test.jpg', 9999)
    expect(result).toBeNull()
  })

  it('stores and retrieves a blob', async () => {
    const blob = new Blob(['data'], { type: 'image/webp' })
    await previewCache.set('store-test.jpg', 1024, blob)
    const url = await previewCache.get('store-test.jpg', 1024)
    expect(url).toMatch(/^blob:/)
  })

  it('uses fileName + fileSize as cache key', async () => {
    const blob = new Blob(['x'], { type: 'image/webp' })
    await previewCache.set('key-test.jpg', 100, blob)
    expect(await previewCache.get('key-test.jpg', 200)).toBeNull()  // different size
    expect(await previewCache.get('key-test-b.jpg', 100)).toBeNull()  // different name
    expect(await previewCache.get('key-test.jpg', 100)).not.toBeNull()
  })
})
