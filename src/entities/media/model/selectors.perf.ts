import { bench, describe } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import mediaReducer, { mediaAdapter } from './mediaSlice'
import uiReducer from './uiSlice'
import uploadsReducer from './uploadsSlice'
import { selectVisibleItems } from './selectors'
import type { GalleryItem } from './types'

function makeItems(n: number): GalleryItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `item-${i}`, name: `file-${i % 15}.jpg`, type: ['image', 'video', 'document'][i % 3] as GalleryItem['type'],
    size: (i + 1) * 10000, createdAt: new Date(2025, 0, i + 1).toISOString(),
    source: 'remote' as const,
  }))
}

const items = makeItems(60)

const store = configureStore({
  reducer: { media: mediaReducer, ui: uiReducer, uploads: uploadsReducer },
  preloadedState: {
    media: {
      ...mediaAdapter.setAll(mediaAdapter.getInitialState(), items),
      pagination: { nextPage: null, hasMore: false, total: 60, loadState: { status: 'idle' as const } },
    },
    ui: { filterType: 'all' as const, sortBy: 'date' as const, searchQuery: '' },
    uploads: { ids: [], entities: {} },
  },
})

describe('selectVisibleItems benchmarks', () => {
  bench('no filter (60 items)', () => {
    selectVisibleItems(store.getState())
  })

  bench('filter by image', () => {
    selectVisibleItems({ ...store.getState(), ui: { ...store.getState().ui, filterType: 'image' } })
  })

  bench('filter + sort by size', () => {
    selectVisibleItems({ ...store.getState(), ui: { ...store.getState().ui, filterType: 'image', sortBy: 'size' } })
  })

  bench('filter + sort + search', () => {
    selectVisibleItems({ ...store.getState(), ui: { ...store.getState().ui, filterType: 'all', sortBy: 'date', searchQuery: 'file-5' } })
  })
})
