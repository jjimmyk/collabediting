import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  process.env.VITE_APP_URL?.trim() ||
  'http://127.0.0.1:4173'

const hasAuthCredentials = Boolean(
  process.env.TEST_USER_EMAIL?.trim() && process.env.TEST_USER_PASSWORD?.trim()
)

export default defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api-health',
      testMatch: /api-health\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    ...(hasAuthCredentials
      ? [
          {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
          },
          {
            name: 'authenticated',
            testMatch: /workspace-.*\.spec\.ts/,
            use: {
              ...devices['Desktop Chrome'],
              storageState: path.join(__dirname, 'e2e/.auth/user.json'),
            },
            dependencies: ['setup'],
          },
        ]
      : []),
  ],
  webServer:
    process.env.PLAYWRIGHT_BASE_URL || process.env.PLAYWRIGHT_API_BASE_URL
      ? undefined
      : {
          command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
          url: 'http://127.0.0.1:4173',
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
})
