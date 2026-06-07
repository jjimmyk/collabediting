#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

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
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log(`Applying ${migrationFiles.length} Supabase migration(s)…`)
  for (const file of migrationFiles) {
    const migrationPath = resolve(migrationsDir, file)
    const sql = readFileSync(migrationPath, 'utf8')
    console.log(`→ ${file}`)
    await client.query(sql)
  }
  console.log('Schema applied successfully.')
} catch (error) {
  console.error('Migration failed:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await client.end()
}
