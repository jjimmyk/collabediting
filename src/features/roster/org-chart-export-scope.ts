import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog, WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type OrgChartExportScope = 'current_op' | 'next_op'

/** @deprecated Export uses the roster's current zoom at dialog open time. */
export const ICS207_EXPORT_ZOOM = 0.6

function positionMetaIncludedInExport(
  meta: WorkspacePositionMeta | undefined,
  scope: OrgChartExportScope
): boolean {
  if (!meta) return false
  if (scope === 'next_op') {
    if (meta.opAdvanceLabel === 'retire_on_op_advance') return false
    if (meta.isPlanned && meta.opAdvanceLabel === 'create_on_op_advance') return true
  } else if (meta.isPlanned && meta.opAdvanceLabel === 'create_on_op_advance') {
    return false
  }
  return meta.isOnOrgChart
}

export function projectPositionCatalogForExport(
  catalog: WorkspacePositionCatalog,
  scope: OrgChartExportScope
): WorkspacePositionCatalog {
  const rosterPositionNames = catalog.rosterPositionNames.filter((name) =>
    positionMetaIncludedInExport(catalog.positionMetaByName[name], scope)
  )
  const orgChartPositionNames = rosterPositionNames.filter((name) => {
    const meta = catalog.positionMetaByName[name]
    return meta?.isOnOrgChart || (scope === 'next_op' && meta?.isPlanned)
  })

  const customPositions =
    scope === 'next_op'
      ? catalog.customPositions
      : catalog.customPositions.filter(
          (row) => row.lifecycleStatus !== 'planned_create'
        )

  return {
    ...catalog,
    rosterPositionNames,
    allPositionNames: orgChartPositionNames,
    orgChartPositionNames,
    customPositions,
  }
}

export function projectPositionRosterEntryForExport(
  entry: PositionRosterEntry,
  catalog: WorkspacePositionCatalog,
  scope: OrgChartExportScope
): PositionRosterEntry | null {
  const meta = catalog.positionMetaByName[entry.position]
  if (!positionMetaIncludedInExport(meta, scope)) return null

  if (scope === 'current_op') {
    return {
      ...entry,
      scheduledAssignees: [],
      scheduledUnassignees: [],
      scheduledOrgChartMembers: [],
      scheduledAssignAssets: [],
      scheduledUnassignAssets: [],
      scheduledOrgChartAssets: [],
      resourceCategories: [],
    }
  }

  const unassignMemberIds = new Set(entry.scheduledUnassignees.map((member) => member.id))
  const unassignAssetKeys = new Set(entry.scheduledUnassignAssets.map((asset) => asset.assetKey))

  return {
    ...entry,
    members: [
      ...entry.members.filter((member) => !unassignMemberIds.has(member.id)),
      ...entry.scheduledAssignees,
    ],
    assets: [
      ...entry.assets.filter((asset) => !unassignAssetKeys.has(asset.assetKey)),
      ...entry.scheduledAssignAssets,
    ],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    resourceCategories: [
      ...entry.resourceCategories.filter((category) => category.lifecycle === 'active'),
      ...entry.resourceCategories
        .filter((category) => category.lifecycle === 'scheduled_assign')
        .map((category) => ({ ...category, lifecycle: 'active' as const })),
    ],
  }
}

export function projectPositionRosterEntriesForExport(
  entries: PositionRosterEntry[],
  catalog: WorkspacePositionCatalog,
  scope: OrgChartExportScope
): PositionRosterEntry[] {
  return entries
    .map((entry) => projectPositionRosterEntryForExport(entry, catalog, scope))
    .filter((entry): entry is PositionRosterEntry => entry !== null)
}

export function projectAssetsForOrgChartExport(
  assets: ResourceListItemData[],
  scope: OrgChartExportScope
): ResourceListItemData[] {
  if (scope === 'current_op') {
    return assets.map((asset) => ({
      ...asset,
      pendingOrgChartReportsTo: null,
      pendingCompetencyFunction: null,
    }))
  }

  return assets.map((asset) => {
    const effectiveReportsTo = asset.orgChartReportsTo ?? asset.pendingOrgChartReportsTo ?? null
    return {
      ...asset,
      orgChartReportsTo: effectiveReportsTo,
      pendingOrgChartReportsTo: null,
      pendingCompetencyFunction: null,
    }
  })
}

export function projectRosterForOrgChartExport(
  roster: WorkspaceRosterMember[],
  scope: OrgChartExportScope
): WorkspaceRosterMember[] {
  if (scope === 'current_op') {
    return roster.map((member) => ({
      ...member,
      pendingOrgChartReportsTo: null,
    }))
  }

  return roster.map((member) => {
    if (member.assignmentKind !== 'single_resource') {
      return {
        ...member,
        pendingOrgChartReportsTo: null,
      }
    }
    const effectiveReportsTo =
      member.orgChartReportsTo ?? member.pendingOrgChartReportsTo ?? null
    return {
      ...member,
      orgChartReportsTo: effectiveReportsTo,
      pendingOrgChartReportsTo: null,
    }
  })
}

export function buildProjectedOrgChartExportData(input: {
  catalog: WorkspacePositionCatalog
  entries: PositionRosterEntry[]
  assets: ResourceListItemData[]
  roster: WorkspaceRosterMember[]
  scope: OrgChartExportScope
}) {
  const projectedCatalog = projectPositionCatalogForExport(input.catalog, input.scope)
  const projectedEntries = projectPositionRosterEntriesForExport(
    input.entries,
    input.catalog,
    input.scope
  )
  const projectedAssets = projectAssetsForOrgChartExport(input.assets, input.scope)
  const projectedRoster = projectRosterForOrgChartExport(input.roster, input.scope)

  const entriesByPosition = Object.fromEntries(
    projectedEntries.map((entry) => [entry.position, entry])
  )
  const assetsByKey = Object.fromEntries(
    projectedAssets.map((asset) => [asset.assetKey, asset])
  )
  const rosterById = Object.fromEntries(
    projectedRoster.map((member) => [member.id, member])
  )

  return {
    catalog: projectedCatalog,
    entries: projectedEntries,
    entriesByPosition,
    assets: projectedAssets,
    assetsByKey,
    roster: projectedRoster,
    rosterById,
  }
}
