export interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  size: number
  createdAt: string
  previewUrl?: string
}
