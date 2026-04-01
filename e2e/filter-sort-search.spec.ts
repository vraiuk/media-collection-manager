import { test, expect } from '@playwright/test'

test('filter by image type hides video items', async ({ page }) => {
  await page.goto('/')
  // Wait until at least one card is visible before filtering
  await expect(page.locator('[data-testid="media-card"]').first()).toBeVisible({ timeout: 5000 })
  await page.click('button:has-text("Image")')
  // Wait for React to re-render with filtered results
  await expect(page.locator('[data-testid="media-card"]').first()).toBeVisible({ timeout: 3000 })
  const cards = page.locator('[data-testid="media-card"]')
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
  // All visible badges should be IMAGE, no VIDEO badges
  // Use exact regex to match badge text only, not filenames containing 'video'
  const badges = await page.locator('[data-testid="media-card"] span').filter({ hasText: /^VIDEO$/ }).count()
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
