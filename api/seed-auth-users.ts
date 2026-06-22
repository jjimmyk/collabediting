import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  ensureAuthUser,
  syncDefaultRosterAcrossWorkspaces,
} from './roster-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

const SEED_USERS = [
  { email: 'jimmy.king@disastertech.com', password: 'Pratus!!!' },
  { email: 'jamespking47@gmail.com', password: 'Pratus!!!' },
  { email: 'sean@disastertech.com', password: 'Pratus!!!' },
  { email: 'carlton.landry@disastertech.com', password: 'Pratus!!!' },
  { email: 'michael.baccigalopi@disastertech.com', password: 'Pratus!!!' },
  { email: 'daniel.dunn190@gmail.com', password: 'Pratus!!!' },
  { email: 'nicolle.bogden@disastertech.com', password: 'Pratus!!!' },
] as const

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.MIGRATION_SECRET
  if (!secret) {
    return res.status(503).json({ error: 'MIGRATION_SECRET is not configured.' })
  }

  const provided =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ??
    (typeof req.headers['x-migration-secret'] === 'string'
      ? req.headers['x-migration-secret']
      : null)

  if (provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return res.status(503).json({ error: 'Supabase server environment is not configured.' })
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
  const results: Array<{
    email: string
    action: 'created' | 'updated'
    rosterRows: number
  }> = []

  for (const seedUser of SEED_USERS) {
    const email = seedUser.email.toLowerCase()
    const authResult = await ensureAuthUser(admin, email, seedUser.password, {
      allowPasswordOverwrite: true,
    })
    if (!authResult.ok) {
      continue
    }
    const { rosterRows } = await syncDefaultRosterAcrossWorkspaces(
      admin,
      authResult.userId,
      email
    )
    results.push({ email, action: authResult.action, rosterRows })
  }

  return res.status(200).json({ ok: true, results })
}
