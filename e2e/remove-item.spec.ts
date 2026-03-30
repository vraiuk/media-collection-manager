import { test, expect } from '@playwright/test'

test('removes item on x click without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

  await page.goto('/')
  await page.waitForTimeout(1500)

  const firstCard = page.locator('[data-testid="media-card"]').first()
  const initialCount = await page.locator('[data-testid="media-card"]').count()

  await firstCard.hover()
  await firstCard.locator('button[aria-label*="Remove"]').click()

  await expect(page.locator('[data-testid="media-card"]')).toHaveCount(initialCount - 1)
  expect(errors).toHaveLength(0)
})
