import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  deletePendingSingleResourceAssignment,
  upsertPendingSingleResourceAssignment,
} from './roster-pending-assignments-shared.js'
import { assertIncidentOrExerciseWorkspace, authenticateRosterManager } from './roster-auth-shared.js'
import { validateOrgChartReportsToPosition } from './roster-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type Body = {
  workspaceId?: string
  memberId?: string
  orgChartReportsTo?: string
  scheduled?: boolean
}

function formatHandlerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Update single resource org chart placement failed.'
}

function parseBody(req: VercelRequest): Body {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Body
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as Body
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
    const orgChartReportsTo = body.orgChartReportsTo?.trim()
    const scheduled = body.scheduled === true

    if (!workspaceId || !memberId || !orgChartReportsTo) {
      return res.status(400).json({
        error: 'workspaceId, memberId, and orgChartReportsTo are required.',
      })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    await assertIncidentOrExerciseWorkspace(admin, workspaceId)
    const { userId } = await authenticateRosterManager(admin, accessToken, workspaceId)

    const { data: member, error: memberError } = await admin
      .from('workspace_members')
      .select('id, assignment_kind, status')
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (memberError || !member) {
      return res.status(404).json({ error: 'Roster member not found.' })
    }

    if (member.status === 'removed') {
      return res.status(400).json({ error: 'Cannot update a removed roster member.' })
    }

    if (member.assignment_kind !== 'single_resource') {
      return res.status(400).json({ error: 'Member is not a single resource.' })
    }

    const reportsToError = await validateOrgChartReportsToPosition(
      admin,
      workspaceId,
      orgChartReportsTo
    )
    if (reportsToError) {
      return res.status(400).json({ error: reportsToError })
    }

    if (scheduled) {
      await upsertPendingSingleResourceAssignment(admin, {
        workspaceId,
        memberId,
        orgChartReportsTo,
        createdBy: userId,
      })
    } else {
      const { error: updateError } = await admin
        .from('workspace_members')
        .update({
          org_chart_reports_to: orgChartReportsTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('workspace_id', workspaceId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await deletePendingSingleResourceAssignment(admin, workspaceId, memberId)
    }

    return res.status(200).json({ ok: true, memberId, orgChartReportsTo, scheduled })
  } catch (error) {
    return res.status(500).json({ error: formatHandlerError(error) })
  }
}
