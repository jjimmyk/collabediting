import { buildRosterDisplayProjection } from '@/features/roster/build-roster-display-projection'
import { isOrgChartParentWithinOperationsSubtree } from '@/features/roster/operations-work-assignment-scope'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { Ics205aContactRow } from '@/features/ics205a/types'
import { buildWorkAssignmentTarget } from '@/lib/work-assignment-target'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

function emptyContactRow(id: number, assignedPosition: string, name: string): Ics205aContactRow {
  return {
    id,
    assignedPosition,
    name,
    cellPhone: '',
    radioFrequency: '',
    other: '',
  }
}

function buildResourceCategoriesById(
  entries: PositionRosterEntry[]
): Record<string, PositionResourceCategoryEntry & { positionName: string }> {
  const map: Record<string, PositionResourceCategoryEntry & { positionName: string }> = {}
  for (const entry of entries) {
    for (const category of entry.resourceCategories) {
      map[category.id] = { ...category, positionName: entry.position }
    }
  }
  return map
}

function singleResourceEligible(
  member: WorkspaceRosterMember,
  catalog: WorkspacePositionCatalog
): boolean {
  if (member.status === 'removed') return false
  if (member.assignmentKind !== 'single_resource') return false
  const reportsTo = member.orgChartReportsTo?.trim()
  if (!reportsTo) return false
  return isOrgChartParentWithinOperationsSubtree(reportsTo, catalog)
}

function orgChartAssetEligible(
  asset: ResourceListItemData,
  catalog: WorkspacePositionCatalog
): boolean {
  const reportsTo = asset.orgChartReportsTo?.trim()
  if (!reportsTo) return false
  return isOrgChartParentWithinOperationsSubtree(reportsTo, catalog)
}

export function buildIcs205aContactsFromNextOpRoster(input: {
  catalog: WorkspacePositionCatalog
  positionEntries: PositionRosterEntry[]
  roster: WorkspaceRosterMember[]
  assets: ResourceListItemData[]
}): Ics205aContactRow[] {
  const projected = buildRosterDisplayProjection({
    horizon: 'next_op',
    catalog: input.catalog,
    entries: input.positionEntries,
    roster: input.roster,
    assets: input.assets,
  })

  const { catalog, entries, roster, assetsByKey } = projected
  const resourceCategoriesById = buildResourceCategoriesById(entries)
  const rows: Ics205aContactRow[] = []
  let nextId = 1

  const positionAssetKeys = new Set<string>()

  const sortedEntries = [...entries].sort((left, right) =>
    left.position.localeCompare(right.position)
  )

  for (const entry of sortedEntries) {
    const positionTarget = buildWorkAssignmentTarget({
      type: 'position',
      position: entry.position,
      roster,
    }).value

    const memberRows: Ics205aContactRow[] = []
    for (const member of [...entry.members].sort((left, right) =>
      left.email.localeCompare(right.email)
    )) {
      if (member.status === 'removed') continue
      memberRows.push(
        emptyContactRow(
          0,
          positionTarget,
          buildWorkAssignmentTarget({
            type: 'member',
            memberId: member.id,
            position: entry.position,
            roster,
          }).value
        )
      )
    }

    const assetRows: Ics205aContactRow[] = []
    for (const asset of [...entry.assets].sort((left, right) =>
      left.name.localeCompare(right.name)
    )) {
      positionAssetKeys.add(asset.assetKey)
      assetRows.push(
        emptyContactRow(
          0,
          positionTarget,
          buildWorkAssignmentTarget({
            type: 'position_asset',
            assetKey: asset.assetKey,
            position: entry.position,
            roster,
            assetsByKey,
          }).value
        )
      )
    }

    const categoryRows: Ics205aContactRow[] = []
    for (const category of [...entry.resourceCategories].sort((left, right) =>
      left.name.localeCompare(right.name)
    )) {
      if (!category.filledMemberId && !category.filledAssetKey) continue
      categoryRows.push(
        emptyContactRow(
          0,
          positionTarget,
          buildWorkAssignmentTarget({
            type: 'resource_category',
            categoryId: category.id,
            position: entry.position,
            roster,
            resourceCategoriesById,
          }).value
        )
      )
    }

    const assigneeRows = [...memberRows, ...assetRows, ...categoryRows]
    if (assigneeRows.length === 0) {
      rows.push(emptyContactRow(nextId++, positionTarget, ''))
      continue
    }

    for (const row of assigneeRows) {
      rows.push(emptyContactRow(nextId++, row.assignedPosition, row.name))
    }
  }

  const singleResourceMembers = [...roster]
    .filter((member) => singleResourceEligible(member, catalog))
    .sort((left, right) => left.email.localeCompare(right.email))

  for (const member of singleResourceMembers) {
    const target = buildWorkAssignmentTarget({
      type: 'single_resource',
      memberId: member.id,
      roster,
    }).value
    rows.push(emptyContactRow(nextId++, target, target))
  }

  const orgChartAssets = [...projected.assets]
    .filter((asset) => orgChartAssetEligible(asset, catalog))
    .filter((asset) => !positionAssetKeys.has(asset.assetKey))
    .sort((left, right) => left.name.localeCompare(right.name))

  for (const asset of orgChartAssets) {
    const target = buildWorkAssignmentTarget({
      type: 'org_chart_asset',
      assetKey: asset.assetKey,
      roster,
      assetsByKey,
    }).value
    rows.push(emptyContactRow(nextId++, target, target))
  }

  return rows
}
