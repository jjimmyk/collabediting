import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getPositionMemberSchedulePolicy,
  loadWorkspacePositionLifecycleContext,
} from './roster-member-schedule-policy.js'
import { fetchWorkspacePositionAllowlist, validateOrgChartReportsToPosition } from './roster-shared.js'

export type AssetScheduleAction = 'assign_on_op_advance' | 'unassign_on_op_advance'

export type AssetScheduleRow = {
  id: string
  workspace_id: string
  position_name: string
  asset_key: string
  schedule_action: AssetScheduleAction
  competency_function: string | null
  created_at: string
  created_by: string | null
}

export type PositionAssetAssignmentRow = {
  id: string
  workspace_id: string
  position_name: string
  asset_key: string
  created_at: string
  created_by: string | null
}

export async function fetchWorkspacePositionAssetAssignments(
  admin: SupabaseClient,
  workspaceId: string
): Promise<PositionAssetAssignmentRow[]> {
  const { data, error } = await admin
    .from('workspace_position_asset_assignments')
    .select('id, workspace_id, position_name, asset_key, created_at, created_by')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PositionAssetAssignmentRow[]
}

export async function fetchWorkspaceAssetSchedules(
  admin: SupabaseClient,
  workspaceId: string
): Promise<AssetScheduleRow[]> {
  const { data, error } = await admin
    .from('workspace_position_asset_schedules')
    .select(
      'id, workspace_id, position_name, asset_key, schedule_action, competency_function, created_at, created_by'
    )
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AssetScheduleRow[]
}

async function loadWorkspaceAssetKeys(admin: SupabaseClient, workspaceId: string): Promise<Set<string>> {
  const { data, error } = await admin
    .from('workspace_asset_assignments')
    .select('asset_key')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return new Set((data ?? []).map((row) => row.asset_key))
}

async function loadActiveMemberIds(admin: SupabaseClient, workspaceId: string): Promise<Set<string>> {
  const { data, error } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .neq('status', 'removed')

  if (error) {
    throw new Error(error.message)
  }

  return new Set((data ?? []).map((row) => row.id))
}

export async function assertAssetAssignedToWorkspace(
  admin: SupabaseClient,
  workspaceId: string,
  assetKey: string
): Promise<{ pointOfContactMemberId: string | null }> {
  const { data, error } = await admin
    .from('workspace_asset_assignments')
    .select('asset_key, workspace_id, point_of_contact_member_id')
    .eq('asset_key', assetKey)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.workspace_id !== workspaceId) {
    throw new Error('Asset must be assigned to this workspace before assigning it to a position.')
  }

  return {
    pointOfContactMemberId:
      typeof data.point_of_contact_member_id === 'string' ? data.point_of_contact_member_id : null,
  }
}

async function assertValidPointOfContactMember(
  admin: SupabaseClient,
  workspaceId: string,
  memberId: string
): Promise<void> {
  const { data, error } = await admin
    .from('workspace_members')
    .select('id, status')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.status === 'removed') {
    throw new Error('Point of Contact must be an active roster member in this workspace.')
  }
}

async function setWorkspaceAssetPointOfContact(
  admin: SupabaseClient,
  assetKey: string,
  memberId: string
): Promise<void> {
  const { error } = await admin
    .from('workspace_asset_assignments')
    .update({
      point_of_contact_member_id: memberId,
      updated_at: new Date().toISOString(),
    })
    .eq('asset_key', assetKey)

  if (error) {
    throw new Error(error.message)
  }
}

type AssetScheduleValidationContext = {
  lifecycle: Awaited<ReturnType<typeof loadWorkspacePositionLifecycleContext>>
  workspaceAssetKeys: Set<string>
  assetsByPosition: Map<string, Set<string>>
}

async function loadAssetScheduleValidationContext(
  admin: SupabaseClient,
  workspaceId: string
): Promise<AssetScheduleValidationContext> {
  const lifecycle = await loadWorkspacePositionLifecycleContext(admin, workspaceId)
  const workspaceAssetKeys = await loadWorkspaceAssetKeys(admin, workspaceId)
  const assignments = await fetchWorkspacePositionAssetAssignments(admin, workspaceId)
  const assetsByPosition = new Map<string, Set<string>>()

  for (const row of assignments) {
    const current = assetsByPosition.get(row.position_name) ?? new Set<string>()
    current.add(row.asset_key)
    assetsByPosition.set(row.position_name, current)
  }

  return { lifecycle, workspaceAssetKeys, assetsByPosition }
}

