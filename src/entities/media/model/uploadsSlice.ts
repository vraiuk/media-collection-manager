import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UploadJob, UploadStatus } from './types'

export const uploadsAdapter = createEntityAdapter<UploadJob>()

const uploadsSlice = createSlice({
  name: 'uploads',
  initialState: uploadsAdapter.getInitialState(),
  reducers: {
    addUploadJob: uploadsAdapter.addOne,
    removeUploadJob: uploadsAdapter.removeOne,
    setUploadStatus(
      state,
      action: PayloadAction<{ id: string; status: UploadStatus; error?: string }>,
    ) {
      const { id, status, error } = action.payload
      uploadsAdapter.updateOne(state, { id, changes: { status, error } })
    },
  },
})

export const { addUploadJob, removeUploadJob, setUploadStatus } = uploadsSlice.actions
export default uploadsSlice.reducer
