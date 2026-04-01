import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { selectVisibleItems, selectLoadState, selectHasMore, removeItem, removeUploadJob } from '@entities/media'
import { selectUploadById } from '@entities/media'
import { store } from '@app/store'
import { MediaCard } from '@features/gallery/components/MediaCard'
import { useInfiniteScroll } from '@features/gallery/hooks/useInfiniteScroll'
import { useFilterControls } from '@features/gallery/hooks/useFilterControls'
import { Spinner } from '@shared/ui/Spinner'
import { Button } from '@shared/ui/Button'
import { loadNextPage } from '@entities/media'
import type { FilterType, SortBy } from '@entities/media'
import { thumbnailRuntime } from '@features/thumbnail/thumbnailRuntime'
import { uploadRuntime } from '@features/upload/uploadRuntime'

export function MediaGallery() {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectVisibleItems)
  const loadState = useAppSelector(selectLoadState)
  const hasMore = useAppSelector(selectHasMore)
  const sentinelRef = useInfiniteScroll()
  const { inputValue, onInputChange, filterType, sortBy, setFilter, setSort } = useFilterControls()

  const handleCancel = useCallback((id: string) => {
    uploadRuntime.abort(id)
  }, [])

  const handleRemove = useCallback((id: string) => {
    // Read previewUrl BEFORE removing from state
    const item = store.getState().media.entities[id]
    thumbnailRuntime.cancel(id)
    uploadRuntime.abort(id)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    uploadRuntime.cleanup(id)
    thumbnailRuntime.cleanup(id)
    dispatch(removeItem(id))
    dispatch(removeUploadJob(id))
  }, [dispatch])

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Image', value: 'image' },
    { label: 'Video', value: 'video' },
    { label: 'Document', value: 'document' },
  ]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {filterButtons.map(({ label, value }) => (
            <Button
              key={value}
              size="sm"
              variant={filterType === value ? 'primary' : 'ghost'}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSort(e.target.value as SortBy)}
          className="bg-surface border border-border text-text-primary rounded-md px-3 py-1 text-sm"
        >
          <option value="date">Date (newest)</option>
          <option value="size">Size (largest)</option>
        </select>

        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Search..."
          className="bg-surface border border-border text-text-primary placeholder-text-muted rounded-md px-3 py-1 text-sm flex-1 min-w-40"
        />
      </div>

      {/* Grid */}
      <div data-testid="media-gallery-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onRemove={handleRemove} onCancel={handleCancel} />
        ))}
      </div>

      {/* Sentinel + states — fixed height to prevent layout shift */}
      <div className="h-16 flex items-center justify-center">
        {loadState.status === 'loading' && <Spinner />}

        {loadState.status === 'error' && (
          <div className="flex items-center gap-3">
            <span className="text-error text-sm">Failed to load items</span>
            <Button size="sm" variant="danger" onClick={() => dispatch(loadNextPage())}>
              Retry
            </Button>
          </div>
        )}

        {!hasMore && loadState.status !== 'loading' && (
          <p className="text-text-muted text-sm">You've seen it all</p>
        )}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  )
}

// Separate component to read upload job from store per item
function ItemCard({ item, onRemove, onCancel }: { item: ReturnType<typeof selectVisibleItems>[number]; onRemove: (id: string) => void; onCancel: (id: string) => void }) {
  const uploadJob = useAppSelector((state) => selectUploadById(state, item.id))
  return <MediaCard item={item} onRemove={onRemove} onCancel={onCancel} uploadJob={uploadJob} />
}
