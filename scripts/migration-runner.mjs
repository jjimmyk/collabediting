import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ENSURE_TRACKING_TABLE_SQL = `
create table if not exists public.schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);
`

/**
 * @param {import('pg').Client} client
 */
export async function ensureTrackingTable(client) {
  await client.query(ENSURE_TRACKING_TABLE_SQL)
}

/**
 * @param {string} migrationsDir
 */
export function listMigrationFiles(migrationsDir) {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
}

/**
 * @param {import('pg').Client} client
 * @returns {Promise<Set<string>>}
 */
export async function getAppliedMigrations(client) {
  await ensureTrackingTable(client)
  const { rows } = await client.query(
    'select filename from public.schema_migrations order by filename'
  )
  return new Set(rows.map((row) => row.filename))
}

/**
 * @param {import('pg').Client} client
 */
export async function hasExistingSchema(client) {
  const { rows } = await client.query(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'workspaces'
    ) as exists`
  )
  return rows[0]?.exists === true
}

/**
 * Record migrations as applied without executing SQL (existing DB bootstrap).
 * @param {import('pg').Client} client
 * @param {string[]} files
 */
export async function baselineMigrations(client, files) {
  if (files.length === 0) return
  await ensureTrackingTable(client)
  for (const file of files) {
    await client.query(
      `insert into public.schema_migrations (filename)
       values ($1)
       on conflict (filename) do nothing`,
      [file]
    )
  }
}

/**
 * @param {import('pg').Client} client
 * @param {string} migrationsDir
 * @param {{ verbose?: boolean }} [options]
 */
export async function runPendingMigrations(client, migrationsDir, options = {}) {
  const { verbose = true } = options
  const dir = resolve(migrationsDir)
  const files = listMigrationFiles(dir)

  if (files.length === 0) {
    return { applied: [], skipped: [], baselined: false }
  }

  await ensureTrackingTable(client)
  let appliedSet = await getAppliedMigrations(client)

  if (appliedSet.size === 0 && (await hasExistingSchema(client))) {
    await baselineMigrations(client, files)
    if (verbose) {
      console.log(
        `Baselined ${files.length} migration(s) on existing database (no SQL re-run).`
      )
    }
    return { applied: [], skipped: files, baselined: true }
  }

  const applied = []
  const skipped = []

  for (const file of files) {
    if (appliedSet.has(file)) {
      skipped.push(file)
      if (verbose) {
        console.log(`↷ ${file} (already applied)`)
      }
      continue
    }

    const sql = readFileSync(join(dir, file), 'utf8')
    if (verbose) {
      console.log(`→ ${file}`)
    }

    await client.query('begin')
    try {
      await client.query(sql)
      await client.query(
        `insert into public.schema_migrations (filename) values ($1)`,
        [file]
      )
      await client.query('commit')
      applied.push(file)
      appliedSet.add(file)
    } catch (error) {
      await client.query('rollback')
      throw error
    }
  }

  return { applied, skipped, baselined: false }
}
