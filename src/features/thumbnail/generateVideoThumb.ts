import { previewCache } from '@features/preview-cache/previewCache'
import { renderThumbBlob } from './renderThumbBlob'
import type { CancelToken } from './generateImageThumb'

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

    video.currentTime = 0.001
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Seek timeout')), 5000)
      const cleanup = () => clearTimeout(timeout)
      video.addEventListener('seeked', () => { cleanup(); resolve() }, { once: true })
      video.addEventListener('error', () => { cleanup(); reject(new Error('Seek error')) }, { once: true })
    })

    if (token.cancelled) return ''

    const blob = await renderThumbBlob(video, video.videoWidth || 200, video.videoHeight || 200)

    if (token.cancelled) return ''

    const thumbUrl = URL.createObjectURL(blob)
    previewCache.set(file.name, file.size, blob).catch(() => {})
    return thumbUrl
  } finally {
    URL.revokeObjectURL(videoSrcUrl)
    video.src = ''
    video.remove()
  }
}