function assertAssetInWorkspace(context: AssetScheduleValidationContext, assetKey: string): void {
  if (!context.workspaceAssetKeys.has(assetKey)) {
    throw new Error('Asset must be assigned to this workspace.')
  }
}

export async function assignAssetToPosition(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    positionName: string
    assetKey: string
    pointOfContactMemberId?: string | null
    createdBy: string | null
  }
): Promise<void> {
  const positionName = params.positionName.trim()
  const assetKey = params.assetKey.trim()

  if (!positionName || !assetKey) {
    throw new Error('positionName and assetKey are required.')
  }

  const allowed = await fetchWorkspacePositionAllowlist(admin, params.workspaceId)
  if (!allowed.has(positionName)) {
    throw new Error('Invalid position name.')
  }

  const lifecycle = await loadWorkspacePositionLifecycleContext(admin, params.workspaceId)
  const policy = getPositionMemberSchedulePolicy(positionName, lifecycle)
  if (!policy.allowActiveAssignment) {
    throw new Error(
      `Cannot assign assets to "${positionName}" now. Schedule the asset for the next operational period instead.`
    )
  }

  const assignment = await assertAssetAssignedToWorkspace(admin, params.workspaceId, assetKey)

  let pocMemberId = assignment.pointOfContactMemberId
  if (params.pointOfContactMemberId) {
    await assertValidPointOfContactMember(admin, params.workspaceId, params.pointOfContactMemberId)
    await setWorkspaceAssetPointOfContact(admin, assetKey, params.pointOfContactMemberId)
    pocMemberId = params.pointOfContactMemberId
  }

  if (!pocMemberId) {
    throw new Error('Select a Point of Contact roster member before assigning this asset to a position.')
  }

  const { error } = await admin.from('workspace_position_asset_assignments').insert({
    workspace_id: params.workspaceId,
    position_name: positionName,
    asset_key: assetKey,
    created_by: params.createdBy,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Asset is already assigned to this position.')
    }
    throw new Error(error.message)
  }
}

export async function unassignAssetFromPosition(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    positionName: string
    assetKey: string
  }
): Promise<void> {
  const positionName = params.positionName.trim()
  const assetKey = params.assetKey.trim()

  const { error } = await admin
    .from('workspace_position_asset_assignments')
    .delete()
    .eq('workspace_id', params.workspaceId)
    .eq('position_name', positionName)
    .eq('asset_key', assetKey)

  if (error) {
    throw new Error(error.message)
  }
}

export async function replacePositionAssetSchedules(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    positionName: string
    assignAssetKeys: string[]
    unassignAssetKeys: string[]
    createdBy: string | null
  }
): Promise<{ assignAssetKeys: string[]; unassignAssetKeys: string[] }> {
  const positionName = params.positionName.trim()
  if (!positionName) {
    throw new Error('positionName is required.')
  }

  const context = await loadAssetScheduleValidationContext(admin, params.workspaceId)
  const policy = getPositionMemberSchedulePolicy(positionName, context.lifecycle)

  if (!policy.allowScheduleAssign && params.assignAssetKeys.length > 0) {
    throw new Error('Asset assign schedules are not allowed for this position.')
  }
  if (!policy.allowScheduleUnassign && params.unassignAssetKeys.length > 0) {
    throw new Error('Asset unassign schedules are not allowed for this position.')
  }

  const assignAssetKeys = [...new Set(params.assignAssetKeys)]
  const unassignAssetKeys = [...new Set(params.unassignAssetKeys)]
  const overlap = assignAssetKeys.find((assetKey) => unassignAssetKeys.includes(assetKey))
  if (overlap) {
    throw new Error('An asset cannot be scheduled to both assign and unassign the same position.')
  }

  for (const assetKey of [...assignAssetKeys, ...unassignAssetKeys]) {
    assertAssetInWorkspace(context, assetKey)
  }

  const activeOnPosition = context.assetsByPosition.get(positionName) ?? new Set<string>()

  for (const assetKey of unassignAssetKeys) {
    if (!activeOnPosition.has(assetKey)) {
      throw new Error('Asset is not currently assigned to this position.')
    }
  }

  const { error: deleteError } = await admin
    .from('workspace_position_asset_schedules')
    .delete()
    .eq('workspace_id', params.workspaceId)
    .eq('position_name', positionName)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const rowsToInsert = [
    ...assignAssetKeys.map((assetKey) => ({
      workspace_id: params.workspaceId,
      position_name: positionName,
      asset_key: assetKey,
      schedule_action: 'assign_on_op_advance' as const,
      created_by: params.createdBy,
    })),
    ...unassignAssetKeys.map((assetKey) => ({
      workspace_id: params.workspaceId,
      position_name: positionName,
      asset_key: assetKey,
      schedule_action: 'unassign_on_op_advance' as const,
      created_by: params.createdBy,
    })),
  ]

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await admin
      .from('workspace_position_asset_schedules')
      .insert(rowsToInsert)
    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return { assignAssetKeys, unassignAssetKeys }
}

