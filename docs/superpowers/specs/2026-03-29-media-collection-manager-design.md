# Media Collection Manager — Design Spec

**Date:** 2026-03-29
**Stack:** React + TypeScript + Redux Toolkit + Vite + Tailwind CSS
**Architecture:** FSD (adapted) + Runtime Managers
**Tests:** Vitest + Testing Library + Playwright

---

## 1. Project Structure

```
src/
├── app/
│   ├── store.ts              # configureStore
│   ├── providers.tsx          # <Provider store> + <App>
│   └── index.css             # Tailwind base + CSS custom properties (tokens)
│
├── pages/
│   └── MediaPage/
│       └── index.tsx
│
├── widgets/
│   ├── MediaGallery/
│   │   ├── index.tsx         # gallery + filter controls
│   │   └── MediaGallery.test.tsx
│   └── UploadZone/
│       ├── index.tsx         # drag-drop + file picker
│       └── UploadZone.test.tsx
│
├── features/
│   ├── gallery/
│   │   ├── hooks/
│   │   │   └── useInfiniteScroll.ts
│   │   └── components/
│   │       ├── MediaCard.tsx
│   │       └── MediaCard.test.tsx
│   ├── upload/
│   │   ├── hooks/
│   │   │   └── useUpload.ts
│   │   ├── uploadRuntime.ts
│   │   └── components/
│   │       ├── UploadProgress.tsx
│   │       └── FileValidation.ts
│   ├── thumbnail/
│   │   ├── thumbnailRuntime.ts
│   │   ├── generateImageThumb.ts
│   │   ├── generateVideoThumb.ts
│   │   └── thumbnail.test.ts
│   └── preview-cache/
│       ├── previewCache.ts
│       └── previewCache.test.ts
│
├── entities/
│   └── media/
│       ├── model/
│       │   ├── types.ts
│       │   ├── mediaSlice.ts
│       │   ├── uploadsSlice.ts
│       │   ├── uiSlice.ts
│       │   └── selectors.ts
│       └── index.ts
│
└── shared/
    ├── api/
    │   ├── mediaApi.ts
    │   ├── mockData.ts
    │   └── mediaApi.test.ts
    ├── lib/
    │   ├── debounce.ts
    │   ├── formatSize.ts
    │   └── formatSize.test.ts
    └── ui/
        ├── Badge.tsx
        ├── Button.tsx
        └── Spinner.tsx
```

Import direction (strict): `pages → widgets → features → entities → shared`. No upward imports.

---

## 2. Types and Redux State Shape

### Discriminated unions (`entities/media/model/types.ts`)

```ts
type AsyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; error: string }

type PageLoadState =
  | { status: 'idle' }
  | { status: 'loading'; page: number }
  | { status: 'success' }
  | { status: 'error'; error: string; page: number }

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  size: number
  createdAt: string
  previewUrl?: string   // blob URL, populated after thumbnail generation
}

interface GalleryItem extends MediaItem {
  source: 'remote' | 'local'
  uploadStatus?: 'uploading' | 'done' | 'error' | 'cancelled'
}

type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'cancelled'

interface UploadJob {
  id: string           // matches GalleryItem.id for optimistic coupling
  fileName: string
  status: UploadStatus
  error?: string
  // NOTE: progress is intentionally absent — updated via DOM-direct ref
}
```

### Slices

**`mediaSlice`** — `createEntityAdapter<GalleryItem>`:
```ts
{
  entities: Record<string, GalleryItem>,
  ids: string[],
  pagination: {
    nextPage: number | null,
    hasMore: boolean,
    total: number,
    loadState: PageLoadState
  }
}
```

**`uploadsSlice`** — `createEntityAdapter<UploadJob>`:
```ts
{
  entities: Record<string, UploadJob>,
  ids: string[]
}
```

**`uiSlice`**:
```ts
{
  filterType: 'all' | 'image' | 'video' | 'document',
  sortBy: 'date' | 'size',
  searchQuery: string
}
```

### Selectors (`entities/media/model/selectors.ts`)

All derived data lives here exclusively — no filtering logic inside components.

Selectors are decomposed into intermediate memoized steps to avoid redundant full-list recomputation:

