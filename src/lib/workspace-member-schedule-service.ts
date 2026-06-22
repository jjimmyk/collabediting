import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export type MemberScheduleAction = 'assign_on_op_advance' | 'unassign_on_op_advance'

export type WorkspaceMemberScheduleRow = {
  id: string
  workspaceId: string
  positionName: string
  memberId: string
  scheduleAction: MemberScheduleAction
  competencyFunction: string | null
  createdAt: string
  createdBy: string | null
}

type DbMemberScheduleRow = {
  id: string
  workspace_id: string
  position_name: string
  member_id: string
  schedule_action: MemberScheduleAction
  competency_function: string | null
  created_at: string
  created_by: string | null
}

function mapDbMemberScheduleRow(row: DbMemberScheduleRow): WorkspaceMemberScheduleRow {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    positionName: row.position_name,
    memberId: row.member_id,
    scheduleAction: row.schedule_action,
    competencyFunction: row.competency_function?.trim() || null,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

export async function fetchWorkspaceMemberSchedules(
  workspaceId: string
): Promise<WorkspaceMemberScheduleRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('workspace_position_member_schedules')
    .select('id, workspace_id, position_name, member_id, schedule_action, competency_function, created_at, created_by')
    .eq('workspace_id', workspaceId)

  if (error || !data) {
    return []
  }

  return (data as DbMemberScheduleRow[]).map(mapDbMemberScheduleRow)
}

export async function updatePositionMemberSchedules(params: {
  accessToken: string
  workspaceId: string
  positionName: string
  assignMemberIds: string[]
  unassignMemberIds: string[]
}): Promise<
  | { ok: true; assignMemberIds: string[]; unassignMemberIds: string[] }
  | { ok: false; message: string }
> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/update-position-member-schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      positionName: params.positionName,
      assignMemberIds: params.assignMemberIds,
      unassignMemberIds: params.unassignMemberIds,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    assignMemberIds?: string[]
    unassignMemberIds?: string[]
  }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not update member schedules.' }
  }

  return {
    ok: true,
    assignMemberIds: Array.isArray(payload.assignMemberIds)
      ? payload.assignMemberIds
      : params.assignMemberIds,
    unassignMemberIds: Array.isArray(payload.unassignMemberIds)
      ? payload.unassignMemberIds
      : params.unassignMemberIds,
  }
}

export function groupMemberSchedulesByPosition(
  schedules: WorkspaceMemberScheduleRow[]
): Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }> {
  const map: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }> = {}

  for (const row of schedules) {
    const current = map[row.positionName] ?? { assignMemberIds: [], unassignMemberIds: [] }
    if (row.scheduleAction === 'assign_on_op_advance') {
      current.assignMemberIds.push(row.memberId)
    } else {
      current.unassignMemberIds.push(row.memberId)
    }
    map[row.positionName] = current
  }

  return map
}

export function groupMemberScheduleCompetencyByKey(
  schedules: WorkspaceMemberScheduleRow[]
): Record<string, string | null> {
  const map: Record<string, string | null> = {}
  for (const row of schedules) {
    map[`${row.memberId}::${row.positionName}::${row.scheduleAction}`] = row.competencyFunction
  }
  return map
}

export function buildMemberScheduleSummaryFromRows(
  schedules: WorkspaceMemberScheduleRow[],
  memberEmailById: Map<string, string>
): {
  assign: Array<{ positionName: string; emails: string[] }>
  unassign: Array<{ positionName: string; emails: string[] }>
} {
  const assignMap = new Map<string, string[]>()
  const unassignMap = new Map<string, string[]>()

  for (const row of schedules) {
    const email = memberEmailById.get(row.memberId)
    if (!email) continue
    const target = row.scheduleAction === 'assign_on_op_advance' ? assignMap : unassignMap
    const current = target.get(row.positionName) ?? []
    current.push(email)
    target.set(row.positionName, current)
  }

  const toList = (map: Map<string, string[]>) =>
    [...map.entries()]
      .map(([positionName, emails]) => ({
        positionName,
        emails: [...emails].sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.positionName.localeCompare(b.positionName))

  return { assign: toList(assignMap), unassign: toList(unassignMap) }
}
