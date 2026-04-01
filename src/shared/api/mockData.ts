import type { MediaItem } from '@entities/media/model/types'

const NAMES = [
  'vacation-photo', 'team-meeting', 'product-demo', 'landscape', 'portrait',
  'conference-recording', 'tutorial-video', 'project-brief', 'design-spec',
  'contract', 'invoice', 'screenshot', 'avatar', 'banner', 'logo',
]

function makeItem(index: number): MediaItem {
  const types: MediaItem['type'][] = ['image', 'image', 'image', 'image', 'image', 'video', 'video', 'video', 'document', 'document', 'document', 'document']
  const type = types[index % types.length]!
  const name = `${NAMES[index % NAMES.length]!}-${index + 1}.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'pdf'}`
  const sizes: Record<MediaItem['type'], number[]> = {
    image: [102400, 512000, 1048576, 2097152, 3145728],
    video: [10485760, 20971520, 52428800],
    document: [51200, 204800, 1048576],
  }
  const sizeList = sizes[type]
  const size = sizeList[index % sizeList.length]!

  const date = new Date('2025-01-01')
  date.setDate(date.getDate() + index * 3)

  return {
    id: `mock-${index + 1}`,
    name,
    type,
    size,
    createdAt: date.toISOString(),
  }
}

// Reversed so page 1 returns the newest items — natural infinite scroll order
export const MOCK_DATA: MediaItem[] = Array.from({ length: 60 }, (_, i) => makeItem(59 - i))
