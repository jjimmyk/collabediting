import { test, expect } from '@playwright/test'

const apiBase =
  process.env.PLAYWRIGHT_API_BASE_URL?.trim() ||
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  process.env.VITE_APP_URL?.trim() ||
  'http://127.0.0.1:4173'

const criticalRoutes = [
  '/api/start-operational-period',
  '/api/apply-workspace-roster-plan',
  '/api/create-workspace',
  '/api/update-workspace',
  '/api/search-org-members',
]

test.describe('API health (deployed or preview)', () => {
  for (const route of criticalRoutes) {
    test(`${route} returns JSON error without auth (not platform crash)`, async ({ request }) => {
      const response = await request.post(`${apiBase}${route}`, {
        data: {},
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false,
      })

      const contentType = response.headers()['content-type'] ?? ''
      const bodyText = await response.text()

      expect(bodyText).not.toContain('FUNCTION_INVOCATION_FAILED')
      expect(bodyText).not.toContain('A server error has occurred')

      if (contentType.includes('application/json')) {
        const json = JSON.parse(bodyText) as { error?: string }
        expect(json.error).toBeTruthy()
      }

      expect([400, 401, 404, 405, 503]).toContain(response.status())
    })
  }
})