```ts
// Step 1: filter only
const selectItemsByType = createSelector(
  [selectAllItems, (state) => state.ui.filterType],
  (items, type) => type === 'all' ? items : items.filter(i => i.type === type)
)

// Step 2: sort (input is already filtered — recomputes only when filter result changes)
const selectFilteredSortedItems = createSelector(
  [selectItemsByType, (state) => state.ui.sortBy],
  (items, sortBy) => [...items].sort(sortBy === 'date' ? byDate : bySize)
)

// Step 3: search (input is already sorted — recomputes only when sortBy or search changes)
const selectVisibleItems = createSelector(
  [selectFilteredSortedItems, (state) => state.ui.searchQuery],
  (items, query) => query ? items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())) : items
)
```

Additional selectors:
- `selectHasMore`, `selectLoadState`, `selectPaginationNextPage`
- `selectUploadJobs`, `selectUploadById`

**`File` and `AbortController` are never stored in Redux.** Only in runtime managers.

---

## 3. Mock API Layer

### `shared/api/mockData.ts`

60 statically generated `MediaItem` records. Distribution: ~30 image, ~15 video, ~15 document. Realistic file sizes (10KB–8MB).

### `shared/api/mediaApi.ts`

```ts
const FAILURE_RATE_FETCH = 0.15   // 15%
const FAILURE_RATE_UPLOAD = 0.20  // 20%
const LATENCY_MIN = 500           // ms
const LATENCY_MAX = 1000          // ms
const PAGE_SIZE = 12

async function fetchMediaPage(page: number): Promise<PageResponse>
async function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<{ url: string }>
```

- `AbortSignal` checked before start and on every progress tick
- Progress emulated via `setInterval` with ~10 ticks, slight jitter
- Only exports `fetchMediaPage` and `uploadFile` — easy to swap for real API
- Random failures via seeded `Math.random` mock in tests

---

## 4. Gallery + Filters

### `features/gallery/hooks/useInfiniteScroll.ts`

- Attaches `IntersectionObserver` to a sentinel element at the bottom of the list
- On intersection: checks `loadState.status !== 'loading'` and `hasMore === true` before dispatching
- React 18 StrictMode guard: `useEffect` cleanup disconnects observer; double-mount creates a fresh one but is blocked by `loadState`
- Pagination `createAsyncThunk` checks state before fetch (no double-fetch)

### `features/gallery/components/MediaCard.tsx`

Wrapped in `React.memo()` — prevents re-renders when unrelated items change.

Props: `item: GalleryItem`, `onRemove: (id: string) => void`

`onRemove` must be passed as a stable reference (via `useCallback` in the parent widget) — otherwise `React.memo` has no effect.

Progress bar is rendered by a separate `UploadProgress` subcomponent (conditionally shown when `item.uploadStatus === 'uploading'`). `UploadProgress` registers itself in `uploadRuntime` by `id` via `useEffect` — the parent `MediaCard` knows nothing about progress values.

States rendered:
- Normal: thumbnail/icon + name + type badge + size
- Uploading: progress bar (DOM-direct, see Section 5)
- Error: error badge + Retry button
- Done: same as normal

### Filter controls (`widgets/MediaGallery`)

- Type filter: All / Image / Video / Document → `dispatch(setFilterType(...))`
- Sort: Date (newest) / Size (largest) → `dispatch(setSortBy(...))`
- Search: `useFilterControls` holds local `inputValue` state. The **dispatch itself** is debounced 300ms (not just the logic) — this prevents Redux state updates and selector recomputation on every keystroke. Implemented without external libraries.

### Gallery states

| State | UI |
|---|---|
| Initial load | Skeleton cards (3 rows) |
| Loading next page | Spinner at bottom |
| Fetch error | Inline banner + Retry button |
| Empty search result | "Nothing found" message |
| End of list | "You've seen it all" message |

---

## 5. Upload Flow + Progress Architecture

### Progress updates: DOM-direct, not Redux

**Key architectural decision:** `UploadJob` has no `progress` field in Redux. Progress is updated directly on DOM refs via callback registry in `uploadRuntime`. This avoids re-renders on every progress tick (50+ updates/sec with concurrent uploads).

