import type { SupabaseClient } from '@supabase/supabase-js'
import {
  applyAssetSchedulesOnOperationalPeriodAdvance,
  clearPositionAssetDependencies,
} from './roster-asset-assignments-shared.js'
import { applyMemberSchedulesOnOperationalPeriodAdvance } from './roster-member-schedules-shared.js'
import { ICS_POSITIONS } from './roster-shared.js'

type DbCustomPositionRow = {
  id: string
  name: string
  reports_to: string
  sort_order: number
  lifecycle_status: string
}

type DbStandardLifecycleRow = {
  position_name: string
  op_advance_label: string
  archived_at: string | null
}

type DbMemberRow = {
  id: string
  email: string
  status: string
  check_in_status: string
}

type DbMemberPositionRow = {
  member_id: string
  ics_position: string
}

type DbPermissionRow = {
  ics_position: string
  permission: string
}

type DbAssetRow = {
  asset_key: string
  org_chart_reports_to: string | null
  point_of_contact_member_id: string | null
}

type DbPositionAssetAssignmentRow = {
  position_name: string
  asset_key: string
}

export type OperationalPeriodRosterSnapshotPayload = {
  capturedAt: string
  periodNumber: number
  positions: Array<{
    name: string
    source: 'standard' | 'custom'
    lifecycleStatus: string
    opAdvanceLabel: 'retire_on_op_advance' | 'create_on_op_advance' | null
    reportsTo?: string | null
    editIcs201: boolean
    allowWorkAssignment: boolean
    members: Array<{ email: string; status: string; icsPositions: string[]; checkInStatus: string }>
    assets: Array<{ assetKey: string; pointOfContactEmail: string | null }>
  }>
  orgChartAssetPlacements: Array<{ assetKey: string; reportsTo: string | null }>
}

function opAdvanceLabelFromCustomStatus(
  status: string
): 'retire_on_op_advance' | 'create_on_op_advance' | null {
  if (status === 'planned_create') return 'create_on_op_advance'
  if (status === 'retire_on_op_advance') return 'retire_on_op_advance'
  return null
}

