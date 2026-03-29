import { configureStore } from '@reduxjs/toolkit'
import mediaReducer from '@entities/media/model/mediaSlice'
import uploadsReducer from '@entities/media/model/uploadsSlice'
import uiReducer from '@entities/media/model/uiSlice'

export const store = configureStore({
  reducer: {
    media: mediaReducer,
    uploads: uploadsReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
