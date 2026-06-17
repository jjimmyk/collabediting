import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'

export type RosterInviteAssignmentMode = 'assign_now' | 'schedule_on_op_advance'

export function assignExistingMembersEmptyMessage(
  entry: PositionRosterEntry,
  assignableCount: number
): string {
  if (assignableCount > 0) {
    return ''
  }

  if (entry.members.length > 0) {
    return 'All roster members are already assigned here.'
  }

  if (entry.isPlanned) {
    return 'No other roster members available to assign.'
  }

  return 'No roster members available to assign.'
}

export function scheduleAssignMembersEmptyMessage(assignableCount: number): string {
  if (assignableCount > 0) {
    return ''
  }
  return 'No roster members available to schedule.'
}

export function scheduleUnassignMembersEmptyMessage(
  entry: PositionRosterEntry,
  unassignableCount: number
): string {
  if (unassignableCount > 0) {
    return ''
  }
  if (entry.members.length === 0) {
    return 'No members are assigned to this position yet.'
  }
  return 'No assigned members can be scheduled to unassign.'
}