async function loadRosterLifecycleContext(admin: SupabaseClient, workspaceId: string) {
  const [
    { data: customRows, error: customError },
    { data: standardRows, error: standardError },
    { data: memberRows, error: memberError },
    { data: memberPositionRows, error: memberPositionError },
    { data: permissionRows, error: permissionError },
    { data: settingsRows, error: settingsError },
    { data: assetRows, error: assetError },
    { data: positionAssetRows, error: positionAssetError },
  ] = await Promise.all([
    admin
      .from('workspace_custom_positions')
      .select('id, name, reports_to, sort_order, lifecycle_status')
      .eq('workspace_id', workspaceId),
    admin
      .from('workspace_standard_position_lifecycle')
      .select('position_name, op_advance_label, archived_at')
      .eq('workspace_id', workspaceId),
    admin
      .from('workspace_members')
      .select('id, email, status, check_in_status')
      .eq('workspace_id', workspaceId)
      .neq('status', 'removed'),
    admin.from('workspace_member_positions').select('member_id, ics_position'),
    admin
      .from('workspace_position_permissions')
      .select('ics_position, permission')
      .eq('workspace_id', workspaceId),
    admin
      .from('workspace_position_settings')
      .select('position_name, allow_work_assignment')
      .eq('workspace_id', workspaceId),
    admin
      .from('workspace_asset_assignments')
      .select('asset_key, org_chart_reports_to, point_of_contact_member_id')
      .eq('workspace_id', workspaceId),
    admin
      .from('workspace_position_asset_assignments')
      .select('position_name, asset_key')
      .eq('workspace_id', workspaceId),
  ])

  if (customError) throw new Error(customError.message)
  if (standardError) throw new Error(standardError.message)
  if (memberError) throw new Error(memberError.message)
  if (memberPositionError) throw new Error(memberPositionError.message)
  if (permissionError) throw new Error(permissionError.message)
  if (settingsError) throw new Error(settingsError.message)
  if (assetError) throw new Error(assetError.message)
  if (positionAssetError) throw new Error(positionAssetError.message)

  const customPositions = (customRows ?? []) as DbCustomPositionRow[]
  const standardLifecycle = (standardRows ?? []) as DbStandardLifecycleRow[]
  const members = (memberRows ?? []) as DbMemberRow[]
  const memberPositions = (memberPositionRows ?? []) as DbMemberPositionRow[]
  const permissions = (permissionRows ?? []) as DbPermissionRow[]
  const settings = (settingsRows ?? []) as Array<{
    position_name: string
    allow_work_assignment: boolean
  }>
  const assets = (assetRows ?? []) as DbAssetRow[]
  const positionAssetAssignments = (positionAssetRows ?? []) as DbPositionAssetAssignmentRow[]

  const memberIds = new Set(members.map((row) => row.id))
  const memberEmailById = new Map(members.map((row) => [row.id, row.email]))
  const positionsByMemberId = new Map<string, string[]>()
  for (const row of memberPositions) {
    if (!memberIds.has(row.member_id)) continue
    const current = positionsByMemberId.get(row.member_id) ?? []
    current.push(row.ics_position)
    positionsByMemberId.set(row.member_id, current)
  }

  const editIcs201ByPosition = new Map<string, boolean>()
  const allowWorkAssignmentByPosition = new Map<string, boolean>()
  for (const row of permissions) {
    if (row.permission === 'edit_ics201') {
      editIcs201ByPosition.set(row.ics_position, true)
    }
  }
  for (const row of settings) {
    allowWorkAssignmentByPosition.set(row.position_name, row.allow_work_assignment)
  }

  const standardLifecycleByName = Object.fromEntries(
    standardLifecycle.map((row) => [row.position_name, row])
  )

  const pocEmailByAssetKey = new Map<string, string | null>()
  for (const asset of assets) {
    const memberId = asset.point_of_contact_member_id
    pocEmailByAssetKey.set(
      asset.asset_key,
      memberId ? (memberEmailById.get(memberId) ?? null) : null
    )
  }

  const assetsByPosition = new Map<string, string[]>()
  for (const row of positionAssetAssignments) {
    const current = assetsByPosition.get(row.position_name) ?? []
    current.push(row.asset_key)
    assetsByPosition.set(row.position_name, current)
  }

  return {
    customPositions,
    standardLifecycle,
    standardLifecycleByName,
    members,
    positionsByMemberId,
    editIcs201ByPosition,
    allowWorkAssignmentByPosition,
    assets,
    assetsByPosition,
    pocEmailByAssetKey,
  }
}

function snapshotAssetsForPosition(
  context: Awaited<ReturnType<typeof loadRosterLifecycleContext>>,
  positionName: string
): OperationalPeriodRosterSnapshotPayload['positions'][number]['assets'] {
  const assetKeys = context.assetsByPosition.get(positionName) ?? []
  return assetKeys
    .map((assetKey) => ({
      assetKey,
      pointOfContactEmail: context.pocEmailByAssetKey.get(assetKey) ?? null,
    }))
    .sort((a, b) => a.assetKey.localeCompare(b.assetKey))
}

