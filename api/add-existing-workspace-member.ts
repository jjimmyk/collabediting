import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { authenticateRosterManager } from './roster-auth-shared.js'
import {
  parseIcsPositionsInput,
  upsertWorkspaceMemberAsSingleResource,
  upsertWorkspaceMemberWithPositions,
  fetchWorkspacePositionAllowlist,
  type MemberAssignmentKind,
} from './roster-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type AddExistingWorkspaceMemberBody = {
  workspaceId?: string
  userId?: string
  assignmentKind?: MemberAssignmentKind
  icsPositions?: string[]
  orgChartReportsTo?: string
}

function parseBody(req: VercelRequest): AddExistingWorkspaceMemberBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as AddExistingWorkspaceMemberBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as AddExistingWorkspaceMemberBody
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
    const userId = body.userId?.trim()
    const assignmentKind: MemberAssignmentKind =
      body.assignmentKind === 'single_resource' ? 'single_resource' : 'ics_position'

    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'workspaceId and userId are required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { userId: invitedBy } = await authenticateRosterManager(admin, accessToken, workspaceId)

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      throw new Error(profileError.message)
    }
    if (!profile?.email) {
      return res.status(404).json({ error: 'Person not found.' })
    }

    const email = profile.email.trim().toLowerCase()

    const { data: existingMember } = await admin
      .from('workspace_members')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('email', email)
      .maybeSingle()

    if (existingMember && existingMember.status !== 'removed') {
      return res.status(409).json({ error: 'That person is already on the roster.' })
    }

    if (assignmentKind === 'single_resource') {
      const orgChartReportsTo = body.orgChartReportsTo?.trim()
      if (!orgChartReportsTo) {
        return res.status(400).json({ error: 'orgChartReportsTo is required for single resource members.' })
      }

      const member = await upsertWorkspaceMemberAsSingleResource(admin, {
        workspaceId,
        email,
        orgChartReportsTo,
        status: 'active',
        userId: profile.id,
        invitedBy,
        joinedAt: new Date().toISOString(),
      })

      return res.status(200).json({
        ok: true,
        memberId: member.memberId,
        assignmentKind: 'single_resource',
      })
    }

    const allowed = await fetchWorkspacePositionAllowlist(admin, workspaceId)
    const icsPositions = parseIcsPositionsInput(body, undefined, allowed)
    if (icsPositions.length === 0) {
      return res.status(400).json({ error: 'Select at least one ICS position.' })
    }

    const member = await upsertWorkspaceMemberWithPositions(admin, {
      workspaceId,
      email,
      icsPositions,
      status: 'active',
      userId: profile.id,
      invitedBy,
      joinedAt: new Date().toISOString(),
    })

    return res.status(200).json({
      ok: true,
      memberId: member.memberId,
      assignmentKind: 'ics_position',
      icsPositions: member.icsPositions,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Add existing member failed.'
    console.error('add-existing-workspace-member handler error', error)
    return res.status(500).json({ error: message })
  }
}
