import type { VercelRequest, VercelResponse } from '@vercel/node'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import pg from 'pg'

type MigrationRunResult = {
  applied: string[]
  skipped: string[]
  baselined: boolean
}

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

  const migrationDir = join(process.cwd(), 'supabase/migrations')
  const runnerUrl = pathToFileURL(
    join(process.cwd(), 'scripts/migration-runner.mjs')
  ).href

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
    const { runPendingMigrations } = (await import(runnerUrl)) as {
      runPendingMigrations: (
        client: pg.Client,
        migrationsDir: string,
        options?: { verbose?: boolean }
      ) => Promise<MigrationRunResult>
    }

    await client.connect()
    const result = await runPendingMigrations(client, migrationDir, { verbose: false })

    return res.status(200).json({
      ok: true,
      message: result.baselined
        ? 'Existing database baselined; migration tracking enabled.'
        : result.applied.length > 0
          ? 'New schema migrations applied.'
          : 'No new migrations to apply.',
      baselined: result.baselined,
      applied: result.applied,
      skipped: result.skipped,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed'
    return res.status(500).json({ error: message })
  } finally {
    await client.end()
  }
}