function buildOperationalPeriodRosterSnapshot(
  periodNumber: number,
  context: Awaited<ReturnType<typeof loadRosterLifecycleContext>>
): OperationalPeriodRosterSnapshotPayload {
  const positions: OperationalPeriodRosterSnapshotPayload['positions'] = []

  for (const positionName of ICS_POSITIONS) {
    const lifecycleRow = context.standardLifecycleByName[positionName]
    if (lifecycleRow?.archived_at) {
      continue
    }

    const opAdvanceLabel =
      lifecycleRow?.op_advance_label === 'retire_on_op_advance'
        ? ('retire_on_op_advance' as const)
        : null

    positions.push({
      name: positionName,
      source: 'standard',
      lifecycleStatus: 'active',
      opAdvanceLabel,
      reportsTo: null,
      editIcs201: context.editIcs201ByPosition.get(positionName) ?? true,
      allowWorkAssignment: context.allowWorkAssignmentByPosition.get(positionName) ?? true,
      members: context.members
        .map((member) => ({
          member,
          icsPositions: (context.positionsByMemberId.get(member.id) ?? []).filter(
            (entry) => entry === positionName
          ),
        }))
        .filter((entry) => entry.icsPositions.length > 0)
        .map((entry) => ({
          email: entry.member.email,
          status: entry.member.status,
          icsPositions: entry.icsPositions,
          checkInStatus: entry.member.check_in_status ?? 'not_arrived',
        })),
      assets: snapshotAssetsForPosition(context, positionName),
    })
  }

  for (const custom of context.customPositions) {
    if (custom.lifecycle_status === 'archived') {
      continue
    }

    positions.push({
      name: custom.name,
      source: 'custom',
      lifecycleStatus: custom.lifecycle_status,
      opAdvanceLabel: opAdvanceLabelFromCustomStatus(custom.lifecycle_status),
      reportsTo: custom.reports_to,
      editIcs201: context.editIcs201ByPosition.get(custom.name) ?? false,
      allowWorkAssignment: context.allowWorkAssignmentByPosition.get(custom.name) ?? false,
      members: context.members
        .map((member) => ({
          member,
          icsPositions: (context.positionsByMemberId.get(member.id) ?? []).filter(
            (entry) => entry === custom.name
          ),
        }))
        .filter((entry) => entry.icsPositions.length > 0)
        .map((entry) => ({
          email: entry.member.email,
          status: entry.member.status,
          icsPositions: entry.icsPositions,
          checkInStatus: entry.member.check_in_status ?? 'not_arrived',
        })),
      assets: snapshotAssetsForPosition(context, custom.name),
    })
  }

  return {
    capturedAt: new Date().toISOString(),
    periodNumber,
    positions,
    orgChartAssetPlacements: context.assets
      .filter((asset) => asset.org_chart_reports_to)
      .map((asset) => ({
        assetKey: asset.asset_key,
        reportsTo: asset.org_chart_reports_to,
      })),
  }
}

function collectRetiringPositionNames(
  context: Awaited<ReturnType<typeof loadRosterLifecycleContext>>
): string[] {
  const retiring: string[] = []

  for (const positionName of ICS_POSITIONS) {
    const lifecycleRow = context.standardLifecycleByName[positionName]
    if (lifecycleRow?.archived_at) continue
    if (lifecycleRow?.op_advance_label === 'retire_on_op_advance') {
      retiring.push(positionName)
    }
  }

  for (const custom of context.customPositions) {
    if (custom.lifecycle_status === 'archived') continue
    if (custom.lifecycle_status === 'retire_on_op_advance') {
      retiring.push(custom.name)
    }
  }

  return retiring
}

async function validateRetiringPositions(
  context: Awaited<ReturnType<typeof loadRosterLifecycleContext>>,
  retiringNames: string[]
): Promise<void> {
  if (retiringNames.length === 0) {
    return
  }

  const retiringSet = new Set(retiringNames)
  const blockers: string[] = []

  for (const custom of context.customPositions) {
    if (custom.lifecycle_status === 'archived') continue
    if (retiringSet.has(custom.reports_to) && !retiringSet.has(custom.name)) {
      blockers.push(`${custom.name} reports to ${custom.reports_to}`)
    }
  }

  for (const asset of context.assets) {
    if (!asset.org_chart_reports_to) continue
    if (retiringSet.has(asset.org_chart_reports_to)) {
      blockers.push(`Asset ${asset.asset_key} reports to ${asset.org_chart_reports_to}`)
    }
  }

  for (const positionName of retiringNames) {
    const assignedAssets = context.assetsByPosition.get(positionName) ?? []
    if (assignedAssets.length > 0) {
      blockers.push(`${assignedAssets.length} asset(s) assigned to ${positionName}`)
    }
  }

  if (blockers.length > 0) {
    throw new Error(
      `Cannot retire positions with active dependencies: ${blockers.slice(0, 3).join('; ')}${
        blockers.length > 3 ? ` (+${blockers.length - 3} more)` : ''
      }`
    )
  }
}

