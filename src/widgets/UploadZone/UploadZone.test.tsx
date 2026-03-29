import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import mediaReducer from '@entities/media/model/mediaSlice'
import uploadsReducer from '@entities/media/model/uploadsSlice'
import uiReducer from '@entities/media/model/uiSlice'
import { UploadZone } from './index'

function makeStore() {
  return configureStore({
    reducer: { media: mediaReducer, uploads: uploadsReducer, ui: uiReducer },
  })
}

describe('UploadZone', () => {
  it('renders upload button', () => {
    render(<Provider store={makeStore()}><UploadZone /></Provider>)
    expect(screen.getByRole('button', { name: /choose files/i })).toBeInTheDocument()
  })

  it('shows validation error for invalid file type', async () => {
    render(<Provider store={makeStore()}><UploadZone /></Provider>)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'bad.gif', { type: 'image/gif' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText(/unsupported type/i)).toBeInTheDocument()
  })

  it('highlights on drag enter', () => {
    render(<Provider store={makeStore()}><UploadZone /></Provider>)
    const zone = screen.getByTestId('upload-zone')
    fireEvent.dragEnter(zone)
    expect(zone.className).toMatch(/border-accent/)
  })
})
