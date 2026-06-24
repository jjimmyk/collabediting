import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    environment: 'node',
    testTimeout: 120_000,
    hookTimeout: 120_000,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/features/**/*.ts', 'api/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types.ts'],
      reporter: ['text', 'html'],
    },
  },
})
