import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { getAppCallbackUrl, getInviteEmailFromAddress, sendInviteEmailViaResend } from './lib/invite-email'

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

async function sendInviteEmail(params: {
  admin: ReturnType<typeof createClient>
  email: string
  redirectTo: string
  workspaceLabel?: string
}): Promise<{ method: string; warning?: string }> {
  const { admin, email, redirectTo } = params
  const existingUserId = await findUserIdByEmail(admin, email)
  const resendKey = process.env.RESEND_API_KEY
  const fromAddress = getInviteEmailFromAddress()
  const intro = params.workspaceLabel
    ? `You have been invited to join the ${params.workspaceLabel} workspace in Pratus.`
    : 'You have been invited to join a Pratus workspace.'

  if (!existingUserId) {
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { password_set: false },
    })
    if (error) {
      throw error
    }
    return { method: 'supabase_invite' }
  }

  const linkType = 'magiclink' as const
  const { data, error } = await admin.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo },
  })

  if (error || !data.properties.action_link) {
    throw error ?? new Error('Could not generate invitation link.')
  }

  if (resendKey) {
    const sent = await sendInviteEmailViaResend({
      apiKey: resendKey,
      fromAddress,
      to: email,
      subject: 'You are invited to Pratus',
      signInLink: data.properties.action_link,
      intro,
    })
    if (!sent.ok) {
      throw new Error(sent.details || 'Could not send invitation email.')
    }
    return { method: 'resend_existing_user' }
  }

  const { error: otpError } = await admin.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })

  if (otpError) {
    return {
      method: 'roster_only',
      warning:
        otpError.message ??
        'Roster updated, but the invitation email could not be sent because of rate limits. Ask the member to sign in with email and password if they already have an account.',
    }
  }

  return { method: 'supabase_otp_existing_user' }
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

  const { data: workspace } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .maybeSingle()

  const { error: upsertError } = await admin.from('workspace_members').upsert(
    {
      workspace_id: workspaceId,
      email,
      ics_position: icsPosition,
      status: 'invited',
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      user_id: null,
      joined_at: null,
    },
    { onConflict: 'workspace_id,email' }
  )

  if (upsertError) {
    return res.status(400).json({ error: upsertError.message })
  }

  const inviteRedirect = getAppCallbackUrl(workspaceId)

  try {
    const delivery = await sendInviteEmail({
      admin,
      email,
      redirectTo: inviteRedirect,
      workspaceLabel: workspace?.name,
    })

    if (delivery.warning) {
      return res.status(200).json({ ok: true, method: delivery.method, emailWarning: delivery.warning })
    }

    return res.status(200).json({ ok: true, method: delivery.method })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invitation email failed.'
    return res.status(200).json({
      ok: true,
      emailWarning: `Roster updated, but the invitation email could not be sent: ${message}`,
    })
  }
}
