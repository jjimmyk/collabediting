import type { OperationalPeriodRosterSnapshot } from '@/lib/operational-period-roster-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function buildPositionRosterEntriesFromSnapshot(
  snapshot: OperationalPeriodRosterSnapshot,
  searchQuery: string
): PositionRosterEntry[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return snapshot.positions
    .map((position) => ({
      position: position.name,
      members: position.members.map(
        (member, index): WorkspaceRosterMember => ({
          id: `snapshot-${position.name}-${member.email}-${index}`,
          userId: null,
          email: member.email,
          status: member.status as WorkspaceRosterMember['status'],
          icsPosition: member.icsPositions[0] ?? position.name,
          icsPositions: member.icsPositions,
          addedAt: snapshot.capturedAt,
        })
      ),
      editIcs201: position.editIcs201,
      isCustom: position.source === 'custom',
      opAdvanceLabel: position.opAdvanceLabel,
      isPlanned: position.lifecycleStatus === 'planned_create',
    }))
    .filter((entry) => {
      if (!normalizedQuery) return true
      if (entry.position.toLowerCase().includes(normalizedQuery)) return true
      return entry.members.some((member) =>
        [member.email, member.status, member.addedAt].join(' ').toLowerCase().includes(normalizedQuery)
      )
    })
}
