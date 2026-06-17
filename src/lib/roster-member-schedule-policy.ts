import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'

export type PositionMemberSchedulePolicy = {
  allowActiveAssignment: boolean
  allowScheduleAssign: boolean
  allowScheduleUnassign: boolean
}

export function getPositionMemberSchedulePolicy(
  meta: WorkspacePositionMeta | undefined
): PositionMemberSchedulePolicy {
  if (!meta || meta.isArchived) {
    return {
      allowActiveAssignment: false,
      allowScheduleAssign: false,
      allowScheduleUnassign: false,
    }
  }

  if (meta.isPlanned) {
    return {
      allowActiveAssignment: false,
      allowScheduleAssign: true,
      allowScheduleUnassign: false,
    }
  }

  if (meta.opAdvanceLabel === 'retire_on_op_advance') {
    return {
      allowActiveAssignment: true,
      allowScheduleAssign: false,
      allowScheduleUnassign: false,
    }
  }

  return {
    allowActiveAssignment: true,
    allowScheduleAssign: true,
    allowScheduleUnassign: true,
  }
}
