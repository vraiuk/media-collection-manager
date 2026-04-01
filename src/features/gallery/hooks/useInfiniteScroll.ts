import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { loadNextPage } from '@entities/media'
import { selectLoadState, selectHasMore } from '@entities/media'

export function useInfiniteScroll() {
  const dispatch = useAppDispatch()
  const loadState = useAppSelector(selectLoadState)
  const hasMore = useAppSelector(selectHasMore)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadStateRef = useRef(loadState)
  const hasMoreRef = useRef(hasMore)
  loadStateRef.current = loadState
  hasMoreRef.current = hasMore

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (loadStateRef.current.status === 'loading' || loadStateRef.current.status === 'error' || !hasMoreRef.current) return
        void dispatch(loadNextPage())
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [dispatch])

  return sentinelRef
}
