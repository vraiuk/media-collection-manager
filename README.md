# Media Collection Manager

## Run locally

```
npm install && npm run dev
```

Opens at http://localhost:5173

## Tests

```
npm test           # unit + integration (Vitest)
npm run test:e2e   # e2e (Playwright, starts dev server)
npm run bench      # performance benchmarks
```

## Mock API

Custom in-memory mock service (`src/shared/api/mediaApi.ts`). No external tools (no MSW, json-server). Chosen because:
- Full control over AbortSignal behavior, progress ticks, and failure injection
- Easy to swap: replace `fetchMediaPage` and `uploadFile` exports with real fetch calls
- Clearer signal in code review than black-box interceptors

Simulates: 500–1000ms latency, 15% fetch failures, 20% upload failures, incremental progress via setInterval.

## Library choices

| Library | Purpose | Without it |
|---|---|---|
| Redux Toolkit | Normalized store, immutable updates, entity adapters | Manual normalization, boilerplate reducers |
| Tailwind CSS | Utility-first styling | CSS modules or inline styles (slower iteration) |
| Vitest | Fast unit tests co-located with source | Jest (slower, heavier config) |
| Playwright | E2E in real browser | Cypress (slower startup, harder CI) |
| fake-indexeddb | In-memory IndexedDB for tests | Skip IDB tests or use real browser |

No UI kits used (MUI, Chakra, etc.).

## Architecture decisions

**Runtime managers outside Redux:** `AbortController` and thumbnail cancel tokens are not serializable. They live in `uploadRuntime` and `thumbnailRuntime` — plain Maps keyed by item ID. Redux only stores serializable metadata.

**DOM-direct progress updates:** Upload progress never touches Redux. Each `UploadProgress` component registers a callback in `uploadRuntime`. The mock API calls the callback directly, mutating the progress bar's `style.width`. Zero React re-renders during progress ticks.

**IndexedDB over Cache API:** Cache API is designed for request/response pairs. Thumbnail blobs keyed by `fileName + fileSize` map naturally to IDB's key-value store.

**Video thumbnail concurrency limit:** Max 2 concurrent video decodes to avoid browser video pipeline saturation.

## Trade-offs

- `document.pdf` items use a document icon — actual PDF thumbnail generation is out of scope
- Cache eviction is FIFO by insertion order (IDB cursor) — no timestamp stored
- Retry flow stores the File object in `uploadRuntime` — available for the current session only, lost on page refresh

## Loom demo
https://www.loom.com/share/49919ef332444a599a3a31062f58b121

## What I'd improve with more time

- Worker thread for image thumbnail generation (OffscreenCanvas in worker)
- Proper LRU with timestamps in IndexedDB
- Optimistic rollback if upload fails after page reload
