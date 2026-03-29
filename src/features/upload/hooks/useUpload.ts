import { useCallback } from 'react'
import { useAppDispatch } from '@app/hooks'
import { addItem, addUploadJob, setUploadStatus, updateItem } from '@entities/media'
import { uploadFile } from '@shared/api/mediaApi'
import { validateFiles } from '../components/FileValidation'
import { uploadRuntime } from '../uploadRuntime'
import { thumbnailRuntime } from '@features/thumbnail/thumbnailRuntime'
import type { ValidationError } from '../components/FileValidation'

export function useUpload() {
  const dispatch = useAppDispatch()

  const handleFiles = useCallback(
    async (files: File[]): Promise<ValidationError[]> => {
      const { valid, errors } = validateFiles(files)

      const jobs = valid.map((file) => ({
        id: crypto.randomUUID(),
        file,
        ctrl: new AbortController(),
      }))

      // Register optimistic items + jobs
      for (const { id, file } of jobs) {
        const type = file.type.startsWith('video/') ? 'video' as const : 'image' as const
        dispatch(addItem({
          id, name: file.name, type, size: file.size,
          createdAt: new Date().toISOString(), source: 'local', uploadStatus: 'uploading',
        }))
        dispatch(addUploadJob({ id, fileName: file.name, status: 'uploading' }))
        thumbnailRuntime.generate(id, file, dispatch)
      }

      // Register controllers
      for (const { id, ctrl } of jobs) {
        uploadRuntime.registerController(id, ctrl)
      }

      // Run all concurrently
      await Promise.allSettled(
        jobs.map(async ({ id, file, ctrl }) => {
          try {
            const result = await uploadFile(
              file,
              (pct) => uploadRuntime.notifyProgress(id, pct),
              ctrl.signal,
            )
            // Check abort race: signal could fire after resolve
            if (ctrl.signal.aborted) {
              dispatch(setUploadStatus({ id, status: 'cancelled' }))
              dispatch(updateItem({ id, changes: { uploadStatus: 'cancelled' } }))
            } else {
              dispatch(setUploadStatus({ id, status: 'done' }))
              dispatch(updateItem({ id, changes: { uploadStatus: 'done' } }))
            }
          } catch (err) {
            if ((err as DOMException).name === 'AbortError') {
              dispatch(setUploadStatus({ id, status: 'cancelled' }))
              dispatch(updateItem({ id, changes: { uploadStatus: 'cancelled' } }))
            } else {
              const message = err instanceof Error ? err.message : 'Upload failed'
              dispatch(setUploadStatus({ id, status: 'error', error: message }))
              dispatch(updateItem({ id, changes: { uploadStatus: 'error' } }))
            }
          }
        }),
      )

      return errors
    },
    [dispatch],
  )

  const cancelUpload = useCallback((id: string) => {
    uploadRuntime.abort(id)
  }, [])

  const retryUpload = useCallback(
    async (id: string, file: File) => {
      const ctrl = new AbortController()
      uploadRuntime.registerController(id, ctrl)
      dispatch(setUploadStatus({ id, status: 'uploading' }))
      dispatch(updateItem({ id, changes: { uploadStatus: 'uploading' } }))

      try {
        await uploadFile(file, (pct) => uploadRuntime.notifyProgress(id, pct), ctrl.signal)
        if (ctrl.signal.aborted) {
          dispatch(setUploadStatus({ id, status: 'cancelled' }))
          dispatch(updateItem({ id, changes: { uploadStatus: 'cancelled' } }))
        } else {
          dispatch(setUploadStatus({ id, status: 'done' }))
          dispatch(updateItem({ id, changes: { uploadStatus: 'done' } }))
        }
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') {
          dispatch(setUploadStatus({ id, status: 'cancelled' }))
          dispatch(updateItem({ id, changes: { uploadStatus: 'cancelled' } }))
        } else {
          dispatch(setUploadStatus({ id, status: 'error', error: (err as Error).message }))
          dispatch(updateItem({ id, changes: { uploadStatus: 'error' } }))
        }
      }
    },
    [dispatch],
  )

  return { handleFiles, cancelUpload, retryUpload }
}
