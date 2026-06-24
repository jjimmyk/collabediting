import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'

export type PositionCardAssigneeGroup = {
  kind: 'assigned' | 'scheduled_next_op' | 'leaving_next_op'
  members: WorkspaceRosterMember[]
}

function dedupeMembersById(members: WorkspaceRosterMember[]): WorkspaceRosterMember[] {
  const seen = new Set<string>()
  const result: WorkspaceRosterMember[] = []
  for (const member of members) {
    if (seen.has(member.id)) continue
    seen.add(member.id)
    result.push(member)
  }
  return result.sort((a, b) => a.email.localeCompare(b.email))
}

export function buildPositionOrgChartAssigneeGroups(
  entry: PositionRosterEntry,
  horizon: OrgChartExportScope = 'current_op'
): PositionCardAssigneeGroup[] {
  const groups: PositionCardAssigneeGroup[] = []

  if (horizon === 'next_op') {
    const assigned = dedupeMembersById(entry.members)
    if (assigned.length > 0) {
      groups.push({ kind: 'assigned', members: assigned })
    }
    return groups
  }

  const assigned = dedupeMembersById(entry.members)
  if (assigned.length > 0) {
    groups.push({ kind: 'assigned', members: assigned })
  }

  const scheduled = dedupeMembersById(entry.scheduledAssignees)
  if (scheduled.length > 0) {
    groups.push({ kind: 'scheduled_next_op', members: scheduled })
  }

  const leavingIds = new Set(entry.scheduledUnassignees.map((member) => member.id))
  const leaving = assigned.filter((member) => leavingIds.has(member.id))
  if (leaving.length > 0) {
    groups.push({ kind: 'leaving_next_op', members: leaving })
  }

  return groups
}

export function positionOrgChartAssigneeSummaryIsEmpty(groups: PositionCardAssigneeGroup[]): boolean {
  return groups.every((group) => group.members.length === 0)
}
