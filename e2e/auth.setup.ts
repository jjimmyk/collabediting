import { test as setup, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, '.auth/user.json')

const email = process.env.TEST_USER_EMAIL?.trim()
const password = process.env.TEST_USER_PASSWORD?.trim()

setup('authenticate test user', async ({ page }) => {
  mkdirSync(path.dirname(authFile), { recursive: true })

  setup.skip(!email || !password, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD for authenticated E2E tests')

  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()

  const signInEmail = page.getByRole('textbox', { name: /email/i }).first()
  if (await signInEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
    await signInEmail.fill(email)
    const passwordInput = page.getByLabel(/password/i).first()
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill(password)
      await page.getByRole('button', { name: /sign in|log in/i }).first().click()
    }
  }

  await page.waitForTimeout(3000)
  await page.context().storageState({ path: authFile })
})