export async function updateWorkspaceAssetPointOfContact(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    assetKey: string
    pointOfContactMemberId: string | null
  }
): Promise<void> {
  const assetKey = params.assetKey.trim()
  await assertAssetAssignedToWorkspace(admin, params.workspaceId, assetKey)

  if (params.pointOfContactMemberId) {
    await assertValidPointOfContactMember(admin, params.workspaceId, params.pointOfContactMemberId)
  }

  const { error } = await admin
    .from('workspace_asset_assignments')
    .update({
      point_of_contact_member_id: params.pointOfContactMemberId,
      updated_at: new Date().toISOString(),
    })
    .eq('asset_key', assetKey)
    .eq('workspace_id', params.workspaceId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function applyAssetSchedulesOnOperationalPeriodAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const lifecycle = await loadWorkspacePositionLifecycleContext(admin, workspaceId)
  const schedules = await fetchWorkspaceAssetSchedules(admin, workspaceId)

  for (const schedule of schedules) {
    const policy = getPositionMemberSchedulePolicy(schedule.position_name, lifecycle)
    if (policy.isRetiring) {
      throw new Error(
        `Invalid asset schedule for retiring position "${schedule.position_name}". Remove schedules before advancing the operational period.`
      )
    }
    if (policy.isPlanned && schedule.schedule_action === 'unassign_on_op_advance') {
      throw new Error(
        `Invalid unassign schedule for planned position "${schedule.position_name}".`
      )
    }
  }

  const assignments = await fetchWorkspacePositionAssetAssignments(admin, workspaceId)
  const assetsByPosition = new Map<string, Set<string>>()
  for (const row of assignments) {
    const current = assetsByPosition.get(row.position_name) ?? new Set<string>()
    current.add(row.asset_key)
    assetsByPosition.set(row.position_name, current)
  }

  const { data: workspaceAssets, error: assetError } = await admin
    .from('workspace_asset_assignments')
    .select('asset_key, point_of_contact_member_id')
    .eq('workspace_id', workspaceId)

  if (assetError) {
    throw new Error(assetError.message)
  }

  const pocByAssetKey = new Map<string, string | null>()
  for (const row of workspaceAssets ?? []) {
    pocByAssetKey.set(
      row.asset_key,
      typeof row.point_of_contact_member_id === 'string' ? row.point_of_contact_member_id : null
    )
  }

  const unassignSchedules = schedules.filter(
    (row) => row.schedule_action === 'unassign_on_op_advance'
  )
  const assignSchedules = schedules.filter((row) => row.schedule_action === 'assign_on_op_advance')

  for (const schedule of unassignSchedules) {
    const policy = getPositionMemberSchedulePolicy(schedule.position_name, lifecycle)
    if (!policy.allowScheduleUnassign) continue

    const activeOnPosition = assetsByPosition.get(schedule.position_name) ?? new Set<string>()
    if (!activeOnPosition.has(schedule.asset_key)) continue

    activeOnPosition.delete(schedule.asset_key)
    assetsByPosition.set(schedule.position_name, activeOnPosition)

    const { error } = await admin
      .from('workspace_position_asset_assignments')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('position_name', schedule.position_name)
      .eq('asset_key', schedule.asset_key)

    if (error) {
      throw new Error(error.message)
    }
  }

  for (const schedule of assignSchedules) {
    const policy = getPositionMemberSchedulePolicy(schedule.position_name, lifecycle)
    if (!policy.allowScheduleAssign) continue

    const activeOnPosition = assetsByPosition.get(schedule.position_name) ?? new Set<string>()
    if (activeOnPosition.has(schedule.asset_key)) continue

    if (!pocByAssetKey.get(schedule.asset_key)) {
      throw new Error(
        `Asset "${schedule.asset_key}" is scheduled to assign to "${schedule.position_name}" but has no Point of Contact. Set a POC before advancing the operational period.`
      )
    }

    activeOnPosition.add(schedule.asset_key)
    assetsByPosition.set(schedule.position_name, activeOnPosition)

    const { error } = await admin.from('workspace_position_asset_assignments').insert({
      workspace_id: workspaceId,
      position_name: schedule.position_name,
      asset_key: schedule.asset_key,
      competency_function: schedule.competency_function?.trim() || null,
      created_by: null,
    })

    if (error && error.code !== '23505') {
      throw new Error(error.message)
    }
  }

  const { error: deleteError } = await admin
    .from('workspace_position_asset_schedules')
    .delete()
    .eq('workspace_id', workspaceId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }
}

export async function setAssetOrgChartReportsTo(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    assetKey: string
    orgChartReportsTo: string
  }
): Promise<void> {
  const reportsToError = await validateOrgChartReportsToPosition(
    admin,
    params.workspaceId,
    params.orgChartReportsTo
  )
  if (reportsToError) {
    throw new Error(reportsToError)
  }

  await assertAssetAssignedToWorkspace(admin, params.workspaceId, params.assetKey)

  const { error } = await admin
    .from('workspace_asset_assignments')
    .update({
      org_chart_reports_to: params.orgChartReportsTo.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('asset_key', params.assetKey.trim())
    .eq('workspace_id', params.workspaceId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function addAssetScheduleAssignOnOpAdvance(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    positionName: string
    assetKey: string
    pointOfContactMemberId?: string | null
    createdBy: string | null
  }
): Promise<void> {
  const positionName = params.positionName.trim()
  const assetKey = params.assetKey.trim()

  const assignment = await assertAssetAssignedToWorkspace(admin, params.workspaceId, assetKey)

  let pocMemberId = assignment.pointOfContactMemberId
  if (params.pointOfContactMemberId) {
    await assertValidPointOfContactMember(admin, params.workspaceId, params.pointOfContactMemberId)
    await setWorkspaceAssetPointOfContact(admin, assetKey, params.pointOfContactMemberId)
    pocMemberId = params.pointOfContactMemberId
  }

  if (!pocMemberId) {
    throw new Error('Select a Point of Contact roster member before scheduling this asset.')
  }

  const schedules = await fetchWorkspaceAssetSchedules(admin, params.workspaceId)
  const forPosition = schedules.filter((row) => row.position_name === positionName)
  const assignAssetKeys = forPosition
    .filter((row) => row.schedule_action === 'assign_on_op_advance')
    .map((row) => row.asset_key)
  const unassignAssetKeys = forPosition
    .filter((row) => row.schedule_action === 'unassign_on_op_advance')
    .map((row) => row.asset_key)

  if (!assignAssetKeys.includes(assetKey)) {
    assignAssetKeys.push(assetKey)
  }

  await replacePositionAssetSchedules(admin, {
    workspaceId: params.workspaceId,
    positionName,
    assignAssetKeys,
    unassignAssetKeys,
    createdBy: params.createdBy,
  })
}

export async function clearPositionAssetDependencies(
  admin: SupabaseClient,
  workspaceId: string,
  positionName: string
): Promise<void> {
  const { error: assignmentError } = await admin
    .from('workspace_position_asset_assignments')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('position_name', positionName)

  if (assignmentError) {
    throw new Error(assignmentError.message)
  }

  const { error: scheduleError } = await admin
    .from('workspace_position_asset_schedules')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('position_name', positionName)

  if (scheduleError) {
    throw new Error(scheduleError.message)
  }
}
