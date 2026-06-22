import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  ensureOrganizationMembership,
  userIsOrgAdminForOrganization,
} from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type InviteOrganizationMemberBody = {
  organizationId?: string
  email?: string
}

function parseBody(req: VercelRequest): InviteOrganizationMemberBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as InviteOrganizationMemberBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as InviteOrganizationMemberBody
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

    const body = parseBody(req)
    const organizationId = body.organizationId?.trim()
    const email = body.email?.trim().toLowerCase()

    if (!organizationId || !email) {
      return res.status(400).json({ error: 'organizationId and email are required.' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const canInvite = await userIsOrgAdminForOrganization(admin, user.id, organizationId)
    if (!canInvite) {
      return res.status(403).json({ error: 'You do not have permission to invite organization members.' })
    }

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    await ensureOrganizationMembership(admin, {
      organizationId,
      email,
      userId: existingProfile?.id ?? null,
      role: 'member',
      status: existingProfile ? 'active' : 'invited',
      invitedBy: user.id,
      joinedAt: existingProfile ? new Date().toISOString() : null,
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invite organization member failed.'
    console.error('invite-organization-member handler error', error)
    return res.status(500).json({ error: message })
  }
}
