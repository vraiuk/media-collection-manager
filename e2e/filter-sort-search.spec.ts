import { test, expect } from '@playwright/test'

test('filter by image type hides video items', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1500) // let first page load
  await page.click('button:has-text("Image")')
  const cards = page.locator('[data-testid="media-card"]')
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
  // All visible badges should be IMAGE
  const badges = await page.locator('text=VIDEO').count()
  expect(badges).toBe(0)
})

test('search filters by file name', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1500)
  await page.fill('input[placeholder="Search..."]', 'vacation')
  await page.waitForTimeout(400) // debounce
  const cards = page.locator('[data-testid="media-card"]')
  const count = await cards.count()
  // All results should contain 'vacation' in name
  for (let i = 0; i < Math.min(count, 3); i++) {
    const text = await cards.nth(i).textContent()
    expect(text?.toLowerCase()).toContain('vacation')
  }
})
