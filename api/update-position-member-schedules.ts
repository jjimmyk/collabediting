import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { replacePositionMemberSchedules } from './roster-member-schedules-shared.js'

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

type UpdateSchedulesBody = {
  workspaceId?: string
  positionName?: string
  assignMemberIds?: string[]
  unassignMemberIds?: string[]
}

function formatHandlerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Update position member schedules failed.'
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

function parseBody(req: VercelRequest): UpdateSchedulesBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateSchedulesBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateSchedulesBody
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
    const positionName = body.positionName?.trim()

    if (!workspaceId || !positionName) {
      return res.status(400).json({ error: 'workspaceId and positionName are required.' })
    }

    const assignMemberIds = Array.isArray(body.assignMemberIds)
      ? body.assignMemberIds.filter((entry): entry is string => typeof entry === 'string')
      : []
    const unassignMemberIds = Array.isArray(body.unassignMemberIds)
      ? body.unassignMemberIds.filter((entry): entry is string => typeof entry === 'string')
      : []

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

    const canManage = await userCanManageWorkspaceRoster(
      admin,
      user.id,
      workspaceId,
      profile?.is_org_admin === true
    )

    if (!canManage) {
      return res.status(403).json({ error: 'You do not have permission to update roster schedules.' })
    }

    const result = await replacePositionMemberSchedules(admin, {
      workspaceId,
      positionName,
      assignMemberIds,
      unassignMemberIds,
      createdBy: user.id,
    })

    return res.status(200).json({ ok: true, ...result })
  } catch (error) {
    return res.status(500).json({ error: formatHandlerError(error) })
  }
}