```ts
// uploadRuntime.ts
const controllers = new Map<string, AbortController>()
const progressCallbacks = new Map<string, (pct: number) => void>()

export function registerController(id: string, ctrl: AbortController): void
export function registerProgress(id: string, cb: (pct: number) => void): void
export function unregisterProgress(id: string): void
export function abort(id: string): void
export function cleanup(id: string): void
```

`UploadProgress` component:
```ts
useEffect(() => {
  uploadRuntime.registerProgress(id, (pct) => {
    if (barRef.current) barRef.current.style.width = `${pct}%`
    if (labelRef.current) labelRef.current.textContent = `${pct}%`
  })
  return () => uploadRuntime.unregisterProgress(id)
}, [id])
```

Redux is dispatched only on status transitions: `uploading → done | error | cancelled`.

### `features/upload/components/FileValidation.ts`

Pure function called on file selection before any dispatch:
- Accepted types: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`
- Max size: 10MB per file
- Max count: 5 files at once
- Returns `{ valid: File[], errors: Array<{ file: File; reason: string }> }`

### `features/upload/hooks/useUpload.ts`

1. Validate → show inline errors, skip invalid files
2. For each valid file:
   - Generate id via `crypto.randomUUID()`
   - `dispatch(addUploadJob({ id, fileName, status: 'queued' }))`
   - `dispatch(addGalleryItem({ ...optimisticItem, source: 'local', uploadStatus: 'uploading' }))`
   - `thumbnailRuntime.generate(id, file)` → updates `previewUrl` without Redux round-trip
3. All uploads run concurrently via `Promise.allSettled`
4. `onProgress` → `uploadRuntime.progressCallbacks` (DOM-direct)
5. On settle → `dispatch(setUploadStatus({ id, status: 'done' | 'error' }))` + `dispatch(updateGalleryItem(...))`

### Cancel + Retry

- **Cancel:** `uploadRuntime.abort(id)` → `AbortSignal` fires → `DOMException('AbortError')` → dispatch `cancelled`

Promise catch handler must explicitly distinguish abort from server error:
```ts
.catch((err) => {
  if (err?.name === 'AbortError') {
    dispatch(setUploadStatus({ id, status: 'cancelled' }))
  } else {
    dispatch(setUploadStatus({ id, status: 'error', error: err.message }))
  }
})
```

**Race: abort arrives after 100% progress** — even if `mediaApi.uploadFile` resolves successfully, check `signal.aborted` before dispatching success:
```ts
const result = await mediaApi.uploadFile(file, onProgress, signal)
if (signal.aborted) {
  dispatch(setUploadStatus({ id, status: 'cancelled' }))
} else {
  dispatch(setUploadStatus({ id, status: 'done' }))
}
```

**AbortSignal event listeners** in `mediaApi.uploadFile` must use `{ once: true }` to prevent listener leaks:
```ts
signal.addEventListener('abort', abortHandler, { once: true })
```

- **Retry:** reset status to `queued`, `useUpload` restarts only that file with a fresh `AbortController` (registered via `uploadRuntime.registerController`)

### Drag-and-drop (`widgets/UploadZone`)

Native drag events on a single `div` — no library. File picker and drop zone share `handleFiles(files: FileList)`.

---

## 6. Thumbnail Generation + Preview Cache

### `features/thumbnail/thumbnailRuntime.ts`

```ts
const tokens = new Map<string, { cancelled: boolean }>()

