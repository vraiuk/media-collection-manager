import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import mediaReducer, { mediaAdapter } from '@entities/media/model/mediaSlice'
import uploadsReducer from '@entities/media/model/uploadsSlice'
import uiReducer from '@entities/media/model/uiSlice'
import { MediaGallery } from './index'
import type { GalleryItem } from '@entities/media'

// Mock IntersectionObserver (not available in jsdom)
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
vi.stubGlobal('IntersectionObserver', class {
  observe = mockObserve
  disconnect = mockDisconnect
  constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
})

const item1: GalleryItem = {
  id: '1', name: 'cat.jpg', type: 'image', size: 1024,
  createdAt: '2025-06-01T00:00:00Z', source: 'remote',
}
const item2: GalleryItem = {
  id: '2', name: 'dog.mp4', type: 'video', size: 2048,
  createdAt: '2025-01-01T00:00:00Z', source: 'remote',
}

function makeStore(items: GalleryItem[] = [item1, item2]) {
  return configureStore({
    reducer: { media: mediaReducer, uploads: uploadsReducer, ui: uiReducer },
    preloadedState: {
      media: {
        ...mediaAdapter.setAll(mediaAdapter.getInitialState(), items),
        pagination: { nextPage: null, hasMore: false, total: items.length, loadState: { status: 'idle' as const } },
      },
      ui: { filterType: 'all' as const, sortBy: 'date' as const, searchQuery: '' },
      uploads: { ids: [], entities: {} },
    },
  })
}

describe('MediaGallery', () => {
  it('renders all items', () => {
    render(<Provider store={makeStore()}><MediaGallery /></Provider>)
    expect(screen.getByText('cat.jpg')).toBeInTheDocument()
    expect(screen.getByText('dog.mp4')).toBeInTheDocument()
  })

  it('removes item on x button click', () => {
    const store = makeStore()
    render(<Provider store={store}><MediaGallery /></Provider>)
    fireEvent.click(screen.getByLabelText('Remove cat.jpg'))
    const state = store.getState()
    expect(state.media.ids).not.toContain('1')
  })

  it('filters by type', () => {
    render(<Provider store={makeStore()}><MediaGallery /></Provider>)
    fireEvent.click(screen.getByRole('button', { name: 'Video' }))
    expect(screen.queryByText('cat.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('dog.mp4')).toBeInTheDocument()
  })

  it('searches by name', async () => {
    vi.useFakeTimers()
    render(<Provider store={makeStore()}><MediaGallery /></Provider>)
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'cat' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByText('dog.mp4')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows end-of-list message when hasMore is false', () => {
    render(<Provider store={makeStore()}><MediaGallery /></Provider>)
    expect(screen.getByText("You've seen it all")).toBeInTheDocument()
  })
})
