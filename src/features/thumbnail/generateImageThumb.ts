import { previewCache } from '@features/preview-cache/previewCache'

const THUMB_SIZE = 200

export interface CancelToken {
  cancelled: boolean
}

export async function generateImageThumb(
  file: File,
  token: CancelToken,
): Promise<string> {
  // Cache check (will be wired in Task 12; for now always miss)
  const cached = await previewCache.get(file.name, file.size).catch(() => null)
  if (cached) return cached

  if (token.cancelled) return ''

  const bitmap = await createImageBitmap(file)

  try {
    if (token.cancelled) return ''

    const canvas = new OffscreenCanvas(THUMB_SIZE, THUMB_SIZE)
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D

    // Contain-fit scaling
    const scale = Math.min(THUMB_SIZE / bitmap.width, THUMB_SIZE / bitmap.height)
    const w = bitmap.width * scale
    const h = bitmap.height * scale
    const x = (THUMB_SIZE - w) / 2
    const y = (THUMB_SIZE - h) / 2

    ctx.drawImage(bitmap, x, y, w, h)

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 })

    if (token.cancelled) return ''

    const url = URL.createObjectURL(blob)
    previewCache.set(file.name, file.size, blob).catch(() => {}) // best-effort cache
    return url
  } finally {
    bitmap.close()
  }
}
