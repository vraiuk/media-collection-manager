import React, { memo } from 'react'
import { Badge } from '@shared/ui/Badge'
import { formatSize } from '@shared/lib/formatSize'
import type { GalleryItem } from '@entities/media'

interface Props {
  item: GalleryItem
  onRemove: (id: string) => void
  uploadJob?: { status: string; error?: string }
}

function typeVariant(type: GalleryItem['type']) {
  return type as 'image' | 'video' | 'document'
}

export const MediaCard = memo(function MediaCard({ item, onRemove, uploadJob }: Props) {
  return (
    <div data-testid="media-card" className="relative bg-surface border border-border rounded-lg overflow-hidden group">
      {/* Thumbnail */}
      <div className="w-full h-40 bg-bg flex items-center justify-center overflow-hidden">
        {item.previewUrl ? (
          <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl text-text-muted">
            {item.type === 'image' ? '🖼' : item.type === 'video' ? '🎬' : '📄'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm text-text-primary truncate" title={item.name}>{item.name}</p>
        <div className="flex items-center gap-2">
          <Badge label={item.type.toUpperCase()} variant={typeVariant(item.type)} />
          <span className="text-xs text-text-muted">{formatSize(item.size)}</span>
        </div>

        {/* Upload status */}
        {uploadJob && (
          <div className="mt-1">
            {uploadJob.status === 'uploading' && (
              <UploadProgressBar id={item.id} />
            )}
            {uploadJob.status === 'error' && (
              <Badge label="Upload failed" variant="error" />
            )}
            {uploadJob.status === 'cancelled' && (
              <Badge label="Cancelled" variant="default" />
            )}
            {uploadJob.status === 'done' && (
              <Badge label="Uploaded" variant="success" />
            )}
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-bg/80 text-text-muted hover:text-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${item.name}`}
      >
        ✕
      </button>
    </div>
  )
})

// Inline subcomponent — registers itself in uploadRuntime
function UploadProgressBar({ id }: { id: string }) {
  const barRef = React.useRef<HTMLDivElement>(null)
  const labelRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    // Imported lazily to avoid circular dep at module level
    import('@features/upload/uploadRuntime').then(({ registerProgress, unregisterProgress }) => {
      registerProgress(id, (pct) => {
        if (barRef.current) barRef.current.style.width = `${pct}%`
        if (labelRef.current) labelRef.current.textContent = `${pct}%`
      })
    })
    return () => {
      import('@features/upload/uploadRuntime').then(({ unregisterProgress }) => {
        unregisterProgress(id)
      })
    }
  }, [id])

  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
        <div ref={barRef} className="h-full bg-accent transition-none" style={{ width: '0%' }} />
      </div>
      <span ref={labelRef} className="text-xs text-text-muted">0%</span>
    </div>
  )
}
