import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'

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
