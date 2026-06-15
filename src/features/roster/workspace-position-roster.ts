import { WORKSPACE_ROSTER_POSITIONS, WORKSPACE_PERMISSION_EDIT_ICS201 } from '@/lib/ics-positions'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import {
  emptyWorkspacePositionCatalog,
  isCustomWorkspacePosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'

export type PositionPermissionMap = Record<string, { editIcs201: boolean }>

export type PositionRosterEntry = {
  position: string
  members: WorkspaceRosterMember[]
  editIcs201: boolean
  isCustom?: boolean
}

export type PositionRosterAssignmentFilter = {
  searchQuery: string
  status: 'all' | 'assigned' | 'unassigned'
}

export function formatPositionAssignmentCount(memberCount: number): string {
  if (memberCount === 0) return 'Unassigned'
  if (memberCount === 1) return '1 person assigned'
  return `${memberCount} people assigned`
}

export function filterPositionRosterMembers(
  members: WorkspaceRosterMember[],
  searchQuery: string
): WorkspaceRosterMember[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  if (!normalizedQuery) return members

  return members.filter((member) =>
    [member.email, member.status, member.addedAt].join(' ').toLowerCase().includes(normalizedQuery)
  )
}

export function filterPositionRosterEntriesByAssignment(
  entries: PositionRosterEntry[],
  filters: PositionRosterAssignmentFilter
): PositionRosterEntry[] {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase()

  return entries.filter((entry) => {
    if (filters.status === 'assigned' && entry.members.length === 0) return false
    if (filters.status === 'unassigned' && entry.members.length > 0) return false

    if (!normalizedQuery) return true

    if (entry.members.length === 0) {
      return 'unassigned'.includes(normalizedQuery)
    }

    return entry.members.some((member) =>
      [member.email, member.status, member.addedAt].join(' ').toLowerCase().includes(normalizedQuery)
    )
  })
}

export function buildDefaultPositionPermissionMap(
  catalog: WorkspacePositionCatalog = emptyWorkspacePositionCatalog()
): PositionPermissionMap {
  const map: PositionPermissionMap = {}
  for (const position of catalog.allPositionNames) {
    map[position] = {
      editIcs201: !catalog.customPositionNames.has(position),
    }
  }
  return map
}

export function buildPositionRosterEntries(
  roster: WorkspaceRosterMember[],
  permissions: PositionPermissionMap,
  searchQuery: string,
  catalog: WorkspacePositionCatalog = emptyWorkspacePositionCatalog()
): PositionRosterEntry[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return catalog.allPositionNames
    .map((position) => ({
      position,
      members: roster.filter(
        (member) => member.status !== 'removed' && member.icsPositions.includes(position)
      ),
      editIcs201: permissions[position]?.editIcs201 ?? !catalog.customPositionNames.has(position),
      isCustom: isCustomWorkspacePosition(position, catalog),
    }))
    .filter((entry) => {
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
    (member) => member.status !== 'removed' && !member.icsPositions.includes(position)
  )
}

export function permissionsFromRows(
  rows: Array<{ ics_position: string; permission: string }>,
  catalog: WorkspacePositionCatalog = emptyWorkspacePositionCatalog()
): PositionPermissionMap {
  const map = buildDefaultPositionPermissionMap(catalog)
  for (const position of catalog.allPositionNames) {
    map[position] = { editIcs201: false }
  }
  for (const row of rows) {
    if (row.permission === WORKSPACE_PERMISSION_EDIT_ICS201 && map[row.ics_position]) {
      map[row.ics_position] = { editIcs201: true }
    }
  }
  return map
}
