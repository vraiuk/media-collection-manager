import { test, expect } from '@playwright/test'

test('image preview appears before upload completes', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('input[type="file"]')
  // Valid 1x1 PNG so createImageBitmap succeeds in Chromium
  const minimalPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
    'base64',
  )
  await input.setInputFiles([
    { name: 'photo.png', mimeType: 'image/png', buffer: minimalPng },
  ])
  // Preview should appear quickly (before upload finishes)
  const card = page.locator('[data-testid="media-card"]').filter({ hasText: 'photo.png' })
  // Card appears immediately (optimistic), img appears after async canvas generation
  await expect(card).toBeVisible({ timeout: 3000 })
  await expect(card.locator('img')).toBeVisible({ timeout: 3000 })
})
