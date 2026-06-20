import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  AssetScheduleAction,
  WorkspacePositionAssetAssignmentRow,
  WorkspacePositionAssetScheduleRow,
} from '@/lib/workspace-position-asset-types'

type DbPositionAssetAssignmentRow = {
  id: string
  workspace_id: string
  position_name: string
  asset_key: string
  created_at: string
  created_by: string | null
}

type DbPositionAssetScheduleRow = {
  id: string
  workspace_id: string
  position_name: string
  asset_key: string
  schedule_action: AssetScheduleAction
  created_at: string
  created_by: string | null
}

function mapAssignmentRow(row: DbPositionAssetAssignmentRow): WorkspacePositionAssetAssignmentRow {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    positionName: row.position_name,
    assetKey: row.asset_key,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

function mapScheduleRow(row: DbPositionAssetScheduleRow): WorkspacePositionAssetScheduleRow {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    positionName: row.position_name,
    assetKey: row.asset_key,
    scheduleAction: row.schedule_action,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

export async function fetchWorkspacePositionAssetAssignments(
  workspaceId: string
): Promise<WorkspacePositionAssetAssignmentRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('workspace_position_asset_assignments')
    .select('id, workspace_id, position_name, asset_key, created_at, created_by')
    .eq('workspace_id', workspaceId)

  if (error || !data) {
    return []
  }

  return (data as DbPositionAssetAssignmentRow[]).map(mapAssignmentRow)
}

export async function fetchWorkspaceAssetSchedules(
  workspaceId: string
): Promise<WorkspacePositionAssetScheduleRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('workspace_position_asset_schedules')
    .select('id, workspace_id, position_name, asset_key, schedule_action, created_at, created_by')
    .eq('workspace_id', workspaceId)

  if (error || !data) {
    return []
  }

  return (data as DbPositionAssetScheduleRow[]).map(mapScheduleRow)
}

export function groupAssetSchedulesByPosition(
  schedules: WorkspacePositionAssetScheduleRow[]
): Record<string, { assignAssetKeys: string[]; unassignAssetKeys: string[] }> {
  const map: Record<string, { assignAssetKeys: string[]; unassignAssetKeys: string[] }> = {}

  for (const row of schedules) {
    const current = map[row.positionName] ?? { assignAssetKeys: [], unassignAssetKeys: [] }
    if (row.scheduleAction === 'assign_on_op_advance') {
      current.assignAssetKeys.push(row.assetKey)
    } else {
      current.unassignAssetKeys.push(row.assetKey)
    }
    map[row.positionName] = current
  }

  return map
}

export async function updatePositionAssetAssignment(params: {
  accessToken: string
  workspaceId: string
  positionName: string
  assetKey: string
  action: 'assign' | 'unassign'
  pointOfContactMemberId?: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/update-position-asset-assignment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(params),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update position asset assignment.' }
  }

  return { ok: true }
}

export async function updatePositionAssetSchedules(params: {
  accessToken: string
  workspaceId: string
  positionName: string
  assignAssetKeys: string[]
  unassignAssetKeys: string[]
}): Promise<
  | { ok: true; assignAssetKeys: string[]; unassignAssetKeys: string[] }
  | { ok: false; message: string }
> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/update-position-asset-schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(params),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    assignAssetKeys?: string[]
    unassignAssetKeys?: string[]
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update asset schedules.' }
  }

  return {
    ok: true,
    assignAssetKeys: Array.isArray(payload.assignAssetKeys)
      ? payload.assignAssetKeys
      : params.assignAssetKeys,
    unassignAssetKeys: Array.isArray(payload.unassignAssetKeys)
      ? payload.unassignAssetKeys
      : params.unassignAssetKeys,
  }
}

export async function updateWorkspaceAssetPointOfContact(params: {
  accessToken: string
  workspaceId: string
  assetKey: string
  pointOfContactMemberId: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/update-workspace-asset-poc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(params),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update asset Point of Contact.' }
  }

  return { ok: true }
}

export async function fetchWorkspaceAssetPendingOrgChartReports(
  workspaceId: string
): Promise<Record<string, string>> {
  const supabase = getSupabaseClient()
  if (!supabase) return {}

  const { data, error } = await supabase
    .from('workspace_asset_pending_org_chart')
    .select('asset_key, org_chart_reports_to')
    .eq('workspace_id', workspaceId)

  if (error || !data) {
    return {}
  }

  const map: Record<string, string> = {}
  for (const row of data) {
    if (typeof row.asset_key === 'string' && typeof row.org_chart_reports_to === 'string') {
      map[row.asset_key] = row.org_chart_reports_to
    }
  }
  return map
}

export async function addAssetWithEffectiveWhen(params: {
  accessToken: string
  workspaceId: string
  assetKey: string
  assignmentKind: 'ics_position' | 'single_resource'
  scheduleOnOpAdvance?: boolean
  icsPosition?: string
  orgChartReportsTo?: string
  pointOfContactMemberId?: string | null
}): Promise<{ ok: true; scheduleOnOpAdvance?: boolean } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/add-asset-with-effective-when', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(params),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    scheduleOnOpAdvance?: boolean
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not add asset.' }
  }

  return { ok: true, scheduleOnOpAdvance: payload.scheduleOnOpAdvance }
}

export async function cancelAssetPendingAssignment(params: {
  accessToken: string
  workspaceId: string
  assetKey: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/cancel-asset-pending-assignment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(params),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not cancel pending assignment.' }
  }

  return { ok: true }
}
