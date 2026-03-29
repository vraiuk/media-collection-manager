import type { AppDispatch } from '@app/store'
import { updateItem } from '@entities/media'
import { generateImageThumb } from './generateImageThumb'
import type { CancelToken } from './generateImageThumb'

const tokens = new Map<string, CancelToken>()

// Semaphore for video thumbnail concurrency (max 2)
let activeVideoThumbs = 0
const VIDEO_CONCURRENCY_LIMIT = 2
const videoQueue: Array<() => void> = []

function acquireVideoSlot(): Promise<void> {
  if (activeVideoThumbs < VIDEO_CONCURRENCY_LIMIT) {
    activeVideoThumbs++
    return Promise.resolve()
  }
  return new Promise((resolve) => videoQueue.push(() => { activeVideoThumbs++; resolve() }))
}

function releaseVideoSlot() {
  activeVideoThumbs--
  const next = videoQueue.shift()
  if (next) next()
}

export const thumbnailRuntime = {
  generate(id: string, file: File, dispatch: AppDispatch): void {
    const token: CancelToken = { cancelled: false }
    tokens.set(id, token)

    const run = async () => {
      let url = ''
      if (file.type.startsWith('video/')) {
        await acquireVideoSlot()
        try {
          const { generateVideoThumb } = await import('./generateVideoThumb')
          url = await generateVideoThumb(file, token)
        } finally {
          releaseVideoSlot()
        }
      } else {
        url = await generateImageThumb(file, token)
      }

      if (token.cancelled) {
        if (url) URL.revokeObjectURL(url)
        return
      }

      if (url) {
        dispatch(updateItem({ id, changes: { previewUrl: url } }))
      }
    }

    run().catch(() => {})
  },

  cancel(id: string): void {
    const token = tokens.get(id)
    if (token) token.cancelled = true
  },

  cleanup(id: string): void {
    tokens.delete(id)
  },
}
