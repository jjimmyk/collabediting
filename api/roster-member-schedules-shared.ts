import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getPositionMemberSchedulePolicy,
  loadWorkspacePositionLifecycleContext,
} from './roster-member-schedule-policy.js'
import { fetchWorkspacePositionAllowlist, replaceWorkspaceMemberPositions } from './roster-shared.js'

export type MemberScheduleAction = 'assign_on_op_advance' | 'unassign_on_op_advance'

export type MemberScheduleRow = {
  id: string
  workspace_id: string
  position_name: string
  member_id: string
  schedule_action: MemberScheduleAction
  created_at: string
  created_by: string | null
}

export async function fetchWorkspaceMemberSchedules(
  admin: SupabaseClient,
  workspaceId: string
): Promise<MemberScheduleRow[]> {
  const { data, error } = await admin
    .from('workspace_position_member_schedules')
    .select('id, workspace_id, position_name, member_id, schedule_action, created_at, created_by')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as MemberScheduleRow[]
}

type ScheduleValidationContext = {
  lifecycle: Awaited<ReturnType<typeof loadWorkspacePositionLifecycleContext>>
  memberIds: Set<string>
  positionsByMemberId: Map<string, string[]>
}

async function loadScheduleValidationContext(
  admin: SupabaseClient,
  workspaceId: string
): Promise<ScheduleValidationContext> {
  const lifecycle = await loadWorkspacePositionLifecycleContext(admin, workspaceId)
  const [{ data: members, error: memberError }, { data: positions, error: positionError }] =
    await Promise.all([
      admin
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .neq('status', 'removed'),
      admin.from('workspace_member_positions').select('member_id, ics_position'),
    ])

  if (memberError) throw new Error(memberError.message)
  if (positionError) throw new Error(positionError.message)

  const memberIds = new Set((members ?? []).map((row) => row.id))
  const positionsByMemberId = new Map<string, string[]>()
  for (const row of positions ?? []) {
    if (!memberIds.has(row.member_id)) continue
    const current = positionsByMemberId.get(row.member_id) ?? []
    current.push(row.ics_position)
    positionsByMemberId.set(row.member_id, current)
  }

  return { lifecycle, memberIds, positionsByMemberId }
}

function assertMemberExists(context: ScheduleValidationContext, memberId: string): void {
  if (!context.memberIds.has(memberId)) {
    throw new Error('Roster member not found.')
  }
}

export async function replacePositionMemberSchedules(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    positionName: string
    assignMemberIds: string[]
    unassignMemberIds: string[]
    createdBy: string | null
  }
): Promise<{ assignMemberIds: string[]; unassignMemberIds: string[] }> {
  const positionName = params.positionName.trim()
  if (!positionName) {
    throw new Error('positionName is required.')
  }

  const context = await loadScheduleValidationContext(admin, params.workspaceId)
  const policy = getPositionMemberSchedulePolicy(positionName, context.lifecycle)

  if (!policy.allowScheduleAssign && params.assignMemberIds.length > 0) {
    throw new Error('Member assign schedules are not allowed for this position.')
  }
  if (!policy.allowScheduleUnassign && params.unassignMemberIds.length > 0) {
    throw new Error('Member unassign schedules are not allowed for this position.')
  }

  const assignMemberIds = [...new Set(params.assignMemberIds)]
  const unassignMemberIds = [...new Set(params.unassignMemberIds)]
  const overlap = assignMemberIds.find((memberId) => unassignMemberIds.includes(memberId))
  if (overlap) {
    throw new Error('A member cannot be scheduled to both assign and unassign the same position.')
  }

  for (const memberId of [...assignMemberIds, ...unassignMemberIds]) {
    assertMemberExists(context, memberId)
  }

  for (const memberId of assignMemberIds) {
    const positions = context.positionsByMemberId.get(memberId) ?? []
    if (positions.includes(positionName)) {
      throw new Error('Member is already assigned to this position.')
    }
  }

  for (const memberId of unassignMemberIds) {
    const positions = context.positionsByMemberId.get(memberId) ?? []
    if (!positions.includes(positionName)) {
      throw new Error('Member is not currently assigned to this position.')
    }
  }

  const { error: deleteError } = await admin
    .from('workspace_position_member_schedules')
    .delete()
    .eq('workspace_id', params.workspaceId)
    .eq('position_name', positionName)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const rowsToInsert = [
    ...assignMemberIds.map((memberId) => ({
      workspace_id: params.workspaceId,
      position_name: positionName,
      member_id: memberId,
      schedule_action: 'assign_on_op_advance' as const,
      created_by: params.createdBy,
    })),
    ...unassignMemberIds.map((memberId) => ({
      workspace_id: params.workspaceId,
      position_name: positionName,
      member_id: memberId,
      schedule_action: 'unassign_on_op_advance' as const,
      created_by: params.createdBy,
    })),
  ]

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await admin
      .from('workspace_position_member_schedules')
      .insert(rowsToInsert)
    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return { assignMemberIds, unassignMemberIds }
}

