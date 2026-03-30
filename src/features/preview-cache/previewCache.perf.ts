// @vitest-environment node
// fake-indexeddb/auto + jsdom has a Blob round-trip bug (same as previewCache.test.ts)

import { bench, describe, beforeAll } from 'vitest'
import 'fake-indexeddb/auto'
import { previewCache } from './previewCache'

describe('previewCache benchmarks', () => {
  const blob = new Blob([new ArrayBuffer(5000)], { type: 'image/webp' })

  beforeAll(async () => {
    await previewCache.set('bench.jpg', 5000, blob)
  })

  bench('cache hit', async () => {
    await previewCache.get('bench.jpg', 5000)
  })

  bench('cache miss', async () => {
    await previewCache.get(`miss-${Math.random()}.jpg`, 5000)
  })
})
