Take-Home Task
Senior Frontend Engineer
Time estimate 3-4 hours Stack React + TypeScript + Redux Toolkit Deadline 5 business days
Overview
Build a Media Collection Manager — a single-page React application that lets users browse, upload, and
manage media files. The goal is not pixel-perfect UI but clean architecture, solid TypeScript, and thoughtful
decisions around state, async flows, and browser APIs.
There is no back-end. You decide how to simulate it — write your own mock, use MSW, json-server, or any
other tool you prefer. Document your choice in the README and make sure the project runs locally with a single
command.
API Contract
Your mock must satisfy the following interface. How you implement it is entirely up to you.
fetchMediaPage(page: number)
Returns a paginated list of media items.
- Page size: 12 items. Total items: at least 50 (enough for 4+ pages).
- Response shape:
{ items: MediaItem[], nextPage: number | null, total: number }
- Simulate realistic latency (~500-1000 ms).
- Simulate occasional failures (~15% of requests) so error handling can be tested.
uploadFile(file, onProgress, signal)
Simulates uploading a single file.
- Reports progress incrementally via onProgress(percent: number) from 0 to 100.
- Resolves with { url: string } on success.
- Rejects on simulated server error (~20% of requests).
- Respects the AbortSignal — rejects with a DOMException('AbortError') when aborted.
MediaItem type
- id: string
- name: string
- type: 'image' | 'video' | 'document'
- size: number (bytes)
- createdAt: string (ISO date string)
The mock implementation is part of the assessment. A well-structured mock that clearly separates concerns and
is easy to swap out tells us as much about your engineering judgement as the application code itself.
Features to Build
1 | Media Gallery with Infinite Scroll
Display media items in a responsive grid.
- Load items page by page via fetchMediaPage().
- Trigger the next page when the user scrolls near the bottom — use IntersectionObserver, not scroll events.
- Show a loading indicator between pages.
- On fetch error: show an inline error message with a Retry button.
- When all pages are loaded: show an end-of-list message.
- Each card shows: thumbnail preview, file name, type badge, formatted size.
- A small x button on each card removes the item immediately — no confirmation dialog.
2 | Filter and Sort
Client-side operations on already-loaded items — no additional fetches.
- Filter by type: All / Image / Video / Document.
- Sort by: date (newest first) or file size (largest first).
- Search by file name with 300 ms debounce — implement without any library.
- All derived data must go through createSelector — no filtering logic inside components.
3 | Upload Flow
Allow users to add new media items.
- File picker button and drag-and-drop zone.
- Accepted: image/jpeg, image/png, image/webp, video/mp4. Max 5 files at once. Max 10 MB each.
- Validate on selection — show inline error per file for invalid type or size.
- Show per-file upload progress (0-100%) via uploadFile().
- Allow cancelling an in-progress upload via AbortController.
- Optimistic update: item appears in the gallery immediately with an 'uploading' badge; updates to 'done' or
'error' when the request settles.
- Retry button for failed uploads.
4 | Real-Time Thumbnail Generation
Generate previews on the client — no server round-trip.
- Images: resize to 200x200 px using the Canvas API, display immediately after file selection.
- Videos: seek to the first frame via a hidden element, draw to Canvas, display as thumbnail.
- Generation must be asynchronous — do not block the UI thread.
- Handle the race condition: if the user removes a file while its thumbnail is still generating, cancel gracefully.
5 | Preview Cache
Avoid regenerating thumbnails for files seen before.
- Cache generated thumbnails using Cache API or IndexedDB — your choice, justify it in the README.
- Cache key: fileName + fileSize.
- On file selection: check cache first, only run Canvas generation on a miss.
- Call URL.revokeObjectURL() when an item is removed to prevent memory leaks.
- Call URL.revokeObjectURL() when an item is removed to prevent memory leaks.
Technical Requirements
Area Requirement
TypeScript Strict mode enabled. Zero any. Use discriminated unions for async state
(loading / success / error).
Redux Toolkit createEntityAdapter for normalised store. createSelector for all derived data.
Pagination state (nextPage, hasMore) lives in Redux.
Async All uploads run concurrently. AbortController for cancellation. Guard against
double-fetches under React 18 StrictMode.
Browser APIs IntersectionObserver for scroll. Canvas API for thumbnails. Cache API or
IndexedDB for preview cache.
Memory Revoke all object URLs on item removal. No Canvas memory leaks.
Mock / API layer Clearly separated from application code. Easy to replace. Documented in
README.
Libraries Any library is allowed. Document every choice in the README: what it does,
why you picked it, what you would lose without it.
No UI kits No MUI, Chakra, Ant Design, or similar. CSS modules or inline styles are fine.
What We Evaluate
Criterion What good looks like Weight
Architecture Logic in hooks/selectors, thin components, clean
separation of concerns.
High
TypeScript Discriminated unions for state, typed store, no any. High
Criterion What good looks like Weight
Async + browser APIs Correct AbortController use, no memory leaks, race
conditions handled.
High
Mock layer Well-structured, clearly separated, easy to swap. Choice
is justified.
Medium
Redux Normalised store, memoised selectors, correct
immutable updates.
Medium
Code quality Readable, consistent naming, no dead code or debug
logs.
Medium
UI / UX All states handled: loading, error, empty, uploading. Low
Deliverables
Please submit both of the following:
GitHub Repository
- Public repository on GitHub — share the link via your recruiter.
- Public repository on GitHub — share the link via your recruiter.
- README.md must include:
- README.md must include:
How to run the project locally with a single command.
Your mock API approach and why you chose it.
Your library choices and the reasoning behind each.
Any trade-offs or shortcuts you made and why.
What you would improve given more time.
Link to your Loom demo video.
- Clean commit history — small focused commits are a positive signal.
- Clean commit history — small focused commits are a positive signal.
Loom Demo Video (3-5 minutes, required)
Record a short Loom walkthrough and include the public link in your README. Cover:
- Infinite scroll: scroll through pages, show the loading state triggering.
- Upload: pick files, show per-file progress, cancel one upload, retry a failed one.
- Thumbnail generation: show a preview appearing before the upload starts.
- Filter and sort: switch between types and sort options.
- Remove an item with the x button.
- Remove an item with the x button.
- Briefly explain your mock API approach and one architectural decision (1-2 min).
- Briefly explain your mock API approach and one architectural decision (1-2 min).
The Loom video is required. A 5-minute demo gives us much better signal than reading code alone — and
makes the follow-up call more focused for everyone.
Submission Checklist
[ ] GitHub repository is public and the link is shared with your recruiter
[ ] Project runs locally with a single command
[ ] README documents the mock API approach and reasoning
[ ] README documents every library choice with reasoning
[ ] README includes the Loom video link
[ ] Loom video is 3-5 min and covers all five features
[ ] TypeScript strict mode is on, zero any in the codebase
[ ] All five features are implemented and working
[ ] Loading, error, and empty states are handled everywhere
[ ] URL.revokeObjectURL is called when items are removed
Questions? Reach out to your recruiter. Good luck!