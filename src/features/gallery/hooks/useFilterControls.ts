import { useState, useCallback, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { setFilterType, setSortBy, setSearchQuery } from '@entities/media'
import { debounce } from '@shared/lib/debounce'
import type { FilterType, SortBy } from '@entities/media'

export function useFilterControls() {
  const dispatch = useAppDispatch()
  const filterType = useAppSelector((s) => s.ui.filterType)
  const sortBy = useAppSelector((s) => s.ui.sortBy)
  const [inputValue, setInputValue] = useState('')

  // Stable debounced function — created once, not recreated when dispatch changes.
  const debouncedDispatch = useRef(
    debounce((q: string) => dispatch(setSearchQuery(q)), 300),
  ).current

  const onInputChange = useCallback((value: string) => {
    setInputValue(value)
    debouncedDispatch(value)
  }, [])

  const setFilter = useCallback((type: FilterType) => dispatch(setFilterType(type)), [dispatch])
  const setSort = useCallback((by: SortBy) => dispatch(setSortBy(by)), [dispatch])

  return { inputValue, onInputChange, filterType, sortBy, setFilter, setSort }
}
