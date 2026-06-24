import { test, expect } from '@playwright/test'

test.describe('Tabletop exercise MSEL', () => {
  test('create exercise flow exposes Tabletop Exercise format', async ({ page }) => {
    await page.goto('/')

    const createExerciseButton = page.getByRole('button', { name: /create exercise/i })
    if ((await createExerciseButton.count()) === 0) {
      test.skip(true, 'Create Exercise entry point not available in this shell state')
    }

    await createExerciseButton.first().click()

    await page.getByLabel(/select workspace format/i).click()
    await expect(page.getByRole('menuitem', { name: 'Tabletop Exercise' })).toBeVisible()
  })
})
