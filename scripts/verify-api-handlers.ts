import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { createMockRequest, invokeHandler } from '../tests/helpers/mock-vercel.ts'

const CRITICAL_HANDLERS: Array<{
  file: string
  method: 'GET' | 'POST' | 'PATCH'
  body?: unknown
}> = [
  { file: 'start-operational-period.ts', method: 'POST', body: {} },
  { file: 'apply-workspace-roster-plan.ts', method: 'POST', body: {} },
  { file: 'create-workspace.ts', method: 'POST', body: {} },
  { file: 'update-workspace.ts', method: 'PATCH', body: { workspaceId: 'x', name: 'x' } },
  { file: 'search-org-members.ts', method: 'GET' },
]

const NON_HANDLER_FILES = new Set([
  'org-shared.ts',
  'roster-template-types.ts',
  'roster-operations-work-assignment.ts',
  'roster-member-schedule-policy.ts',
])

function isSharedModule(fileName: string): boolean {
  if (NON_HANDLER_FILES.has(fileName)) return true
  return fileName.endsWith('-shared.ts')
}

function collectApiHandlerEntrypoints(): string[] {
  const apiDir = join(process.cwd(), 'api')
  const files: string[] = []

  for (const entry of readdirSync(apiDir)) {
    const fullPath = join(apiDir, entry)
    if (!statSync(fullPath).isFile()) continue
    if (!entry.endsWith('.ts') || entry.endsWith('.d.ts')) continue
    if (isSharedModule(entry)) continue
    files.push(fullPath)
  }

  return files.sort()
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function assertHandlerBundles(entryPath: string): Promise<void> {
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    absWorkingDir: process.cwd(),
    alias: {
      '@': join(process.cwd(), 'src'),
    },
    external: ['@supabase/supabase-js', '@vercel/node'],
  })

  const output = result.outputFiles?.[0]?.text
  assert(output, `esbuild produced no output for ${basename(entryPath)}`)
}

async function loadHandler(entryPath: string) {
  const module = await import(pathToFileURL(entryPath).href)
  const handler = module.default
  assert(typeof handler === 'function', `${basename(entryPath)} must export a default handler`)
  return handler as (
    req: import('@vercel/node').VercelRequest,
    res: import('@vercel/node').VercelResponse
  ) => Promise<unknown>
}

async function assertHandlerReturnsJsonAuthError(
  entryPath: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown
): Promise<void> {
  const handler = await loadHandler(entryPath)
  const { statusCode, body: responseBody } = await invokeHandler(
    handler,
    createMockRequest({
      method,
      body: body ?? {},
      headers: {},
      query: method === 'GET' ? { workspaceId: 'test' } : {},
    })
  )

  assert(
    statusCode === 401 || statusCode === 405 || statusCode === 400 || statusCode === 503,
    `${basename(entryPath)} expected 401/405/400/503 without auth, got ${statusCode}`
  )
  assert(
    responseBody && typeof responseBody === 'object',
    `${basename(entryPath)} should return JSON body, got ${String(responseBody)}`
  )
  assert(
    'error' in (responseBody as Record<string, unknown>),
    `${basename(entryPath)} JSON should include error field`
  )
}

async function main(): Promise<void> {
  const handlerFiles = collectApiHandlerEntrypoints()
  console.log(`Bundling ${handlerFiles.length} API handlers...`)

  const bundleFailures: string[] = []
  for (const entryPath of handlerFiles) {
    try {
      await assertHandlerBundles(entryPath)
    } catch (error) {
      bundleFailures.push(
        `${basename(entryPath)}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  if (bundleFailures.length > 0) {
    console.error('\nAPI bundle failures:\n')
    for (const message of bundleFailures) {
      console.error(`  - ${message}`)
    }
    process.exit(1)
  }

  console.log(`All ${handlerFiles.length} API handlers bundle successfully.`)

  console.log('\nSmoke-testing critical handlers (expect JSON auth/validation errors)...')
  for (const { file, method, body } of CRITICAL_HANDLERS) {
    const entryPath = join(process.cwd(), 'api', file)
    await assertHandlerReturnsJsonAuthError(entryPath, method, body)
    console.log(`  ✓ ${file}`)
  }

  console.log('\nverify-api-handlers: all checks passed')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
