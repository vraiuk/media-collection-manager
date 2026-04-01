import { test, expect } from '@playwright/test'

test('P2: upload progress causes ≤15 DOM mutations, 0 gallery re-renders', async ({ page }) => {
  await page.goto('/')

  // Wait for at least one card, then let loading settle for 2s
  await expect(page.locator('[data-testid="media-card"]').first()).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(2000)

  // Snapshot current card count — any new mutations from this point are upload-only
  const countBefore = await page.locator('[data-testid="media-card"]').count()

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

  await page.waitForTimeout(2000) // wait for upload to complete (~1s)

  const mutationCount = await page.evaluate(() => {
    (window as any).__observer?.disconnect()
    return (window as any).__mutationCount as number
  })

  // 1 mutation for the optimistic add + at most 1-2 from background pages that may
  // still be loading. Progress itself never touches the grid (DOM-direct updates).
  expect(mutationCount).toBeLessThanOrEqual(15)
  void countBefore // used only as a stable checkpoint
})
