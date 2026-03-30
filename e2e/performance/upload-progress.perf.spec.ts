import { test, expect } from '@playwright/test'

test('P2: upload progress causes ≤15 DOM mutations, 0 gallery re-renders', async ({ page }) => {
  await page.goto('/')

  // Start observing BEFORE uploading
  await page.evaluate(() => {
    (window as any).__mutationCount = 0
    const grid = document.querySelector('[data-testid="media-gallery-grid"]')
    if (!grid) return
    const observer = new MutationObserver((mutations) => {
      (window as any).__mutationCount += mutations.length
    })
    observer.observe(grid, { childList: true, subtree: false })
    ;(window as any).__observer = observer
  })

  const input = page.locator('input[type="file"]')
  await input.setInputFiles([
    { name: 'test.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
  ])

  await page.waitForTimeout(3500) // wait for upload to complete

  const mutationCount = await page.evaluate(() => {
    (window as any).__observer?.disconnect()
    return (window as any).__mutationCount as number
  })

  // Gallery grid itself should not mutate during progress (progress is DOM-direct)
  // Only 1-2 mutations expected: when item is added optimistically + possibly status update
  expect(mutationCount).toBeLessThanOrEqual(3)
})
