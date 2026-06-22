import { WORKSPACE_PERMISSION_EDIT_ICS201 } from '@/lib/ics-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type {
  PositionAssetRosterEntry,
  PositionAssetWorkspaceMeta,
} from '@/lib/workspace-position-asset-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { getPositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import type { PositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import {
  emptyWorkspacePositionCatalog,
  isCustomWorkspacePosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import {
  resolveAllowWorkAssignment,
  resolvePositionType,
  type WorkspacePositionSettingsMap,
} from '@/lib/workspace-position-settings'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'
import {
  resolvePositionAssetEntry,
  resolveScheduledPositionAssets,
} from '@/lib/workspace-position-asset-roster'

export type PositionPermissionMap = Record<string, { editIcs201: boolean }>

export type PositionRosterEntry = {
  position: string
  members: WorkspaceRosterMember[]
  scheduledAssignees: WorkspaceRosterMember[]
  scheduledUnassignees: WorkspaceRosterMember[]
  scheduledOrgChartMembers: WorkspaceRosterMember[]
  assets: PositionAssetRosterEntry[]
  scheduledAssignAssets: PositionAssetRosterEntry[]
  scheduledUnassignAssets: PositionAssetRosterEntry[]
  scheduledOrgChartAssets: PositionAssetRosterEntry[]
  memberSchedulePolicy: PositionMemberSchedulePolicy
  editIcs201: boolean
  allowWorkAssignment: boolean
  positionType: WorkspacePositionType | null
  customTypeLabel: string | null
  positionTypeLabel: string | null
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
    map[position] = {
      editIcs201: !catalog.customPositionNames.has(position),
    }
  }
  return map
}

export function buildPositionRosterEntries(
  roster: WorkspaceRosterMember[],
  permissions: PositionPermissionMap,
  settings: WorkspacePositionSettingsMap,
  searchQuery: string,
  catalog: WorkspacePositionCatalog = emptyWorkspacePositionCatalog(),
  schedulesByPosition: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }> = {},
  assetsByPosition: Record<string, PositionAssetRosterEntry[]> = {},
  assetSchedulesByPosition: Record<
    string,
    { assignAssetKeys: string[]; unassignAssetKeys: string[] }
  > = {},
  assetsByKey: Record<string, ResourceListItemData> = {},
  workspaceMetaByAssetKey: Record<string, PositionAssetWorkspaceMeta> = {},
  assetScheduleCompetencyByKey: Record<string, string | null> = {}
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
      const scheduledOrgChartMembers = roster.filter(
        (member) =>
          member.status !== 'removed' && member.pendingOrgChartReportsTo === position
      )
      const scheduledAssignees = schedule.assignMemberIds
        .map((memberId) => memberById.get(memberId))
        .filter((member): member is WorkspaceRosterMember => Boolean(member))
      const scheduledUnassignees = schedule.unassignMemberIds
        .map((memberId) => memberById.get(memberId))
        .filter((member): member is WorkspaceRosterMember => Boolean(member))
      const assetSchedule = assetSchedulesByPosition[position] ?? {
        assignAssetKeys: [],
        unassignAssetKeys: [],
      }
      const assets = assetsByPosition[position] ?? []
      const scheduledOrgChartAssets = Object.values(assetsByKey)
        .filter(
          (asset) =>
            !asset.orgChartReportsTo && asset.pendingOrgChartReportsTo === position
        )
        .map((asset) =>
          resolvePositionAssetEntry(
            asset.assetKey,
            assetsByKey,
            workspaceMetaByAssetKey,
            asset.competencyFunction ?? null
          )
        )
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      const scheduledAssignAssets = resolveScheduledPositionAssets(
        assetSchedule.assignAssetKeys,
        assetsByKey,
        workspaceMetaByAssetKey,
        Object.fromEntries(
          assetSchedule.assignAssetKeys.map((assetKey) => [
            assetKey,
            assetScheduleCompetencyByKey[
              `${assetKey}::${position}::assign_on_op_advance`
            ] ?? null,
          ])
        )
      )
      const scheduledUnassignAssets = resolveScheduledPositionAssets(
        assetSchedule.unassignAssetKeys,
        assetsByKey,
        workspaceMetaByAssetKey,
        Object.fromEntries(
          assetSchedule.unassignAssetKeys.map((assetKey) => [
            assetKey,
            assetScheduleCompetencyByKey[
              `${assetKey}::${position}::unassign_on_op_advance`
            ] ?? null,
          ])
        )
      )
      const resolvedType = resolvePositionType(position, settings, catalog)

      return {
        position,
        members: roster.filter(
          (member) => member.status !== 'removed' && member.icsPositions.includes(position)
        ),
        scheduledAssignees,
        scheduledUnassignees,
        scheduledOrgChartMembers,
        assets,
        scheduledAssignAssets,
        scheduledUnassignAssets,
        scheduledOrgChartAssets,
        memberSchedulePolicy: getPositionMemberSchedulePolicy(meta),
        editIcs201: permissions[position]?.editIcs201 ?? !catalog.customPositionNames.has(position),
        allowWorkAssignment: resolveAllowWorkAssignment(position, settings, catalog),
        positionType: resolvedType.positionType,
        customTypeLabel: resolvedType.customTypeLabel,
        positionTypeLabel: resolvedType.displayLabel,
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
        ...entry.scheduledOrgChartMembers,
      ]
      const searchableAssets = [
        ...entry.assets,
        ...entry.scheduledAssignAssets,
        ...entry.scheduledUnassignAssets,
        ...entry.scheduledOrgChartAssets,
      ]
      if (
        searchableAssets.some((asset) =>
          [asset.name, asset.type, asset.pointOfContactEmail ?? '']
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        )
      ) {
        return true
      }
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
    map[position] = { editIcs201: false }
  }
  for (const row of rows) {
    if (row.permission === WORKSPACE_PERMISSION_EDIT_ICS201 && map[row.ics_position]) {
      map[row.ics_position].editIcs201 = true
    }
  }
  return map
}
