import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  MIN_AUTH_PASSWORD_LENGTH,
  provisionWorkspaceRosterMember,
} from './roster-shared.js'
import { parseIcsPositionsInput, upsertWorkspaceMemberWithPositions } from './roster-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
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
  icsPositions?: string[]
  redirectTo?: string
  password?: string
  confirmPasswordOverwrite?: boolean
}

function getAppUrl(): string {
  return (
    process.env.VITE_APP_URL ??
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://thehub-6426.vercel.app')
  ).replace(/\/$/, '')
}

function getAppCallbackUrl(workspaceId: string): string {
  return `${getAppUrl()}/auth/callback?workspace=${encodeURIComponent(workspaceId)}`
}

function parseInviteBody(req: VercelRequest): InviteBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as InviteBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as InviteBody
}

async function sendInviteEmailViaResend(params: {
  apiKey: string
  fromAddress: string
  to: string
  subject: string
  signInLink: string
  intro: string
}): Promise<{ ok: true } | { ok: false; details: string }> {
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.fromAddress,
      to: [params.to],
      subject: params.subject,
      html: `
        <p>${params.intro}</p>
        <p>Click the link below to accept your invitation and create your password. This link expires in about one hour.</p>
        <p><a href="${params.signInLink}">Accept invitation</a></p>
        <p>If you did not expect this email, you can ignore it.</p>
      `,
    }),
  })

  if (!emailResponse.ok) {
    const details = await emailResponse.text().catch(() => '')
    return { ok: false, details: details.slice(0, 300) }
  }

  return { ok: true }
}

async function sendInviteEmail(params: {
  admin: SupabaseClient
  email: string
  redirectTo: string
  workspaceLabel?: string
}): Promise<{ method: string; warning?: string }> {
  const { admin, email, redirectTo } = params
  const resendKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.SIGN_IN_EMAIL_FROM ?? 'Pratus <onboarding@resend.dev>'
  const intro = params.workspaceLabel
    ? `You have been invited to join the ${params.workspaceLabel} workspace in Pratus.`
    : 'You have been invited to join a Pratus workspace.'

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { password_set: false },
  })

  if (!inviteError) {
    return { method: 'supabase_invite' }
  }

  const inviteMessage = inviteError.message.toLowerCase()
  const userAlreadyExists =
    inviteMessage.includes('already') ||
    inviteMessage.includes('registered') ||
    inviteMessage.includes('exists')

  if (!userAlreadyExists) {
    throw inviteError
  }

  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (linkError || !data.properties.action_link) {
    throw linkError ?? new Error('Could not generate invitation link for an existing user.')
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

  return {
    method: 'roster_only_existing_user',
    warning:
      'Roster updated. This person already has a Pratus account — share the workspace name and ask them to sign in with their email and password. To email existing users automatically, add RESEND_API_KEY in Vercel.',
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(503).json({ error: 'Supabase server environment is not configured.' })
    }

    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const body = parseInviteBody(req)
    const workspaceId = body.workspaceId?.trim()
    const email = body.email?.trim().toLowerCase()
    const icsPosition = body.icsPosition?.trim()
    const icsPositions = parseIcsPositionsInput(body, icsPosition)
    const password = typeof body.password === 'string' ? body.password : ''
    const confirmPasswordOverwrite = body.confirmPasswordOverwrite === true
    const hasPassword = password.length > 0

    if (!workspaceId || !email || icsPositions.length === 0) {
      return res.status(400).json({
        error: 'workspaceId, email, and at least one icsPosition are required.',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' })
    }

    if (hasPassword && password.length < MIN_AUTH_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters.`,
        code: 'password_too_short',
      })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

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

    if (hasPassword) {
      const provisioned = await provisionWorkspaceRosterMember(admin, {
        workspaceId,
        email,
        icsPositions,
        password,
        invitedBy: user.id,
        confirmPasswordOverwrite,
      })

      if (!provisioned.ok) {
        if (provisioned.code === 'user_exists') {
          return res.status(409).json({
            error:
              'This email already has a Pratus account. Confirm to replace their password and add them to this workspace.',
            code: 'user_exists',
          })
        }
        return res.status(400).json({
          error: `Password must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters.`,
          code: provisioned.code,
        })
      }

      return res.status(200).json({
        ok: true,
        method: 'direct_provision',
        action: provisioned.action,
      })
    }

    await upsertWorkspaceMemberWithPositions(admin, {
      workspaceId,
      email,
      icsPositions,
      status: 'invited',
      invitedBy: user.id,
    })

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invite failed.'
    console.error('invite handler error', error)
    return res.status(500).json({ error: message })
  }
}
