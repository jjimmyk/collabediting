import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

const CHECK_IN_STATUSES = new Set([
  'not_arrived',
  'checked_in',
  'checked_out',
  'demobilizing',
  'demobilized',
])

type UpdateCheckInBody = {
  workspaceId?: string
  memberId?: string
  checkInStatus?: string
}

function parseBody(req: VercelRequest): UpdateCheckInBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateCheckInBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateCheckInBody
}

async function userHasActiveWorkspaceMembership(
  admin: SupabaseClient,
  userId: string,
  workspaceId: string,
  isOrgAdmin: boolean
): Promise<boolean> {
  if (isOrgAdmin) {
    return true
  }

  const { data: membership, error: membershipError } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return !membershipError && membership !== null
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
    const workspaceId = body.workspaceId?.trim()
    const memberId = body.memberId?.trim()
    const checkInStatus = body.checkInStatus?.trim()

    if (!workspaceId || !memberId || !checkInStatus) {
      return res.status(400).json({ error: 'workspaceId, memberId, and checkInStatus are required.' })
    }

    if (!CHECK_IN_STATUSES.has(checkInStatus)) {
      return res.status(400).json({ error: 'Invalid check-in status.' })
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

    const canEdit = await userHasActiveWorkspaceMembership(
      admin,
      user.id,
      workspaceId,
      profile?.is_org_admin === true
    )

    if (!canEdit) {
      return res.status(403).json({ error: 'You do not have permission to update check-in status.' })
    }

    const { data: member, error: memberError } = await admin
      .from('workspace_members')
      .select('id, workspace_id, status')
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (memberError || !member) {
      return res.status(404).json({ error: 'Roster member not found.' })
    }

    if (member.status === 'removed') {
      return res.status(400).json({ error: 'Cannot update check-in status for a removed member.' })
    }

    const { error: updateError } = await admin
      .from('workspace_members')
      .update({ check_in_status: checkInStatus })
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    return res.status(200).json({ ok: true, checkInStatus })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update check-in status failed.'
    return res.status(500).json({ error: message })
  }
}
