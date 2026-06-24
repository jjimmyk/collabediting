import { test, expect } from '@playwright/test'

test.describe('App smoke', () => {
  test('loads the shell without crashing', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('#root')).toBeVisible()

    expect(errors.filter((message) => !message.includes('Grammarly'))).toEqual([])
  })

  test('shows sign-in or hub content', async ({ page }) => {
    await page.goto('/')
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })
})
