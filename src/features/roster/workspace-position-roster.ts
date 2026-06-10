import { WORKSPACE_ROSTER_POSITIONS, WORKSPACE_PERMISSION_EDIT_ICS201 } from '@/lib/ics-positions'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type PositionPermissionMap = Record<string, { editIcs201: boolean }>

export type PositionRosterEntry = {
  position: string
  members: WorkspaceRosterMember[]
  editIcs201: boolean
}

export function buildDefaultPositionPermissionMap(): PositionPermissionMap {
  return Object.fromEntries(
    WORKSPACE_ROSTER_POSITIONS.map((position) => [position, { editIcs201: true }])
  )
}

export function buildPositionRosterEntries(
  roster: WorkspaceRosterMember[],
  permissions: PositionPermissionMap,
  searchQuery: string
): PositionRosterEntry[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return WORKSPACE_ROSTER_POSITIONS.map((position) => ({
    position,
    members: roster.filter(
      (member) =>
        member.status !== 'removed' && member.icsPositions.includes(position)
    ),
    editIcs201: permissions[position]?.editIcs201 ?? true,
  })).filter((entry) => {
    if (!normalizedQuery) return true
    if (entry.position.toLowerCase().includes(normalizedQuery)) return true
    return entry.members.some((member) =>
      [member.email, member.status, member.addedAt].join(' ').toLowerCase().includes(normalizedQuery)
    )
  })
}

export function rosterMembersAssignableToPosition(
  roster: WorkspaceRosterMember[],
  position: string
): WorkspaceRosterMember[] {
  return roster.filter(
    (member) =>
      member.status !== 'removed' && !member.icsPositions.includes(position)
  )
}

export function permissionsFromRows(
  rows: Array<{ ics_position: string; permission: string }>
): PositionPermissionMap {
  const map = buildDefaultPositionPermissionMap()
  for (const position of WORKSPACE_ROSTER_POSITIONS) {
    map[position] = { editIcs201: false }
  }
  for (const row of rows) {
    if (row.permission === WORKSPACE_PERMISSION_EDIT_ICS201 && map[row.ics_position]) {
      map[row.ics_position] = { editIcs201: true }
    }
  }
  return map
}
