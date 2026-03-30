import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchMediaPage, uploadFile } from './mediaApi'

describe('fetchMediaPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns 12 items for page 1', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // no failure (> 0.15)
    const result = await fetchMediaPage(1)
    expect(result.items).toHaveLength(12)
    expect(result.nextPage).toBe(2)
    expect(result.total).toBe(60)
  })

  it('returns null nextPage on last page', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = await fetchMediaPage(5)
    expect(result.nextPage).toBeNull()
    expect(result.items).toHaveLength(12)
  })

  it('throws on simulated failure', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05) // < 0.15 → failure
    await expect(fetchMediaPage(1)).rejects.toThrow('Server error')
  })
})

describe('uploadFile', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('calls onProgress and resolves with url', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // > 0.2 → success
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    const ctrl = new AbortController()
    const progress: number[] = []
    const promise = uploadFile(file, (p) => progress.push(p), ctrl.signal)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toEqual({ url: expect.stringContaining('mock://') })
    expect(progress.at(-1)).toBe(100)
    expect(progress[0]).toBeGreaterThanOrEqual(0)
  })

  it('rejects with AbortError when aborted', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    const ctrl = new AbortController()
    const promise = uploadFile(file, () => {}, ctrl.signal)
    ctrl.abort()
    await expect(promise).rejects.toSatisfy(
      (err) => err instanceof DOMException && err.name === 'AbortError',
    )
  })

  it('rejects on simulated server error', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05) // < 0.2 → failure
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    const ctrl = new AbortController()
    const promise = uploadFile(file, () => {}, ctrl.signal)
    // Attach rejection handler BEFORE advancing timers so the rejection is never unhandled.
    const assertion = expect(promise).rejects.toThrow('Upload failed')
    await vi.runAllTimersAsync()
    await assertion
  })
})
