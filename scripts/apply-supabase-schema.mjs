#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { runPendingMigrations } from './migration-runner.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

for (const file of ['.env.vercel.production', '.env.local', '.env']) {
  loadEnvFile(resolve(process.cwd(), file))
}

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL

if (!connectionString) {
  console.error(
    'Missing POSTGRES_URL_NON_POOLING. Run: npx vercel env pull .env.vercel.production --environment=production'
  )
  process.exit(1)
}

const migrationsDir = resolve(__dirname, '../supabase/migrations')

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes('localhost')
    ? undefined
    : { rejectUnauthorized: false },
})

try {
  if (!connectionString.includes('localhost')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }
  await client.connect()
  const result = await runPendingMigrations(client, migrationsDir)

  if (result.baselined) {
    console.log('Schema migration tracking initialized.')
  } else if (result.applied.length === 0) {
    console.log('No new migrations to apply.')
  } else {
    console.log(`Applied ${result.applied.length} new migration(s).`)
  }

  if (result.skipped.length > 0 && !result.baselined) {
    console.log(`Skipped ${result.skipped.length} already-applied migration(s).`)
  }

  console.log('Done.')
} catch (error) {
  console.error('Migration failed:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await client.end()
}
