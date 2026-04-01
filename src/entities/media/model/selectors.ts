import { createSelector } from '@reduxjs/toolkit'
import { mediaAdapter } from './mediaSlice'
import { uploadsAdapter } from './uploadsSlice'
import type { RootState } from '@app/store'

const mediaSelectors = mediaAdapter.getSelectors((state: RootState) => state.media)
const uploadsSelectors = uploadsAdapter.getSelectors((state: RootState) => state.uploads)

// Step 1: all items as array
const selectAllItems = mediaSelectors.selectAll

// Step 2: filter by type (recomputes only when items or filterType changes)
const selectFilteredByType = createSelector(
  [selectAllItems, (state: RootState) => state.ui.filterType],
  (items, filterType) =>
    filterType === 'all' ? items : items.filter((i) => i.type === filterType),
)

// Step 3: sort (recomputes only when filtered list or sortBy changes)
const selectFilteredSorted = createSelector(
  [selectFilteredByType, (state: RootState) => state.ui.sortBy],
  (items, sortBy) =>
    [...items].sort((a, b) =>
      sortBy === 'date'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : b.size - a.size,
    ),
)

// Step 4: search (recomputes only when sorted list or searchQuery changes)
export const selectVisibleItems = createSelector(
  [selectFilteredSorted, (state: RootState) => state.ui.searchQuery],
  (items, query) => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items
  },
)

export const selectHasMore = (state: RootState) => state.media.pagination.hasMore
export const selectLoadState = (state: RootState) => state.media.pagination.loadState
export const selectNextPage = (state: RootState) => state.media.pagination.nextPage
export const selectUploadJobs = uploadsSelectors.selectAll
export const selectUploadById = uploadsSelectors.selectById