export function generate(id: string, file: File, dispatch: AppDispatch): void
export function cancel(id: string): void  // sets token.cancelled = true, revokes URL
```

Race condition handled: if `token.cancelled` when generation resolves → `URL.revokeObjectURL(blobUrl)` immediately, no dispatch.

### `features/thumbnail/generateImageThumb.ts`

1. Check `previewCache.get(name, size)` → cache hit: return immediately
2. `createImageBitmap(file)` — non-blocking
3. Check `token.cancelled` after await; if cancelled: `bitmap.close()` and return
4. Draw to `OffscreenCanvas(200, 200)` with contain-fit scaling
5. `bitmap.close()` — **mandatory** to free ImageBitmap memory (leaks without this)
6. `canvas.convertToBlob({ type: 'image/webp', quality: 0.8 })`
7. `URL.createObjectURL(blob)` → save to cache → return URL

All steps after step 2 are in a `try/finally` that guarantees `bitmap.close()` runs even on error.

### `features/thumbnail/generateVideoThumb.ts`

1. Create hidden `<video>` element (appended to `document.body` with `display:none`)
2. `const videoSrcUrl = URL.createObjectURL(file)` → `video.src = videoSrcUrl` → wait for `loadeddata`
3. `video.currentTime = 0` → wait for `seeked`
4. Check `token.cancelled` after each await boundary
5. Draw `video` to `Canvas(200, 200)` → `canvas.toBlob()` → `URL.createObjectURL(thumbnailBlob)`
6. **Cleanup order in `finally` (always runs):**
   - `URL.revokeObjectURL(videoSrcUrl)` — revoke the file's object URL
   - `video.src = ''` — clear src before removal (prevents browser holding internal reference)
   - `video.remove()` — remove from DOM

If `token.cancelled` at step 4: revoke `videoSrcUrl`, clear `video.src`, `video.remove()`, and return without creating thumbnail URL.

Max 2 concurrent video thumbnail generations — a simple semaphore in `thumbnailRuntime` prevents browser video decoder starvation when user selects 5 videos simultaneously.

### `features/preview-cache/previewCache.ts` — IndexedDB

**Why IndexedDB over Cache API:** Cache API is designed for request/response pairs. We're caching generated blobs keyed by `fileName + fileSize` — IndexedDB's key-value store is a natural fit and easier to justify in README.

```ts
// DB: 'media-previews', store: 'thumbnails'
// key: `${fileName}__${fileSize}`
// value: Blob

