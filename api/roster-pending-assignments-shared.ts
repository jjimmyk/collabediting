import type { SupabaseClient } from '@supabase/supabase-js'
import { validateOrgChartReportsToPosition } from './roster-shared.js'

export type PendingMemberAssignmentRow = {
  id: string
  workspace_id: string
  member_id: string
  org_chart_reports_to: string
  schedule_action: 'activate_on_op_advance'
  created_at: string
  created_by: string | null
}

export async function fetchWorkspaceMemberPendingAssignments(
  admin: SupabaseClient,
  workspaceId: string
): Promise<PendingMemberAssignmentRow[]> {
  const { data, error } = await admin
    .from('workspace_member_pending_assignments')
    .select('id, workspace_id, member_id, org_chart_reports_to, schedule_action, created_at, created_by')
    .eq('workspace_id', workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PendingMemberAssignmentRow[]
}

export async function upsertPendingSingleResourceAssignment(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    memberId: string
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

  const { error } = await admin.from('workspace_member_pending_assignments').upsert(
    {
      workspace_id: params.workspaceId,
      member_id: params.memberId,
      org_chart_reports_to: params.orgChartReportsTo.trim(),
      schedule_action: 'activate_on_op_advance',
      created_by: params.createdBy,
    },
    { onConflict: 'workspace_id,member_id,schedule_action' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function deletePendingSingleResourceAssignment(
  admin: SupabaseClient,
  workspaceId: string,
  memberId: string
): Promise<void> {
  const { error } = await admin
    .from('workspace_member_pending_assignments')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('member_id', memberId)
    .eq('schedule_action', 'activate_on_op_advance')

  if (error) {
    throw new Error(error.message)
  }
}

export async function validatePendingSingleResourceAssignmentsBeforeOpAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const pending = await fetchWorkspaceMemberPendingAssignments(admin, workspaceId)
  for (const row of pending) {
    const reportsToError = await validateOrgChartReportsToPosition(
      admin,
      workspaceId,
      row.org_chart_reports_to
    )
    if (reportsToError) {
      throw new Error(
        `Invalid pending single-resource assignment for member ${row.member_id}: ${reportsToError}`
      )
    }
  }
}

export async function applyPendingSingleResourceAssignmentsOnOperationalPeriodAdvance(
  admin: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const pending = await fetchWorkspaceMemberPendingAssignments(admin, workspaceId)

  for (const row of pending) {
    const reportsToError = await validateOrgChartReportsToPosition(
      admin,
      workspaceId,
      row.org_chart_reports_to
    )
    if (reportsToError) {
      throw new Error(
        `Cannot activate pending single-resource assignment: ${reportsToError}`
      )
    }

    const { error: updateError } = await admin
      .from('workspace_members')
      .update({
        org_chart_reports_to: row.org_chart_reports_to.trim(),
        assignment_kind: 'single_resource',
      })
      .eq('id', row.member_id)
      .eq('workspace_id', workspaceId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  if (pending.length > 0) {
    const { error: deleteError } = await admin
      .from('workspace_member_pending_assignments')
      .delete()
      .eq('workspace_id', workspaceId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }
}
