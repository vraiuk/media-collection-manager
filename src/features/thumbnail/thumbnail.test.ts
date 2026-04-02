import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderThumbBlob } from './renderThumbBlob'
import { generateImageThumb } from './generateImageThumb'
import { generateVideoThumb } from './generateVideoThumb'

// Mock OffscreenCanvas — expose convertToBlob as a spy for per-test overrides
const mockConvertToBlob = vi.fn(async () => new Blob(['fake-image'], { type: 'image/webp' }))

class MockOffscreenCanvas {
  getContext() {
    return {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
    }
  }
  convertToBlob = mockConvertToBlob
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

describe('renderThumbBlob', () => {
  afterEach(() => {
    mockConvertToBlob.mockClear()
  })

  it('returns a webp blob from a CanvasImageSource', async () => {
    const source = { width: 400, height: 300 } as unknown as ImageBitmap
    const blob = await renderThumbBlob(source, 400, 300)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/webp')
  })

  it('calls drawImage on the canvas context', async () => {
    const drawImage = vi.fn()
    const origGetContext = MockOffscreenCanvas.prototype.getContext
    MockOffscreenCanvas.prototype.getContext = () => ({ drawImage, fillRect: vi.fn() })
    const source = { width: 200, height: 200 } as unknown as ImageBitmap
    await renderThumbBlob(source, 200, 200)
    expect(drawImage).toHaveBeenCalledOnce()
    MockOffscreenCanvas.prototype.getContext = origGetContext
  })
})

describe('generateImageThumb', () => {
  afterEach(() => {
    createdUrls.length = 0
    vi.mocked(createImageBitmap).mockClear()
    mockConvertToBlob.mockClear()
  })

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

  it('returns empty string (no URL created) when cancelled before bitmap creation', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const token = { cancelled: true }
    const url = await generateImageThumb(file, token)
    expect(url).toBe('')
    expect(createdUrls).toHaveLength(0)
  })

  it('returns empty string when cancelled after bitmap resolves', async () => {
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

  it('returns empty string (no URL created) when cancelled after convertToBlob resolves', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const token = { cancelled: false }
    mockConvertToBlob.mockImplementationOnce(async () => {
      token.cancelled = true
      return new Blob(['fake-image'], { type: 'image/webp' })
    })
    const url = await generateImageThumb(file, token)
    expect(url).toBe('')
    expect(createdUrls).toHaveLength(0)
  })
})

describe('generateVideoThumb', () => {
  it('returns a blob URL on success', async () => {
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })
    const token = { cancelled: false }
    // generateVideoThumb creates a video element — mock HTMLVideoElement
    const mockVideo = {
      src: '',
      currentTime: 0,
      remove: vi.fn(),
      muted: false,
      playsInline: false,
      videoWidth: 640,
      videoHeight: 480,
      style: { display: '' },
      load: vi.fn(),
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'loadeddata' || event === 'seeked') setTimeout(cb, 0)
      }),
      removeEventListener: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockVideo as any)
    vi.spyOn(document.body, 'appendChild').mockImplementationOnce(() => mockVideo as any)

    const url = await generateVideoThumb(file, token)
    expect(url).toMatch(/^blob:/)
    expect(mockVideo.remove).toHaveBeenCalled()
  })

  it('returns empty string and cleans up when cancelled', async () => {
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })
    const token = { cancelled: true }
    const url = await generateVideoThumb(file, token)
    expect(url).toBe('')
  })
})
