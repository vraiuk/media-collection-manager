import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FilterType, SortBy } from './types'

interface UiState {
  filterType: FilterType
  sortBy: SortBy
  searchQuery: string
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { filterType: 'all', sortBy: 'date', searchQuery: '' } as UiState,
  reducers: {
    setFilterType: (state, action: PayloadAction<FilterType>) => {
      state.filterType = action.payload
    },
    setSortBy: (state, action: PayloadAction<SortBy>) => {
      state.sortBy = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
  },
})

export const { setFilterType, setSortBy, setSearchQuery } = uiSlice.actions
export default uiSlice.reducer
