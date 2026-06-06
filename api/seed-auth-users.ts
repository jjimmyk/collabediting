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

async function ensureAuthUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  password: string
): Promise<{ userId: string; action: 'created' | 'updated' }> {
  const existingUserId = await findUserIdByEmail(admin, email)

  if (existingUserId) {
    const { error } = await admin.auth.admin.updateUserById(existingUserId, {
      password,
      email_confirm: true,
      user_metadata: { password_set: true },
    })
    if (error) {
      throw error
    }
    return { userId: existingUserId, action: 'updated' }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { password_set: true },
  })

  if (error || !data.user) {
    throw error ?? new Error(`Could not create auth user for ${email}.`)
  }

  return { userId: data.user.id, action: 'created' }
}

async function syncProfileAndRoster(
  admin: ReturnType<typeof createClient>,
  userId: string,
  email: string
): Promise<{ rosterRows: number }> {
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: email.split('@')[0],
      is_org_admin: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    throw profileError
  }

  const { data: workspaces, error: workspacesError } = await admin
    .from('workspaces')
    .select('id')

  if (workspacesError) {
    throw workspacesError
  }

  let rosterRows = 0
  for (const workspace of workspaces ?? []) {
    const { error: rosterError } = await admin.from('workspace_members').upsert(
      {
        workspace_id: workspace.id,
        email,
        ics_position: 'Incident Commander',
        status: 'active',
        user_id: userId,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,email' }
    )

    if (rosterError) {
      throw rosterError
    }
    rosterRows += 1
  }

  return { rosterRows }
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
  const results: Array<{
    email: string
    action: 'created' | 'updated'
    rosterRows: number
  }> = []

  for (const seedUser of SEED_USERS) {
    const email = seedUser.email.toLowerCase()
    const { userId, action } = await ensureAuthUser(admin, email, seedUser.password)
    const { rosterRows } = await syncProfileAndRoster(admin, userId, email)
    results.push({ email, action, rosterRows })
  }

  return res.status(200).json({ ok: true, results })
}