async function removeMembersFromPosition(
  admin: SupabaseClient,
  workspaceId: string,
  positionName: string,
  context: Awaited<ReturnType<typeof loadRosterLifecycleContext>>
): Promise<void> {
  for (const member of context.members) {
    const positions = context.positionsByMemberId.get(member.id) ?? []
    if (!positions.includes(positionName)) continue

    const nextPositions = positions.filter((entry) => entry !== positionName)
    if (nextPositions.length === 0) {
      const { error } = await admin
        .from('workspace_members')
        .update({ status: 'removed' })
        .eq('id', member.id)
        .eq('workspace_id', workspaceId)
      if (error) throw new Error(error.message)
    } else {
      const { error: deleteError } = await admin
        .from('workspace_member_positions')
        .delete()
        .eq('member_id', member.id)
        .eq('ics_position', positionName)
      if (deleteError) throw new Error(deleteError.message)

      const primary = nextPositions[0]
      const { error: memberError } = await admin
        .from('workspace_members')
        .update({ ics_position: primary })
        .eq('id', member.id)
      if (memberError) throw new Error(memberError.message)
    }
  }
}

async function clearPositionDependencies(
  admin: SupabaseClient,
  workspaceId: string,
  positionName: string
): Promise<void> {
  const { error: permissionError } = await admin
    .from('workspace_position_permissions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('ics_position', positionName)
  if (permissionError) throw new Error(permissionError.message)

  const { error: assetError } = await admin
    .from('workspace_asset_assignments')
    .update({ org_chart_reports_to: null })
    .eq('workspace_id', workspaceId)
    .eq('org_chart_reports_to', positionName)
  if (assetError) throw new Error(assetError.message)
}

async function applyRosterLifecycleOnOperationalPeriodAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const context = await loadRosterLifecycleContext(admin, workspaceId)
  const retiringNames = collectRetiringPositionNames(context)
  await validateRetiringPositions(context, retiringNames)

  const now = new Date().toISOString()

  for (const positionName of retiringNames) {
    await removeMembersFromPosition(admin, workspaceId, positionName, context)
    await clearPositionDependencies(admin, workspaceId, positionName)
    await clearPositionAssetDependencies(admin, workspaceId, positionName)
  }

  for (const custom of context.customPositions) {
    if (custom.lifecycle_status !== 'retire_on_op_advance') continue
    const { error } = await admin
      .from('workspace_custom_positions')
      .update({
        lifecycle_status: 'archived',
        archived_at: now,
        updated_at: now,
      })
      .eq('id', custom.id)
      .eq('workspace_id', workspaceId)
    if (error) throw new Error(error.message)
  }

  for (const positionName of retiringNames) {
    if (!ICS_POSITIONS.includes(positionName as (typeof ICS_POSITIONS)[number])) {
      continue
    }
    const { error } = await admin.from('workspace_standard_position_lifecycle').upsert(
      {
        workspace_id: workspaceId,
        position_name: positionName,
        op_advance_label: 'retire_on_op_advance',
        archived_at: now,
        updated_at: now,
      },
      { onConflict: 'workspace_id,position_name' }
    )
    if (error) throw new Error(error.message)
  }

  const { error: activateError } = await admin
    .from('workspace_custom_positions')
    .update({
      lifecycle_status: 'active',
      activated_at: now,
      updated_at: now,
    })
    .eq('workspace_id', workspaceId)
    .eq('lifecycle_status', 'planned_create')
  if (activateError) throw new Error(activateError.message)
}

export async function snapshotAndApplyRosterLifecycleOnOperationalPeriodAdvance(
  admin: SupabaseClient,
  workspaceId: string,
  operationalPeriodId: string,
  periodNumber: number
): Promise<void> {
  const context = await loadRosterLifecycleContext(admin, workspaceId)
  const snapshot = buildOperationalPeriodRosterSnapshot(periodNumber, context)

  const { error: snapshotError } = await admin
    .from('workspace_operational_period_roster_snapshots')
    .insert({
      operational_period_id: operationalPeriodId,
      workspace_id: workspaceId,
      period_number: periodNumber,
      snapshot,
    })

  if (snapshotError) {
    throw new Error(snapshotError.message)
  }

  await applyRosterLifecycleOnOperationalPeriodAdvance(admin, workspaceId)
  await applyMemberSchedulesOnOperationalPeriodAdvance(admin, workspaceId)
  await applyAssetSchedulesOnOperationalPeriodAdvance(admin, workspaceId)
}
