import { test, expect } from '@playwright/test'

const hasCredentials = Boolean(
  process.env.TEST_USER_EMAIL?.trim() && process.env.TEST_USER_PASSWORD?.trim()
)

test.describe('Planning-P workspace journey', () => {
  test.skip(!hasCredentials, 'Requires TEST_USER_EMAIL and TEST_USER_PASSWORD')

  test('create initial-response incident, upgrade to planning-p, settings show OP controls', async ({
    page,
  }) => {
    test.setTimeout(180_000)

    await page.goto('/')

    const incidentName = `E2E OP Test ${Date.now()}`

    const createIncidentButton = page.getByRole('button', { name: /create incident/i }).first()
    if (await createIncidentButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await createIncidentButton.click()
    }

    const nameInput = page.getByLabel(/incident name|name/i).first()
    if (await nameInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await nameInput.fill(incidentName)
    }

    const initialResponseOption = page.getByLabel(/initial response/i).first()
    if (await initialResponseOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await initialResponseOption.check()
    }

    const submitCreate = page.getByRole('button', { name: /create|continue|save/i }).first()
    if (await submitCreate.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitCreate.click()
    }

    await page.waitForTimeout(5000)

    const settingsTab = page.getByRole('button', { name: /incident settings|workspace settings/i }).first()
    if (await settingsTab.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await settingsTab.click()
    }

    const planningPOption = page.getByLabel(/planning-p|planning p/i).first()
    if (await planningPOption.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await planningPOption.check()
    }

    const saveSettings = page.getByRole('button', { name: /save changes/i }).first()
    if (await saveSettings.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveSettings.click()
    }

    await page.waitForTimeout(3000)

    const startOpButton = page.getByRole('button', { name: /start operational period 1/i })
    await expect(startOpButton).toBeVisible({ timeout: 30_000 })
  })
})