interface PreviewCache {
  get(name: string, size: number): Promise<string | null>  // returns objectURL or null
  set(name: string, size: number, blob: Blob): Promise<void>
}
```

Each `get`/`set` opens a transaction and closes it automatically when the promise settles — no persistent connection held. No need to call `db.close()` between operations.

**Eviction policy:** max 100 entries, LRU. On `set`, if count > 100: delete the oldest entry (by insertion order). This prevents indefinite IDB growth when users repeatedly select new files.

### Item removal cleanup (order matters)

1. `thumbnailRuntime.cancel(id)` — set token.cancelled, revoke any already-created blob URL
2. `uploadRuntime.abort(id)` — fire AbortSignal
3. `URL.revokeObjectURL(item.previewUrl)` — free preview memory (only if previewUrl exists and was not already revoked by thumbnailRuntime.cancel)
4. `uploadRuntime.cleanup(id)` — remove controller and callback from Maps
5. `thumbnailRuntime.cleanup(id)` — remove token from Map
6. `dispatch(removeGalleryItem(id))`
7. `dispatch(removeUploadJob(id))`

Steps 4–5 are explicit Map cleanups to prevent `uploadRuntime` and `thumbnailRuntime` from growing unboundedly.

---

## 7. Testing Strategy

### Unit tests (Vitest + Testing Library)

| File | What is tested |
|---|---|
| `shared/api/mediaApi.test.ts` | pagination, 15% failure, abort signal, upload progress ticks, 20% failure |
| `entities/media/model/selectors.test.ts` | all filter/sort/search combinations |
| `features/thumbnail/thumbnail.test.ts` | cache hit/miss, cancel mid-generation, revokeObjectURL on cancel |
| `features/preview-cache/previewCache.test.ts` | get/set, key format |
| `shared/lib/debounce.test.ts` | timing, trailing call with fake timers |
| `shared/lib/formatSize.test.ts` | bytes → KB/MB/GB |
| `features/upload/FileValidation.test.ts` | all validation rules |
| `widgets/MediaGallery/MediaGallery.test.tsx` | render items, filter, sort, search, remove |
| `widgets/UploadZone/UploadZone.test.tsx` | drag-drop, file picker, validation errors |

- Fake timers (`vi.useFakeTimers`) for debounce and upload progress
- IndexedDB mocked via `fake-indexeddb` package

### E2E tests (Playwright)

| Scenario | Assertions |
|---|---|
| Infinite scroll | Pages 2→3→4 load on scroll, spinner visible, end-of-list message appears |
| Upload flow | 3 files → progress bars → cancel one → one fails → Retry → all done |
| Thumbnail generation | Preview appears before upload completes; same file second time loads from cache |
| Filter + Sort + Search | Filter → sort → search produces correct result, no extra fetches |
| Remove item | Item disappears, layout intact, no console errors about revokeObjectURL |

E2E runs against `vite dev` with the real mock API.

### Performance tests

| # | Type | What is measured | Pass criteria |
|---|---|---|---|
| P1 | `vi.bench` | `selectVisibleItems` with 60 items: no filter, filter only, filter+sort, all three | < 0.5ms / 1ms / 1.5ms / 2ms |
| P2 | `vi.bench` | Selector memoization: same inputs dispatched twice → second call is cache hit | 0 recomputes on identical inputs |
| P3 | Vitest unit | `generateImageThumb` on 2MB JPEG | < 200ms |
| P4 | Playwright | Image preview visible after file selection | < 500ms (cache miss), < 50ms (cache hit) |
| P5 | Playwright | Video thumbnail for 1 / 3 / 5 videos concurrently | < 1s / 1.5s / 2s; 5-video time < 4× single |
| P6 | Playwright | DOM mutation count during upload of 1 file (10 progress ticks) | ≤ 15 mutations; `<MediaGallery>` 0 re-renders during progress, 1 on completion |
| P7 | Playwright | Each subsequent page appears after IntersectionObserver fires | < 500ms per page |
| P8 | Playwright | Blob URL count: upload 5 items → remove all | ≤ 1 persistent URL after removal |
| P9 | Playwright | Upload cancel mid-progress: progress bar stops, Redux state → `cancelled` | < 50ms stop, < 100ms state update |
| P10 | Vitest unit | IDB `previewCache.get` hit vs miss | < 50ms hit; < 300ms miss (images) |

Performance test files: `src/**/*.perf.ts` (Vitest bench) and `e2e/performance/` (Playwright).

---

## 8. Design Tokens + frontend-design MCP

### Step 1: Tokens (before writing any component)

Use `frontend-design` MCP to generate color palette, typography, spacing, border-radius. Output to `app/index.css` as CSS custom properties. Configure `tailwind.config.ts` to expose tokens as utilities.

Dark theme by default (no toggle — YAGNI). Dark background contrasts well with media thumbnails.

```css
:root {
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-border: #2e3244;
  --color-text-primary: #e8eaf0;
  --color-text-muted: #6b7280;
  --color-accent: #6366f1;
  --color-error: #ef4444;
  --color-success: #22c55e;
  /* spacing, radius, font defined here */
}
```

### Step 2: Mockups (before complex components)

Use `frontend-design` MCP to get visual reference for:
- `MediaCard` — all states (normal, uploading, error, done)
- `UploadZone` — idle, drag-over, validation error
- Gallery loading/error/empty states

---

## 9. Implementation Order (MVP sequence)

1. Bootstrap: Vite + TS + Tailwind + RTK + design tokens
2. Mock API (`shared/api/`) + mockData
3. `entities/media` — types, slices, selectors
4. Gallery: render grid, infinite scroll, remove item
5. Filters / sort / search
6. Upload flow — without thumbnails (optimistic, progress, cancel, retry)
7. Image thumbnail generation
8. Video thumbnail generation
9. Preview cache (IndexedDB)
10. Cleanup: revokeObjectURL, edge cases, StrictMode guards
11. Unit tests
12. E2E tests
13. README + Loom

---

## 10. Submission Checklist Coverage

| Requirement | How addressed |
|---|---|
| TypeScript strict mode, zero `any` | `tsconfig.json` strict: true, discriminated unions everywhere |
| `createEntityAdapter` | `mediaSlice`, `uploadsSlice` |
| `createSelector` | All derived data in `selectors.ts` |
| Pagination state in Redux | `mediaSlice.pagination` |
| `IntersectionObserver` | `useInfiniteScroll.ts` |
| Canvas API | `generateImageThumb`, `generateVideoThumb` |
| IndexedDB cache | `previewCache.ts` |
| `AbortController` | `uploadRuntime`, respected by `mediaApi.uploadFile` |
| Concurrent uploads | `Promise.allSettled` in `useUpload` |
| `URL.revokeObjectURL` on remove | Item removal cleanup (ordered) |
| No UI kits | Tailwind + custom CSS only |
| Mock clearly separated | `shared/api/` — no React deps, documented in README |
| Single command to run | `npm run dev` |
