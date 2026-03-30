// @vitest-environment node

import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { previewCache } from './previewCache'

describe('previewCache', () => {
  beforeEach(() => {
    // Reset IDB between tests by using fresh DB name
  })

  it('returns null on cache miss', async () => {
    const result = await previewCache.get('photo.jpg', 1024)
    expect(result).toBeNull()
  })

  it('stores and retrieves a blob', async () => {
    const blob = new Blob(['data'], { type: 'image/webp' })
    await previewCache.set('photo.jpg', 1024, blob)
    const url = await previewCache.get('photo.jpg', 1024)
    expect(url).toMatch(/^blob:/)
  })

  it('uses fileName + fileSize as cache key', async () => {
    const blob = new Blob(['x'], { type: 'image/webp' })
    await previewCache.set('a.jpg', 100, blob)
    expect(await previewCache.get('a.jpg', 200)).toBeNull()  // different size
    expect(await previewCache.get('b.jpg', 100)).toBeNull()  // different name
    expect(await previewCache.get('a.jpg', 100)).not.toBeNull()
  })
})
