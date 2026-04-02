import { previewCache } from '@features/preview-cache/previewCache'
import { renderThumbBlob } from './renderThumbBlob'

export interface CancelToken {
  cancelled: boolean
}

export async function generateImageThumb(
  file: File,
  token: CancelToken,
): Promise<string> {
  const cached = await previewCache.get(file.name, file.size).catch(() => null)
  if (cached) return cached

  if (token.cancelled) return ''

  const bitmap = await createImageBitmap(file)

  try {
    if (token.cancelled) return ''

    const blob = await renderThumbBlob(bitmap, bitmap.width, bitmap.height)

    if (token.cancelled) return ''

    const url = URL.createObjectURL(blob)
    previewCache.set(file.name, file.size, blob).catch(() => {})
    return url
  } finally {
    bitmap.close()
  }
}
