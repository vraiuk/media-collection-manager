import { useRef, useState, useCallback } from 'react'
import { useUpload } from '@features/upload/hooks/useUpload'
import { Button } from '@shared/ui/Button'
import type { ValidationError } from '@features/upload/components/FileValidation'

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const { handleFiles } = useUpload()

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const validationErrors = await handleFiles(Array.from(files))
      setErrors(validationErrors)
    },
    [handleFiles],
  )

  return (
    <div className="mb-6 space-y-3">
      <div
        data-testid="upload-zone"
        onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          void processFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-border/80'
        }`}
      >
        <p className="text-text-muted mb-3">Drop files here or</p>
        <Button onClick={() => inputRef.current?.click()}>Choose files</Button>
        <p className="text-xs text-text-muted mt-2">JPEG, PNG, WebP, MP4 · Max 10MB · Up to 5 files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4"
          className="hidden"
          onChange={(e) => void processFiles(e.target.files)}
        />
      </div>

      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-sm text-error">
              <strong>{err.file.name}:</strong> {err.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
