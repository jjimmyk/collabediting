import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

function getAppUrl(): string {
  return (
    process.env.VITE_APP_URL ??
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://thehub-6426.vercel.app')
  )
}

const ROSTER_MANAGER_POSITIONS = new Set([
  'Incident Commander',
  'Planning Section Chief',
  'Operations Section Chief',
])

type InviteBody = {
  workspaceId?: string
  email?: string
  icsPosition?: string
  redirectTo?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: 'Supabase server environment is not configured.' })
  }

  const authHeader = req.headers.authorization
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null

  if (!accessToken) {
    return res.status(401).json({ error: 'Missing authorization token.' })
  }

  const body = req.body as InviteBody
  const workspaceId = body.workspaceId?.trim()
  const email = body.email?.trim().toLowerCase()
  const icsPosition = body.icsPosition?.trim()
  const redirectTo = body.redirectTo?.trim()

  if (!workspaceId || !email || !icsPosition) {
    return res.status(400).json({ error: 'workspaceId, email, and icsPosition are required.' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: profile } = await admin
    .from('profiles')
    .select('is_org_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_org_admin) {
    const { data: membership } = await admin
      .from('workspace_members')
      .select('ics_position, status')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership || !ROSTER_MANAGER_POSITIONS.has(membership.ics_position)) {
      return res.status(403).json({ error: 'You do not have permission to invite roster members.' })
    }
  }

  const { error: upsertError } = await admin.from('workspace_members').upsert(
    {
      workspace_id: workspaceId,
      email,
      ics_position: icsPosition,
      status: 'invited',
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id,email' }
  )

  if (upsertError) {
    return res.status(400).json({ error: upsertError.message })
  }

  const inviteRedirect =
    redirectTo && redirectTo.startsWith('http')
      ? redirectTo
      : `${getAppUrl()}/accept-invite?workspace=${workspaceId}`

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteRedirect,
  })

  if (inviteError) {
    return res.status(200).json({
      ok: true,
      emailWarning:
        inviteError.message ??
        'Roster updated, but the invitation email could not be sent. The member can still sign in with a magic link if they were already registered.',
    })
  }

  return res.status(200).json({ ok: true })
}
