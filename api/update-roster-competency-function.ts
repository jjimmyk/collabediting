import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { authenticateRosterManager } from './roster-auth-shared.js'
import {
  normalizeCompetencyFunctionLabel,
  resolveWorkspaceOrganizationId,
  upsertOrganizationCompetencyFunction,
} from './roster-competency-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type CompetencyTarget =
  | {
      kind: 'member_position'
      memberId: string
      positionName: string
    }
  | {
      kind: 'single_resource_member'
      memberId: string
    }
  | {
      kind: 'pending_single_resource'
      memberId: string
    }
  | {
      kind: 'scheduled_member'
      memberId: string
      positionName: string
      scheduleAction: 'assign_on_op_advance' | 'unassign_on_op_advance'
    }
  | {
      kind: 'position_asset'
      positionName: string
      assetKey: string
    }
  | {
      kind: 'scheduled_position_asset'
      positionName: string
      assetKey: string
      scheduleAction: 'assign_on_op_advance' | 'unassign_on_op_advance'
    }
  | {
      kind: 'org_chart_asset'
      assetKey: string
    }
  | {
      kind: 'pending_org_chart_asset'
      assetKey: string
    }

type UpdateCompetencyBody = {
  workspaceId?: string
  competencyFunction?: string | null
  target?: CompetencyTarget
}

function parseBody(req: VercelRequest): UpdateCompetencyBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as UpdateCompetencyBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as UpdateCompetencyBody
}

function isScheduleAction(value: unknown): value is 'assign_on_op_advance' | 'unassign_on_op_advance' {
  return value === 'assign_on_op_advance' || value === 'unassign_on_op_advance'
}

function parseTarget(raw: unknown): CompetencyTarget {
  if (!raw || typeof raw !== 'object') {
    throw new Error('target is required.')
  }
  const candidate = raw as Record<string, unknown>
  const kind = candidate.kind

  if (kind === 'member_position') {
    const memberId = typeof candidate.memberId === 'string' ? candidate.memberId.trim() : ''
    const positionName =
      typeof candidate.positionName === 'string' ? candidate.positionName.trim() : ''
    if (!memberId || !positionName) {
      throw new Error('memberId and positionName are required for member_position.')
    }
    return { kind, memberId, positionName }
  }

  if (kind === 'single_resource_member' || kind === 'pending_single_resource') {
    const memberId = typeof candidate.memberId === 'string' ? candidate.memberId.trim() : ''
    if (!memberId) {
      throw new Error('memberId is required.')
    }
    return { kind, memberId }
  }

  if (kind === 'scheduled_member') {
    const memberId = typeof candidate.memberId === 'string' ? candidate.memberId.trim() : ''
    const positionName =
      typeof candidate.positionName === 'string' ? candidate.positionName.trim() : ''
    if (!memberId || !positionName || !isScheduleAction(candidate.scheduleAction)) {
      throw new Error('memberId, positionName, and scheduleAction are required for scheduled_member.')
    }
    return {
      kind,
      memberId,
      positionName,
      scheduleAction: candidate.scheduleAction,
    }
  }

  if (kind === 'position_asset' || kind === 'scheduled_position_asset') {
    const positionName =
      typeof candidate.positionName === 'string' ? candidate.positionName.trim() : ''
    const assetKey = typeof candidate.assetKey === 'string' ? candidate.assetKey.trim() : ''
    if (!positionName || !assetKey) {
      throw new Error('positionName and assetKey are required.')
    }
    if (kind === 'scheduled_position_asset') {
      if (!isScheduleAction(candidate.scheduleAction)) {
        throw new Error('scheduleAction is required for scheduled_position_asset.')
      }
      return {
        kind,
        positionName,
        assetKey,
        scheduleAction: candidate.scheduleAction,
      }
    }
    return { kind, positionName, assetKey }
  }

  if (kind === 'org_chart_asset' || kind === 'pending_org_chart_asset') {
    const assetKey = typeof candidate.assetKey === 'string' ? candidate.assetKey.trim() : ''
    if (!assetKey) {
      throw new Error('assetKey is required for org chart asset targets.')
    }
    return { kind, assetKey }
  }

  throw new Error('Invalid competency target kind.')
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
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required.' })
    }

    const target = parseTarget(body.target)
    const competencyFunction = normalizeCompetencyFunctionLabel(body.competencyFunction ?? null)

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { userId } = await authenticateRosterManager(admin, accessToken, workspaceId)
    const organizationId = await resolveWorkspaceOrganizationId(admin, workspaceId)

    if (competencyFunction) {
      await upsertOrganizationCompetencyFunction(admin, organizationId, competencyFunction, userId)
    }

    switch (target.kind) {
      case 'member_position': {
        const { error } = await admin
          .from('workspace_member_positions')
          .update({ competency_function: competencyFunction })
          .eq('member_id', target.memberId)
          .eq('ics_position', target.positionName)
        if (error) throw new Error(error.message)
        break
      }
      case 'single_resource_member': {
        const { error } = await admin
          .from('workspace_members')
          .update({ competency_function: competencyFunction })
          .eq('id', target.memberId)
          .eq('workspace_id', workspaceId)
          .eq('assignment_kind', 'single_resource')
        if (error) throw new Error(error.message)
        break
      }
      case 'pending_single_resource': {
        const { error } = await admin
          .from('workspace_member_pending_assignments')
          .update({ competency_function: competencyFunction })
          .eq('workspace_id', workspaceId)
          .eq('member_id', target.memberId)
        if (error) throw new Error(error.message)
        break
      }
      case 'scheduled_member': {
        const { error } = await admin
          .from('workspace_position_member_schedules')
          .update({ competency_function: competencyFunction })
          .eq('workspace_id', workspaceId)
          .eq('member_id', target.memberId)
          .eq('position_name', target.positionName)
          .eq('schedule_action', target.scheduleAction)
        if (error) throw new Error(error.message)
        break
      }
      case 'position_asset': {
        const { error } = await admin
          .from('workspace_position_asset_assignments')
          .update({ competency_function: competencyFunction })
          .eq('workspace_id', workspaceId)
          .eq('position_name', target.positionName)
          .eq('asset_key', target.assetKey)
        if (error) throw new Error(error.message)
        break
      }
      case 'scheduled_position_asset': {
        const { error } = await admin
          .from('workspace_position_asset_schedules')
          .update({ competency_function: competencyFunction })
          .eq('workspace_id', workspaceId)
          .eq('position_name', target.positionName)
          .eq('asset_key', target.assetKey)
          .eq('schedule_action', target.scheduleAction)
        if (error) throw new Error(error.message)
        break
      }
      case 'org_chart_asset': {
        const { error } = await admin
          .from('workspace_asset_assignments')
          .update({ competency_function: competencyFunction })
          .eq('workspace_id', workspaceId)
          .eq('asset_key', target.assetKey)
        if (error) throw new Error(error.message)
        break
      }
      case 'pending_org_chart_asset': {
        const { error } = await admin
          .from('workspace_asset_pending_org_chart')
          .update({ competency_function: competencyFunction })
          .eq('workspace_id', workspaceId)
          .eq('asset_key', target.assetKey)
        if (error) throw new Error(error.message)
        break
      }
    }

    return res.status(200).json({ ok: true, competencyFunction })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update competency function failed.'
    const status = message.includes('permission') ? 403 : 500
    return res.status(status).json({ error: message })
  }
}
