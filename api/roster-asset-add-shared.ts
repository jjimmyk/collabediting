import type { SupabaseClient } from '@supabase/supabase-js'
import {
  addAssetScheduleAssignOnOpAdvance,
  assertAssetAssignedToWorkspace,
  assignAssetToPosition,
  setAssetOrgChartReportsTo,
} from './roster-asset-assignments-shared.js'
import { upsertPendingAssetOrgChartAssignment } from './roster-asset-pending-assignments-shared.js'
import { fetchWorkspacePositionAllowlist } from './roster-shared.js'

export type AssetAssignmentKind = 'ics_position' | 'single_resource'

async function assertAssetNotOnOrgChart(
  admin: SupabaseClient,
  workspaceId: string,
  assetKey: string
): Promise<void> {
  await assertAssetAssignedToWorkspace(admin, workspaceId, assetKey)

  const { data, error } = await admin
    .from('workspace_asset_assignments')
    .select('org_chart_reports_to')
    .eq('asset_key', assetKey)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data?.org_chart_reports_to) {
    throw new Error('Remove this asset from the org chart before assigning it to an ICS position.')
  }

  const { data: pending } = await admin
    .from('workspace_asset_pending_org_chart')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('asset_key', assetKey)
    .maybeSingle()

  if (pending) {
    throw new Error(
      'Cancel the pending org chart schedule before assigning this asset to an ICS position.'
    )
  }
}

async function assertAssetNotOnIcsPosition(
  admin: SupabaseClient,
  workspaceId: string,
  assetKey: string
): Promise<void> {
  const { data, error } = await admin
    .from('workspace_position_asset_assignments')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('asset_key', assetKey)
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  if ((data ?? []).length > 0) {
    throw new Error('Remove this asset from its ICS position before placing it on the org chart.')
  }

  const { data: scheduled } = await admin
    .from('workspace_position_asset_schedules')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('asset_key', assetKey)
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  if ((scheduled ?? []).length > 0) {
    throw new Error(
      'Cancel pending ICS position schedules before placing this asset on the org chart.'
    )
  }
}

export async function addAssetWithEffectiveWhen(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    assetKey: string
    assignmentKind: AssetAssignmentKind
    scheduleOnOpAdvance: boolean
    icsPosition?: string
    orgChartReportsTo?: string
    pointOfContactMemberId?: string | null
    createdBy: string | null
  }
): Promise<{ scheduleOnOpAdvance: boolean }> {
  const assetKey = params.assetKey.trim()
  await assertAssetAssignedToWorkspace(admin, params.workspaceId, assetKey)

  if (params.assignmentKind === 'single_resource') {
    const orgChartReportsTo = params.orgChartReportsTo?.trim()
    if (!orgChartReportsTo) {
      throw new Error('orgChartReportsTo is required for single-resource org chart placement.')
    }

    await assertAssetNotOnIcsPosition(admin, params.workspaceId, assetKey)

    if (params.scheduleOnOpAdvance) {
      await upsertPendingAssetOrgChartAssignment(admin, {
        workspaceId: params.workspaceId,
        assetKey,
        orgChartReportsTo,
        createdBy: params.createdBy,
      })
      return { scheduleOnOpAdvance: true }
    }

    await setAssetOrgChartReportsTo(admin, {
      workspaceId: params.workspaceId,
      assetKey,
      orgChartReportsTo,
    })
    return { scheduleOnOpAdvance: false }
  }

  const icsPosition = params.icsPosition?.trim()
  if (!icsPosition) {
    throw new Error('icsPosition is required for ICS position assignment.')
  }

  const allowed = await fetchWorkspacePositionAllowlist(admin, params.workspaceId)
  if (!allowed.has(icsPosition)) {
    throw new Error('Invalid position name.')
  }

  await assertAssetNotOnOrgChart(admin, params.workspaceId, assetKey)

  if (params.scheduleOnOpAdvance) {
    await addAssetScheduleAssignOnOpAdvance(admin, {
      workspaceId: params.workspaceId,
      positionName: icsPosition,
      assetKey,
      pointOfContactMemberId: params.pointOfContactMemberId ?? null,
      createdBy: params.createdBy,
    })
    return { scheduleOnOpAdvance: true }
  }

  await assignAssetToPosition(admin, {
    workspaceId: params.workspaceId,
    positionName: icsPosition,
    assetKey,
    pointOfContactMemberId: params.pointOfContactMemberId ?? null,
    createdBy: params.createdBy,
  })

  return { scheduleOnOpAdvance: false }
}
