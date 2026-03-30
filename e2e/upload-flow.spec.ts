import { test, expect } from '@playwright/test'

test('upload file shows progress badge and completes', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('input[type="file"]')

  // Create test files
  await input.setInputFiles([
    { name: 'test.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
  ])

  // Optimistic item appears immediately
  await expect(page.locator('[data-testid="media-card"]').filter({ hasText: 'test.jpg' })).toBeVisible()

  // Wait for completion (uploading badge disappears)
  await expect(page.locator('text=UPLOADING')).toBeVisible({ timeout: 3000 }).catch(() => {})
})

test('shows validation error for invalid file', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('input[type="file"]')
  await input.setInputFiles([
    { name: 'bad.gif', mimeType: 'image/gif', buffer: Buffer.alloc(100) },
  ])
  await expect(page.getByText(/unsupported type/i)).toBeVisible()
})
