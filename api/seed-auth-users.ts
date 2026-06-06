import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

const SEED_USERS = [
  { email: 'jimmy.king@disastertech.com', password: 'Pratus!!!' },
  { email: 'jamespking47@gmail.com', password: 'Pratus!!!' },
] as const

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  let page = 1
  const perPage = 200

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) {
      return match.id
    }

    if (data.users.length < perPage) {
      break
    }
    page += 1
  }

  return null
}

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
  const results: Array<{ email: string; action: 'created' | 'updated' }> = []

  for (const seedUser of SEED_USERS) {
    const email = seedUser.email.toLowerCase()
    const existingUserId = await findUserIdByEmail(admin, email)

    if (existingUserId) {
      const { error } = await admin.auth.admin.updateUserById(existingUserId, {
        password: seedUser.password,
        email_confirm: true,
        user_metadata: { password_set: true },
      })
      if (error) {
        return res.status(500).json({ error: error.message, email })
      }
      results.push({ email, action: 'updated' })
      continue
    }

    const { error } = await admin.auth.admin.createUser({
      email,
      password: seedUser.password,
      email_confirm: true,
      user_metadata: { password_set: true },
    })

    if (error) {
      return res.status(500).json({ error: error.message, email })
    }

    results.push({ email, action: 'created' })
  }

  return res.status(200).json({ ok: true, results })
}
