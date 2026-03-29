import React from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from '@app/providers'
import { MediaPage } from '@pages/MediaPage'
import '@app/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <MediaPage />
    </Providers>
  </React.StrictMode>,
)
