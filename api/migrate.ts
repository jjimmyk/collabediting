import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'node:fs'
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

  let sql: string
  try {
    sql = readFileSync(
      join(process.cwd(), 'supabase/migrations/001_workspaces_roster_auth.sql'),
      'utf8'
    )
  } catch {
    return res.status(500).json({ error: 'Could not read migration file.' })
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
    await client.query(sql)
    return res.status(200).json({ ok: true, message: 'Schema migration applied.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed'
    return res.status(500).json({ error: message })
  } finally {
    await client.end()
  }
}
