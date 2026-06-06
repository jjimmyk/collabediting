#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationDir = join(__dirname, '../supabase/migrations')

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL

if (!connectionString) {
  console.log('Skipping database migrations (no Postgres connection string in environment).')
  process.exit(0)
}

const migrationFiles = readdirSync(migrationDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

if (migrationFiles.length === 0) {
  console.error('No migration files found.')
  process.exit(1)
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes('localhost')
    ? undefined
    : {
        rejectUnauthorized: false,
        requestCert: false,
      },
})

try {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  await client.connect()
  console.log(`Applying ${migrationFiles.length} migration file(s)…`)
  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationDir, file), 'utf8')
    await client.query(sql)
    console.log(`  applied ${file}`)
  }
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('ics201_documents', 'ics201_versions', 'ics201_section_crdt') ORDER BY table_name"
  )
  console.log(
    'ICS-201 tables:',
    tables.rows.map((row) => row.table_name).join(', ') || '(not found)'
  )
  console.log('Database migrations applied successfully.')
} catch (error) {
  console.error('Migration failed:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await client.end()
}
