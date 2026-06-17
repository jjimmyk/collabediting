import {
  WORKSPACE_PERMISSION_ALLOW_WORK_ASSIGNMENT,
  WORKSPACE_PERMISSION_EDIT_ICS201,
} from '@/lib/ics-positions'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { getPositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import type { PositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import {
  emptyWorkspacePositionCatalog,
  isCustomWorkspacePosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'

export type PositionPermissionMap = Record<
  string,
  { editIcs201: boolean; allowWorkAssignment: boolean }
>

export type PositionRosterEntry = {
  position: string
  members: WorkspaceRosterMember[]
  scheduledAssignees: WorkspaceRosterMember[]
  scheduledUnassignees: WorkspaceRosterMember[]
  memberSchedulePolicy: PositionMemberSchedulePolicy
  editIcs201: boolean
  allowWorkAssignment: boolean
  isCustom?: boolean
  opAdvanceLabel?: PositionOpAdvanceLabel
  isPlanned?: boolean
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
    const isCustom = catalog.customPositionNames.has(position)
    map[position] = {
      editIcs201: !isCustom,
      allowWorkAssignment: !isCustom,
    }
  }
  return map
}

export function buildPositionRosterEntries(
  roster: WorkspaceRosterMember[],
  permissions: PositionPermissionMap,
  searchQuery: string,
  catalog: WorkspacePositionCatalog = emptyWorkspacePositionCatalog(),
  schedulesByPosition: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }> = {}
): PositionRosterEntry[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const memberById = new Map(roster.map((member) => [member.id, member]))

  return catalog.rosterPositionNames
    .map((position) => {
      const meta = catalog.positionMetaByName[position]
      const schedule = schedulesByPosition[position] ?? {
        assignMemberIds: [],
        unassignMemberIds: [],
      }
      const scheduledAssignees = schedule.assignMemberIds
        .map((memberId) => memberById.get(memberId))
        .filter((member): member is WorkspaceRosterMember => Boolean(member))
      const scheduledUnassignees = schedule.unassignMemberIds
        .map((memberId) => memberById.get(memberId))
        .filter((member): member is WorkspaceRosterMember => Boolean(member))

      return {
        position,
        members: roster.filter(
          (member) => member.status !== 'removed' && member.icsPositions.includes(position)
        ),
        scheduledAssignees,
        scheduledUnassignees,
        memberSchedulePolicy: getPositionMemberSchedulePolicy(meta),
        editIcs201: permissions[position]?.editIcs201 ?? !catalog.customPositionNames.has(position),
        allowWorkAssignment:
          permissions[position]?.allowWorkAssignment ?? !catalog.customPositionNames.has(position),
        isCustom: isCustomWorkspacePosition(position, catalog),
        opAdvanceLabel: meta?.opAdvanceLabel ?? null,
        isPlanned: meta?.isPlanned ?? false,
      }
    })
    .filter((entry) => {
      if (!normalizedQuery) return true
      if (entry.position.toLowerCase().includes(normalizedQuery)) return true
      const searchableMembers = [
        ...entry.members,
        ...entry.scheduledAssignees,
        ...entry.scheduledUnassignees,
      ]
      return searchableMembers.some((member) =>
        [member.email, member.status, member.addedAt].join(' ').toLowerCase().includes(normalizedQuery)
      )
    })
}

export function rosterMembersAssignableToPosition(
  roster: WorkspaceRosterMember[],
  position: string,
  scheduledAssignMemberIds: string[] = []
): WorkspaceRosterMember[] {
  const scheduled = new Set(scheduledAssignMemberIds)
  return roster.filter(
    (member) =>
      member.status !== 'removed' &&
      !member.icsPositions.includes(position) &&
      !scheduled.has(member.id)
  )
}

export function rosterMembersScheduleUnassignableFromPosition(
  roster: WorkspaceRosterMember[],
  position: string,
  scheduledUnassignMemberIds: string[] = []
): WorkspaceRosterMember[] {
  const scheduled = new Set(scheduledUnassignMemberIds)
  return roster.filter(
    (member) =>
      member.status !== 'removed' &&
      member.icsPositions.includes(position) &&
      !scheduled.has(member.id)
  )
}

export function permissionsFromRows(
  rows: Array<{ ics_position: string; permission: string }>,
  catalog: WorkspacePositionCatalog = emptyWorkspacePositionCatalog()
): PositionPermissionMap {
  const map = buildDefaultPositionPermissionMap(catalog)
  for (const position of catalog.allPositionNames) {
    map[position] = { editIcs201: false, allowWorkAssignment: false }
  }
  for (const row of rows) {
    if (!map[row.ics_position]) continue
    if (row.permission === WORKSPACE_PERMISSION_EDIT_ICS201) {
      map[row.ics_position].editIcs201 = true
    }
    if (row.permission === WORKSPACE_PERMISSION_ALLOW_WORK_ASSIGNMENT) {
      map[row.ics_position].allowWorkAssignment = true
    }
  }
  return map
}
