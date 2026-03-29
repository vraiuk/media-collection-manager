import { previewCache } from '@features/preview-cache/previewCache'
import type { CancelToken } from './generateImageThumb'

const THUMB_SIZE = 200

export async function generateVideoThumb(
  file: File,
  token: CancelToken,
): Promise<string> {
  if (token.cancelled) return ''

  const cached = await previewCache.get(file.name, file.size).catch(() => null)
  if (cached) return cached

  const videoSrcUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.style.display = 'none'
  video.muted = true
  video.playsInline = true
  document.body.appendChild(video)

  try {
    await new Promise<void>((resolve, reject) => {
      video.addEventListener('loadeddata', () => resolve(), { once: true })
      video.addEventListener('error', () => reject(new Error('Video load error')), { once: true })
      video.src = videoSrcUrl
      video.load()
    })

    if (token.cancelled) return ''

    video.currentTime = 0
    await new Promise<void>((resolve) => {
      video.addEventListener('seeked', () => resolve(), { once: true })
    })

    if (token.cancelled) return ''

    const canvas = document.createElement('canvas')
    canvas.width = THUMB_SIZE
    canvas.height = THUMB_SIZE
    const ctx = canvas.getContext('2d')!

    const scale = Math.min(THUMB_SIZE / (video.videoWidth || THUMB_SIZE), THUMB_SIZE / (video.videoHeight || THUMB_SIZE))
    const w = (video.videoWidth || THUMB_SIZE) * scale
    const h = (video.videoHeight || THUMB_SIZE) * scale
    ctx.drawImage(video, (THUMB_SIZE - w) / 2, (THUMB_SIZE - h) / 2, w, h)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8))
    if (!blob || token.cancelled) return ''

    const thumbUrl = URL.createObjectURL(blob)
    previewCache.set(file.name, file.size, blob).catch(() => {})
    return thumbUrl
  } finally {
    URL.revokeObjectURL(videoSrcUrl)
    video.src = ''
    video.remove()
  }
}
