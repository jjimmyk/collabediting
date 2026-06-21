import type { ResourceListItemData } from '@/features/resources/types'
import { ICS_ORG_CHART_ROOT_POSITION } from '@/features/roster/ics-org-chart-structure'
import { countAssetsReportingToPosition } from '@/features/roster/workspace-asset-org-chart'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function positionHasCurrentOrScheduledMemberAssignees(
  entry: PositionRosterEntry
): boolean {
  return (
    entry.members.length > 0 ||
    entry.scheduledAssignees.length > 0 ||
    entry.scheduledUnassignees.length > 0
  )
}

export function positionHasAssignedAssets(entry: PositionRosterEntry): boolean {
  return (
    entry.assets.length > 0 ||
    entry.scheduledAssignAssets.length > 0 ||
    entry.scheduledUnassignAssets.length > 0 ||
    entry.scheduledOrgChartAssets.length > 0
  )
}

export function positionHasOrgChartDependencies(
  positionName: string,
  roster: WorkspaceRosterMember[],
  assets: ResourceListItemData[]
): boolean {
  const hasReportingMembers = roster.some(
    (member) =>
      member.status !== 'removed' &&
      (member.orgChartReportsTo === positionName ||
        member.pendingOrgChartReportsTo === positionName)
  )
  const hasReportingAssets =
    countAssetsReportingToPosition(assets, positionName) > 0 ||
    assets.some((asset) => asset.pendingOrgChartReportsTo === positionName)

  return hasReportingMembers || hasReportingAssets
}

export function positionHasChildCustomPositions(
  positionName: string,
  catalog: WorkspacePositionCatalog
): boolean {
  return catalog.customPositions.some(
    (row) => row.lifecycleStatus !== 'archived' && row.reportsTo === positionName
  )
}

export function positionRemovalBlockedReason(
  entry: PositionRosterEntry,
  catalog: WorkspacePositionCatalog,
  roster: WorkspaceRosterMember[],
  assets: ResourceListItemData[]
): string | null {
  if (entry.position === ICS_ORG_CHART_ROOT_POSITION) {
    return 'Incident Commander cannot be removed from the roster.'
  }
  if (positionHasCurrentOrScheduledMemberAssignees(entry)) {
    return 'Unassign all current and scheduled members before removing this position.'
  }
  if (entry.scheduledOrgChartMembers.length > 0) {
    return 'Remove scheduled org chart members before removing this position.'
  }
  if (positionHasAssignedAssets(entry)) {
    return 'Unassign all current and scheduled assets before removing this position.'
  }
  if (positionHasOrgChartDependencies(entry.position, roster, assets)) {
    return 'Remove org chart assets and single resources that report to this position first.'
  }
  if (positionHasChildCustomPositions(entry.position, catalog)) {
    return 'Remove or re-parent child positions before removing this position.'
  }
  return null
}

export function positionCanBeRemovedFromRoster(
  entry: PositionRosterEntry,
  catalog: WorkspacePositionCatalog,
  roster: WorkspaceRosterMember[],
  assets: ResourceListItemData[]
): boolean {
  return positionRemovalBlockedReason(entry, catalog, roster, assets) === null
}