export async function addMemberScheduleAssignOnOpAdvance(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    positionName: string
    memberId: string
    createdBy: string | null
  }
): Promise<void> {
  const schedules = await fetchWorkspaceMemberSchedules(admin, params.workspaceId)
  const forPosition = schedules.filter((row) => row.position_name === params.positionName)
  const assignMemberIds = forPosition
    .filter((row) => row.schedule_action === 'assign_on_op_advance')
    .map((row) => row.member_id)
  const unassignMemberIds = forPosition
    .filter((row) => row.schedule_action === 'unassign_on_op_advance')
    .map((row) => row.member_id)

  if (!assignMemberIds.includes(params.memberId)) {
    assignMemberIds.push(params.memberId)
  }

  await replacePositionMemberSchedules(admin, {
    workspaceId: params.workspaceId,
    positionName: params.positionName,
    assignMemberIds,
    unassignMemberIds,
    createdBy: params.createdBy,
  })
}

export async function applyMemberSchedulesOnOperationalPeriodAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const lifecycle = await loadWorkspacePositionLifecycleContext(admin, workspaceId)
  const schedules = await fetchWorkspaceMemberSchedules(admin, workspaceId)

  for (const schedule of schedules) {
    const policy = getPositionMemberSchedulePolicy(schedule.position_name, lifecycle)
    if (policy.isRetiring) {
      throw new Error(
        `Invalid member schedule for retiring position "${schedule.position_name}". Remove schedules before advancing the operational period.`
      )
    }
    if (policy.isPlanned && schedule.schedule_action === 'unassign_on_op_advance') {
      throw new Error(
        `Invalid unassign schedule for planned position "${schedule.position_name}".`
      )
    }
  }

  const { data: members, error: memberError } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .neq('status', 'removed')

  if (memberError) throw new Error(memberError.message)

  const memberIds = new Set((members ?? []).map((row) => row.id))
  const { data: positionRows, error: positionError } = await admin
    .from('workspace_member_positions')
    .select('member_id, ics_position')

  if (positionError) throw new Error(positionError.message)

  const positionsByMemberId = new Map<string, string[]>()
  for (const row of positionRows ?? []) {
    if (!memberIds.has(row.member_id)) continue
    const current = positionsByMemberId.get(row.member_id) ?? []
    current.push(row.ics_position)
    positionsByMemberId.set(row.member_id, current)
  }

  const allowed = await fetchWorkspacePositionAllowlist(admin, workspaceId)
  const unassignSchedules = schedules.filter(
    (row) => row.schedule_action === 'unassign_on_op_advance'
  )
  const assignSchedules = schedules.filter((row) => row.schedule_action === 'assign_on_op_advance')

  for (const schedule of unassignSchedules) {
    const policy = getPositionMemberSchedulePolicy(schedule.position_name, lifecycle)
    if (!policy.allowScheduleUnassign) continue

    const current = positionsByMemberId.get(schedule.member_id) ?? []
    if (!current.includes(schedule.position_name)) continue

    const nextPositions = current.filter((entry) => entry !== schedule.position_name)
    if (nextPositions.length === 0) {
      const { error } = await admin
        .from('workspace_members')
        .update({ status: 'removed' })
        .eq('id', schedule.member_id)
        .eq('workspace_id', workspaceId)
      if (error) throw new Error(error.message)
      positionsByMemberId.delete(schedule.member_id)
      continue
    }

    await replaceWorkspaceMemberPositions(admin, schedule.member_id, nextPositions, allowed)
    positionsByMemberId.set(schedule.member_id, nextPositions)
  }

  for (const schedule of assignSchedules) {
    const policy = getPositionMemberSchedulePolicy(schedule.position_name, lifecycle)
    if (!policy.allowScheduleAssign) continue

    const current = positionsByMemberId.get(schedule.member_id) ?? []
    if (current.includes(schedule.position_name)) continue

    const nextPositions = [...current, schedule.position_name].sort((a, b) => a.localeCompare(b))
    await replaceWorkspaceMemberPositions(admin, schedule.member_id, nextPositions, allowed)
    positionsByMemberId.set(schedule.member_id, nextPositions)
  }

  const { error: deleteError } = await admin
    .from('workspace_position_member_schedules')
    .delete()
    .eq('workspace_id', workspaceId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }
}

export function buildMemberScheduleSummary(
  schedules: MemberScheduleRow[],
  memberEmailById: Map<string, string>
): {
  assign: Array<{ positionName: string; emails: string[] }>
  unassign: Array<{ positionName: string; emails: string[] }>
} {
  const assignMap = new Map<string, string[]>()
  const unassignMap = new Map<string, string[]>()

  for (const row of schedules) {
    const email = memberEmailById.get(row.member_id)
    if (!email) continue
    const target = row.schedule_action === 'assign_on_op_advance' ? assignMap : unassignMap
    const current = target.get(row.position_name) ?? []
    current.push(email)
    target.set(row.position_name, current)
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
