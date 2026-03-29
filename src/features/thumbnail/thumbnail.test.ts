import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateImageThumb } from './generateImageThumb'

// Mock OffscreenCanvas
class MockOffscreenCanvas {
  getContext() {
    return {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
    }
  }
  async convertToBlob() {
    return new Blob(['fake-image'], { type: 'image/webp' })
  }
}
vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas)

// Mock createImageBitmap — must be vi.fn() to support mockResolvedValueOnce
vi.stubGlobal('createImageBitmap', vi.fn(async () => ({
  width: 400, height: 300, close: vi.fn(),
})))

// Mock URL methods
const createdUrls: string[] = []
vi.stubGlobal('URL', {
  createObjectURL: (b: Blob) => { const u = `blob:fake-${Date.now()}`; createdUrls.push(u); return u },
  revokeObjectURL: (u: string) => { const i = createdUrls.indexOf(u); if (i >= 0) createdUrls.splice(i, 1) },
})

describe('generateImageThumb', () => {
  afterEach(() => { createdUrls.length = 0 })

  it('returns a blob URL on success', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const token = { cancelled: false }
    const url = await generateImageThumb(file, token)
    expect(url).toMatch(/^blob:/)
  })

  it('closes ImageBitmap after drawing', async () => {
    const mockBitmap = { width: 400, height: 300, close: vi.fn() }
    vi.mocked(createImageBitmap).mockResolvedValueOnce(mockBitmap as any)
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    await generateImageThumb(file, { cancelled: false })
    expect(mockBitmap.close).toHaveBeenCalled()
  })

  it('returns empty string and revokes URL when cancelled before generation', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const token = { cancelled: true }
    const url = await generateImageThumb(file, token)
    expect(url).toBe('')
    expect(createdUrls).toHaveLength(0)
  })

  it('revokes URL and returns empty string when cancelled after bitmap creation', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const token = { cancelled: false }
    vi.mocked(createImageBitmap).mockImplementationOnce(async () => {
      token.cancelled = true
      return { width: 100, height: 100, close: vi.fn() }
    })
    const url = await generateImageThumb(file, token)
    expect(url).toBe('')
    expect(createdUrls).toHaveLength(0)
  })
})
