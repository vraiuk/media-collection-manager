import { createEntityAdapter, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchMediaPage } from '@shared/api/mediaApi'
import type { GalleryItem, PageLoadState } from './types'
import type { RootState } from '@app/store'

export const mediaAdapter = createEntityAdapter<GalleryItem>()

interface PaginationState {
  nextPage: number | null
  hasMore: boolean
  total: number
  loadState: PageLoadState
}

const initialPagination: PaginationState = {
  nextPage: 1,
  hasMore: true,
  total: 0,
  loadState: { status: 'idle' },
}

const initialState = mediaAdapter.getInitialState({ pagination: initialPagination })

export const loadNextPage = createAsyncThunk(
  'media/loadNextPage',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const { pagination } = state.media
    if (pagination.loadState.status === 'loading' || !pagination.hasMore) {
      return rejectWithValue('skip')
    }
    const page = pagination.nextPage ?? 1
    return fetchMediaPage(page)
  },
)

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    addItem: mediaAdapter.addOne,
    updateItem: mediaAdapter.updateOne,
    removeItem: mediaAdapter.removeOne,
    upsertItem: mediaAdapter.upsertOne,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNextPage.pending, (state) => {
        const page = state.pagination.nextPage ?? 1
        state.pagination.loadState = { status: 'loading', page }
      })
      .addCase(loadNextPage.fulfilled, (state, action) => {
        if (!action.payload) return
        const { items, nextPage, total } = action.payload
        mediaAdapter.upsertMany(
          state,
          items.map((i) => ({ ...i, source: 'remote' as const })),
        )
        state.pagination.nextPage = nextPage
        state.pagination.hasMore = nextPage !== null
        state.pagination.total = total
        state.pagination.loadState = { status: 'success' }
      })
      .addCase(loadNextPage.rejected, (state, action) => {
        if (action.payload === 'skip') return
        const page = state.pagination.nextPage ?? 1
        state.pagination.loadState = {
          status: 'error',
          error: action.error.message ?? 'Unknown error',
          page,
        }
      })
  },
})

export const { addItem, updateItem, removeItem, upsertItem } = mediaSlice.actions
export default mediaSlice.reducer
