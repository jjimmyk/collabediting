import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { authenticateRosterManager } from './roster-auth-shared.js'
import { addIcsWorkspaceMemberWithEffectiveWhen } from './roster-member-add-shared.js'
import {
  assertUserInWorkspaceOrganization,
  getWorkspaceOrganizationId,
} from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type AssignOrgMemberBody = {
  workspaceId?: string
  userId?: string
  icsPosition?: string
  scheduleOnOpAdvance?: boolean
}

function parseBody(req: VercelRequest): AssignOrgMemberBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as AssignOrgMemberBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as AssignOrgMemberBody
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
    const icsPosition = body.icsPosition?.trim()
    const scheduleOnOpAdvance = body.scheduleOnOpAdvance === true

    if (!workspaceId || !userId || !icsPosition) {
      return res.status(400).json({ error: 'workspaceId, userId, and icsPosition are required.' })
    }

    if (scheduleOnOpAdvance) {
      return res.status(400).json({
        error: 'Position-row org assignment does not support schedule-on-op-advance yet.',
      })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { userId: invitedBy } = await authenticateRosterManager(admin, accessToken, workspaceId)

    await assertUserInWorkspaceOrganization(admin, workspaceId, userId)

    const organizationId = await getWorkspaceOrganizationId(admin, workspaceId)

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email')
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
      const { data: existingPositions, error: positionsError } = await admin
        .from('workspace_member_positions')
        .select('ics_position')
        .eq('member_id', existingMember.id)

      if (positionsError) {
        throw new Error(positionsError.message)
      }

      const positions = (existingPositions ?? [])
        .map((row) => row.ics_position)
        .filter((value): value is string => typeof value === 'string')

      if (positions.includes(icsPosition)) {
        return res.status(409).json({ error: 'That person is already assigned to this position.' })
      }

      const nextPositions = [...positions, icsPosition].sort((a, b) => a.localeCompare(b))

      const { error: positionInsertError } = await admin.from('workspace_member_positions').upsert(
        {
          member_id: existingMember.id,
          ics_position: icsPosition,
        },
        { onConflict: 'member_id,ics_position' }
      )

      if (positionInsertError) {
        throw new Error(positionInsertError.message)
      }

      const { error: memberUpdateError } = await admin
        .from('workspace_members')
        .update({ ics_position: nextPositions[0] ?? icsPosition })
        .eq('id', existingMember.id)

      if (memberUpdateError) {
        throw new Error(memberUpdateError.message)
      }

      return res.status(200).json({ ok: true, memberId: existingMember.id, organizationId })
    }

    const member = await addIcsWorkspaceMemberWithEffectiveWhen(admin, {
      workspaceId,
      email,
      icsPositions: [icsPosition],
      scheduleOnOpAdvance: false,
      status: 'active',
      userId: profile.id,
      invitedBy,
      joinedAt: new Date().toISOString(),
    })

    return res.status(200).json({
      ok: true,
      memberId: member.memberId,
      organizationId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Assign organization member failed.'
    if (message === 'Invalid or expired session.') {
      return res.status(401).json({ error: message })
    }
    if (message === 'You do not have permission to manage roster assignments.') {
      return res.status(403).json({ error: message })
    }
    console.error('assign-org-member-to-position handler error', error)
    return res.status(500).json({ error: message })
  }
}
