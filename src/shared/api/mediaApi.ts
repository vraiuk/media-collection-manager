import type { MediaItem } from '@entities/media/model/types'
import { MOCK_DATA } from './mockData'

const PAGE_SIZE = 12
const FAILURE_RATE_FETCH = 0.15
const FAILURE_RATE_UPLOAD = 0.20
const LATENCY_MIN = 500
const LATENCY_MAX = 1000

function randomDelay(): Promise<void> {
  const ms = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface PageResponse {
  items: MediaItem[]
  nextPage: number | null
  total: number
}

export async function fetchMediaPage(page: number): Promise<PageResponse> {
  await randomDelay()
  if (Math.random() < FAILURE_RATE_FETCH) {
    throw new Error('Server error')
  }
  const start = (page - 1) * PAGE_SIZE
  const items = MOCK_DATA.slice(start, start + PAGE_SIZE)
  const nextPage = start + PAGE_SIZE < MOCK_DATA.length ? page + 1 : null
  return { items, nextPage, total: MOCK_DATA.length }
}

export async function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<{ url: string }> {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  return new Promise((resolve, reject) => {
    let tick = 0
    const totalTicks = 10

    const abortHandler = () => {
      clearInterval(interval)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', abortHandler, { once: true })

    const interval = setInterval(() => {
      if (signal.aborted) return
      tick++
      const percent = Math.min(Math.round((tick / totalTicks) * 100), 100)
      onProgress(percent)

      if (tick >= totalTicks) {
        clearInterval(interval)
        // Listener auto-removes due to { once: true } on registration
        if (Math.random() < FAILURE_RATE_UPLOAD) {
          reject(new Error('Upload failed'))
        } else {
          resolve({ url: `mock://uploads/${file.name}-${Date.now()}` })
        }
      }
    }, 100)
  })
}
