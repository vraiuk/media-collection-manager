import { test, expect } from '@playwright/test'

test('image preview appears before upload completes', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('input[type="file"]')
  await input.setInputFiles([
    { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(50_000) },
  ])
  // Preview should appear quickly (before upload finishes)
  const card = page.locator('[data-testid="media-card"]').filter({ hasText: 'photo.jpg' })
  await expect(card.locator('img')).toBeVisible({ timeout: 1000 })
})
