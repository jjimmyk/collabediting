import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.MIGRATION_SECRET
  if (!secret) {
    return res.status(503).json({
      error: 'MIGRATION_SECRET is not configured on this deployment.',
    })
  }

  const provided =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ??
    (typeof req.headers['x-migration-secret'] === 'string'
      ? req.headers['x-migration-secret']
      : null)

  if (provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL

  if (!connectionString) {
    return res.status(503).json({
      error: 'Database connection string is not available in this environment.',
    })
  }

  let migrationFiles: string[]
  const migrationDir = join(process.cwd(), 'supabase/migrations')
  try {
    migrationFiles = readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()
  } catch {
    return res.status(500).json({ error: 'Could not read migrations directory.' })
  }

  if (migrationFiles.length === 0) {
    return res.status(500).json({ error: 'No migration files found.' })
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
    // Supabase pooler certificates can fail default Node verification on Vercel.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    await client.connect()
    for (const file of migrationFiles) {
      const sql = readFileSync(join(migrationDir, file), 'utf8')
      await client.query(sql)
    }
    return res.status(200).json({
      ok: true,
      message: 'Schema migrations applied.',
      files: migrationFiles,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed'
    return res.status(500).json({ error: message })
  } finally {
    await client.end()
  }
}
