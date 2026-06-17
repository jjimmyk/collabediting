import type { SupabaseClient } from '@supabase/supabase-js'

export type PositionMemberSchedulePolicy = {
  allowActiveAssignment: boolean
  allowScheduleAssign: boolean
  allowScheduleUnassign: boolean
  isPlanned: boolean
  isRetiring: boolean
}

export type WorkspacePositionLifecycleContext = {
  plannedPositionNames: Set<string>
  retiringPositionNames: Set<string>
}

export async function loadWorkspacePositionLifecycleContext(
  admin: SupabaseClient,
  workspaceId: string
): Promise<WorkspacePositionLifecycleContext> {
  const [{ data: customRows, error: customError }, { data: standardRows, error: standardError }] =
    await Promise.all([
      admin
        .from('workspace_custom_positions')
        .select('name, lifecycle_status')
        .eq('workspace_id', workspaceId),
      admin
        .from('workspace_standard_position_lifecycle')
        .select('position_name, op_advance_label, archived_at')
        .eq('workspace_id', workspaceId),
    ])

  if (customError) throw new Error(customError.message)
  if (standardError) throw new Error(standardError.message)

  const plannedPositionNames = new Set<string>()
  const retiringPositionNames = new Set<string>()

  for (const row of customRows ?? []) {
    if (typeof row.name !== 'string') continue
    const name = row.name.trim()
    if (row.lifecycle_status === 'planned_create') {
      plannedPositionNames.add(name)
    }
    if (row.lifecycle_status === 'retire_on_op_advance') {
      retiringPositionNames.add(name)
    }
  }

  for (const row of standardRows ?? []) {
    if (typeof row.position_name !== 'string' || row.archived_at) continue
    if (row.op_advance_label === 'retire_on_op_advance') {
      retiringPositionNames.add(row.position_name)
    }
  }

  return { plannedPositionNames, retiringPositionNames }
}

export function getPositionMemberSchedulePolicy(
  positionName: string,
  context: WorkspacePositionLifecycleContext
): PositionMemberSchedulePolicy {
  const isPlanned = context.plannedPositionNames.has(positionName)
  const isRetiring = context.retiringPositionNames.has(positionName)

  if (isPlanned) {
    return {
      allowActiveAssignment: false,
      allowScheduleAssign: true,
      allowScheduleUnassign: false,
      isPlanned: true,
      isRetiring: false,
    }
  }

  if (isRetiring) {
    return {
      allowActiveAssignment: true,
      allowScheduleAssign: false,
      allowScheduleUnassign: false,
      isPlanned: false,
      isRetiring: true,
    }
  }

  return {
    allowActiveAssignment: true,
    allowScheduleAssign: true,
    allowScheduleUnassign: true,
    isPlanned: false,
    isRetiring: false,
  }
}

export async function assertPositionsAllowActiveAssignment(
  admin: SupabaseClient,
  workspaceId: string,
  positionNames: string[]
): Promise<void> {
  if (positionNames.length === 0) return

  const context = await loadWorkspacePositionLifecycleContext(admin, workspaceId)
  for (const positionName of positionNames) {
    const policy = getPositionMemberSchedulePolicy(positionName, context)
    if (!policy.allowActiveAssignment) {
      throw new Error(
        `Cannot assign members to "${positionName}" now. This position activates on the next operational period — schedule members for next OP instead.`
      )
    }
  }
}
