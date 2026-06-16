import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  fetchWorkspacePositionAllowlist,
  parseIcsPositionsInput,
  replaceWorkspaceMemberPositions,
} from './roster-shared.js'

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

type UpdateRosterMemberBody = {
  memberId?: string
  icsPositions?: string[]
}

function formatHandlerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }
  return 'Update roster member failed.'
}

async function userCanManageWorkspaceRoster(
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
    .select('id, workspace_member_positions (ics_position)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    return false
  }

  const positions = (membership.workspace_member_positions ?? [])
    .map((row) => row.ics_position)
    .filter((position): position is string => typeof position === 'string')

  return positions.some((position) => ROSTER_MANAGER_POSITIONS.has(position))
}

function parseBody(req: VercelRequest): UpdateRosterMemberBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateRosterMemberBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateRosterMemberBody
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
    const memberId = body.memberId?.trim()

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const { data: member, error: memberError } = await admin
      .from('workspace_members')
      .select('id, workspace_id, status')
      .eq('id', memberId)
      .maybeSingle()

    if (memberError || !member) {
      return res.status(404).json({ error: 'Roster member not found.' })
    }

    if (member.status === 'removed') {
      return res.status(400).json({ error: 'Cannot update a removed roster member.' })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('is_org_admin')
      .eq('id', user.id)
      .maybeSingle()

    const canManage = await userCanManageWorkspaceRoster(
      admin,
      user.id,
      member.workspace_id,
      profile?.is_org_admin === true
    )

    if (!canManage) {
      return res.status(403).json({ error: 'You do not have permission to update roster members.' })
    }

    const allowed = await fetchWorkspacePositionAllowlist(admin, member.workspace_id)
    const icsPositions = parseIcsPositionsInput(body, undefined, allowed)

    if (icsPositions.length === 0) {
      return res.status(400).json({
        error: 'At least one valid icsPosition is required.',
      })
    }

    const assigned = await replaceWorkspaceMemberPositions(
      admin,
      memberId,
      icsPositions,
      allowed
    )

    return res.status(200).json({
      ok: true,
      memberId,
      icsPositions: assigned,
    })
  } catch (error) {
    return res.status(500).json({ error: formatHandlerError(error) })
  }
}
