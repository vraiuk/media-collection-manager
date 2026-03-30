import { test, expect } from '@playwright/test'

test('P8: blob URLs cleaned up after item removal', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

  await page.goto('/')
  await page.waitForTimeout(1500) // load first page

  // Upload 3 files to create blob URLs
  const input = page.locator('input[type="file"]')
  await input.setInputFiles([
    { name: 'a.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
    { name: 'b.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
    { name: 'c.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
  ])
  await page.waitForTimeout(1000) // thumbnails generated

  // Remove all 3 uploaded items
  for (let i = 0; i < 3; i++) {
    const card = page.locator('[data-testid="media-card"]').first()
    await card.hover()
    await card.locator('button[aria-label*="Remove"]').click()
    await page.waitForTimeout(100)
  }

  // No console errors about already-revoked URLs
  expect(consoleErrors.filter((e) => e.includes('URL'))).toHaveLength(0)
})
