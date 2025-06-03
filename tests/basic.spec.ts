import { test, expect } from '@playwright/test'

test('basic playwright sanity check', async ({ page }) => {
  await page.goto('about:blank')
  await page.setContent('<title>Test</title><h1>Hello</h1>')
  await expect(page).toHaveTitle('Test')
})
