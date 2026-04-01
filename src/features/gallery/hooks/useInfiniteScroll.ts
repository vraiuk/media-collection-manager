import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { loadNextPage } from '@entities/media'
import { selectLoadState, selectHasMore } from '@entities/media'

const RETRY_DELAY_MS = 2000

export function useInfiniteScroll() {
  const dispatch = useAppDispatch()
  const loadState = useAppSelector(selectLoadState)
  const hasMore = useAppSelector(selectHasMore)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadStateRef = useRef(loadState)
  const hasMoreRef = useRef(hasMore)
  loadStateRef.current = loadState
  hasMoreRef.current = hasMore

  // Observer triggers load when sentinel scrolls into viewport
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        if (loadStateRef.current.status === 'loading' || loadStateRef.current.status === 'error' || !hasMoreRef.current) return
        void dispatch(loadNextPage())
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [dispatch])

  // After each successful load, keep loading if sentinel is still visible
  useEffect(() => {
    if (loadState.status !== 'success' || !hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const rect = sentinel.getBoundingClientRect()
    if (rect.top <= window.innerHeight + 200) {
      void dispatch(loadNextPage())
    }
  }, [dispatch, loadState.status, hasMore])

  // Auto-retry after delay when a page load fails
  useEffect(() => {
    if (loadState.status !== 'error' || !hasMore) return
    const timer = setTimeout(() => void dispatch(loadNextPage()), RETRY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [dispatch, loadState.status, hasMore])

  return sentinelRef
}
