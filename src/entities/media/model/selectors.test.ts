import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import mediaReducer, { mediaAdapter } from './mediaSlice'
import uiReducer from './uiSlice'
import uploadsReducer from './uploadsSlice'
import { selectVisibleItems, selectHasMore, selectLoadState } from './selectors'
import type { GalleryItem } from './types'

function makeItem(overrides: Partial<GalleryItem> = {}): GalleryItem {
  return {
    id: 'item-1',
    name: 'photo.jpg',
    type: 'image',
    size: 1024,
    createdAt: '2025-01-01T00:00:00Z',
    source: 'remote',
    ...overrides,
  }
}

function makeStore(items: GalleryItem[], ui: Partial<{ filterType: GalleryItem['type'] | 'all'; sortBy: 'date' | 'size'; searchQuery: string }> = {}) {
  return configureStore({
    reducer: { media: mediaReducer, uploads: uploadsReducer, ui: uiReducer },
    preloadedState: {
      media: {
        ...mediaAdapter.setAll(mediaAdapter.getInitialState({ pagination: { nextPage: null, hasMore: false, total: 0, loadState: { status: 'idle' as const } } }), items),
        pagination: { nextPage: null, hasMore: false, total: items.length, loadState: { status: 'idle' as const } },
      },
      ui: { filterType: 'all' as const, sortBy: 'date' as const, searchQuery: '', ...ui },
      uploads: { ids: [], entities: {} },
    },
  })
}

describe('selectVisibleItems', () => {
  it('returns all items when filter is all', () => {
    const items = [makeItem({ id: '1', type: 'image' }), makeItem({ id: '2', type: 'video' })]
    expect(selectVisibleItems(makeStore(items).getState())).toHaveLength(2)
  })

  it('filters by type', () => {
    const items = [makeItem({ id: '1', type: 'image' }), makeItem({ id: '2', type: 'video' })]
    const result = selectVisibleItems(makeStore(items, { filterType: 'image' }).getState())
    expect(result).toHaveLength(1)
    expect(result[0]!.type).toBe('image')
  })

  it('sorts by date newest first', () => {
    const items = [
      makeItem({ id: '1', createdAt: '2025-01-01T00:00:00Z' }),
      makeItem({ id: '2', createdAt: '2025-06-01T00:00:00Z' }),
    ]
    const result = selectVisibleItems(makeStore(items, { sortBy: 'date' }).getState())
    expect(result[0]!.id).toBe('2')
  })

  it('sorts by size largest first', () => {
    const items = [makeItem({ id: '1', size: 500 }), makeItem({ id: '2', size: 2000 })]
    const result = selectVisibleItems(makeStore(items, { sortBy: 'size' }).getState())
    expect(result[0]!.id).toBe('2')
  })

  it('filters by search query (case-insensitive)', () => {
    const items = [makeItem({ id: '1', name: 'cat-photo.jpg' }), makeItem({ id: '2', name: 'dog-video.mp4' })]
    const result = selectVisibleItems(makeStore(items, { searchQuery: 'cat' }).getState())
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toContain('cat')
  })

  it('is memoized: same inputs return same reference', () => {
    const store = makeStore([makeItem()])
    const a = selectVisibleItems(store.getState())
    const b = selectVisibleItems(store.getState())
    expect(a).toBe(b)
  })
})

describe('selectHasMore', () => {
  it('returns pagination hasMore', () => {
    expect(selectHasMore(makeStore([]).getState())).toBe(false)
  })
})

describe('selectLoadState', () => {
  it('returns idle by default', () => {
    expect(selectLoadState(makeStore([]).getState()).status).toBe('idle')
  })
})
