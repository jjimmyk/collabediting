import type { SupabaseClient } from '@supabase/supabase-js'

export async function cascadeCustomPositionRename(
  admin: SupabaseClient,
  workspaceId: string,
  oldName: string,
  newName: string
): Promise<void> {
  const positionNameTables = [
    'workspace_position_settings',
    'workspace_position_member_schedules',
    'workspace_position_asset_assignments',
    'workspace_position_asset_schedules',
  ] as const

  for (const table of positionNameTables) {
    const { error } = await admin
      .from(table)
      .update({ position_name: newName })
      .eq('workspace_id', workspaceId)
      .eq('position_name', oldName)
    if (error) {
      throw new Error(error.message)
    }
  }

  const { error: permissionError } = await admin
    .from('workspace_position_permissions')
    .update({ ics_position: newName })
    .eq('workspace_id', workspaceId)
    .eq('ics_position', oldName)
  if (permissionError) {
    throw new Error(permissionError.message)
  }

  const { error: memberPositionError } = await admin
    .from('workspace_member_positions')
    .update({ ics_position: newName })
    .eq('ics_position', oldName)
    .in(
      'member_id',
      (
        await admin
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
      ).data?.map((row) => row.id) ?? []
    )
  if (memberPositionError) {
    throw new Error(memberPositionError.message)
  }

  const reportsToTables = [
    'workspace_members',
    'workspace_asset_assignments',
    'workspace_member_pending_assignments',
    'workspace_asset_pending_org_chart',
  ] as const

  for (const table of reportsToTables) {
    const { error } = await admin
      .from(table)
      .update({ org_chart_reports_to: newName })
      .eq('workspace_id', workspaceId)
      .eq('org_chart_reports_to', oldName)
    if (error) {
      throw new Error(error.message)
    }
  }

  const { error: childReportsToError } = await admin
    .from('workspace_custom_positions')
    .update({ reports_to: newName, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('reports_to', oldName)
  if (childReportsToError) {
    throw new Error(childReportsToError.message)
  }
}
