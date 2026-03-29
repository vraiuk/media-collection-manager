import { MediaGallery } from '@widgets/MediaGallery'

export function MediaPage() {
  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Media Collection</h1>
      <MediaGallery />
    </main>
  )
}
