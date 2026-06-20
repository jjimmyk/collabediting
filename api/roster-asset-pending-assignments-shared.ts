import type { SupabaseClient } from '@supabase/supabase-js'
import { validateOrgChartReportsToPosition } from './roster-shared.js'

export type PendingAssetOrgChartRow = {
  id: string
  workspace_id: string
  asset_key: string
  org_chart_reports_to: string
  schedule_action: 'activate_on_op_advance'
  created_at: string
  created_by: string | null
}

export async function fetchWorkspaceAssetPendingOrgChart(
  admin: SupabaseClient,
  workspaceId: string
): Promise<PendingAssetOrgChartRow[]> {
  const { data, error } = await admin
    .from('workspace_asset_pending_org_chart')
    .select('id, workspace_id, asset_key, org_chart_reports_to, schedule_action, created_at, created_by')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PendingAssetOrgChartRow[]
}

export async function upsertPendingAssetOrgChartAssignment(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    assetKey: string
    orgChartReportsTo: string
    createdBy: string | null
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

  const { error } = await admin.from('workspace_asset_pending_org_chart').upsert(
    {
      workspace_id: params.workspaceId,
      asset_key: params.assetKey.trim(),
      org_chart_reports_to: params.orgChartReportsTo.trim(),
      schedule_action: 'activate_on_op_advance',
      created_by: params.createdBy,
    },
    { onConflict: 'workspace_id,asset_key,schedule_action' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function deletePendingAssetOrgChartAssignment(
  admin: SupabaseClient,
  workspaceId: string,
  assetKey: string
): Promise<void> {
  const { error } = await admin
    .from('workspace_asset_pending_org_chart')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('asset_key', assetKey)
    .eq('schedule_action', 'activate_on_op_advance')

  if (error) {
    throw new Error(error.message)
  }
}

export async function validatePendingAssetOrgChartBeforeOpAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const pending = await fetchWorkspaceAssetPendingOrgChart(admin, workspaceId)
  for (const row of pending) {
    const reportsToError = await validateOrgChartReportsToPosition(
      admin,
      workspaceId,
      row.org_chart_reports_to
    )
    if (reportsToError) {
      throw new Error(
        `Invalid pending org chart placement for asset ${row.asset_key}: ${reportsToError}`
      )
    }
  }
}

export async function applyPendingAssetOrgChartOnOperationalPeriodAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const pending = await fetchWorkspaceAssetPendingOrgChart(admin, workspaceId)

  for (const row of pending) {
    const reportsToError = await validateOrgChartReportsToPosition(
      admin,
      workspaceId,
      row.org_chart_reports_to
    )
    if (reportsToError) {
      throw new Error(`Cannot activate pending asset org chart placement: ${reportsToError}`)
    }

    const { error: updateError } = await admin
      .from('workspace_asset_assignments')
      .update({
        org_chart_reports_to: row.org_chart_reports_to.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('asset_key', row.asset_key)
      .eq('workspace_id', workspaceId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  if (pending.length > 0) {
    const { error: deleteError } = await admin
      .from('workspace_asset_pending_org_chart')
      .delete()
      .eq('workspace_id', workspaceId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }
}
