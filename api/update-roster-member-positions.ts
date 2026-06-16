import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
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

type UpdateRosterMemberBody = {
  memberId?: string
  icsPositions?: string[]
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

    if (!profile?.is_org_admin) {
      const { data: canManage } = await admin.rpc('current_user_is_roster_manager', {
        p_workspace_id: member.workspace_id,
      })

      if (!canManage) {
        return res.status(403).json({ error: 'You do not have permission to update roster members.' })
      }
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
    const message = error instanceof Error ? error.message : 'Update roster member failed.'
    return res.status(500).json({ error: message })
  }
}
