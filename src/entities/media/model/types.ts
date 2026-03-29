export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export type PageLoadState =
  | { status: 'idle' }
  | { status: 'loading'; page: number }
  | { status: 'success' }
  | { status: 'error'; error: string; page: number }

export interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  size: number
  createdAt: string
  previewUrl?: string
}

export interface GalleryItem extends MediaItem {
  source: 'remote' | 'local'
  uploadStatus?: 'uploading' | 'done' | 'error' | 'cancelled'
}

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'cancelled'

export interface UploadJob {
  id: string
  fileName: string
  status: UploadStatus
  error?: string
  // NOTE: progress is intentionally absent — updated via DOM-direct ref, not Redux
}

export type FilterType = 'all' | 'image' | 'video' | 'document'
export type SortBy = 'date' | 'size'
