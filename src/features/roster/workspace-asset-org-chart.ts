import type { ResourceListItemData } from '@/features/resources/types'
import { buildReportsToOptions, normalizePositionName, type WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'

export function validateAssetOrgChartReportsTo(
  reportsTo: string,
  catalog: WorkspacePositionCatalog
): string | null {
  const normalized = normalizePositionName(reportsTo)
  if (!normalized) {
    return 'Select a position to report to.'
  }
  if (!catalog.allPositionNames.includes(normalized)) {
    return 'Reports-to position must be an existing position in this workspace.'
  }
  return null
}

export function countAssetsReportingToPosition(
  assets: ResourceListItemData[],
  positionName: string
): number {
  const normalized = normalizePositionName(positionName).toLowerCase()
  return assets.filter(
    (asset) => (asset.orgChartReportsTo ?? '').toLowerCase() === normalized
  ).length
}

export function getAssetsPlacedOnOrgChart(assets: ResourceListItemData[]): ResourceListItemData[] {
  return assets.filter((asset) => asset.orgChartReportsTo !== null)
}

const NOT_ON_ORG_CHART_VALUE = '__not_on_org_chart__'

export function buildAssetOrgChartReportsToOptions(
  catalog: WorkspacePositionCatalog
): Array<{ value: string; label: string }> {
  return [
    { value: NOT_ON_ORG_CHART_VALUE, label: 'Not on org chart' },
    ...buildReportsToOptions(catalog).map((position) => ({
      value: position,
      label: position,
    })),
  ]
}

export function orgChartSelectValue(reportsTo: string | null): string {
  return reportsTo ?? NOT_ON_ORG_CHART_VALUE
}

export function orgChartValueToReportsTo(value: string): string | null {
  return value === NOT_ON_ORG_CHART_VALUE ? null : value
}

function attachOrgChartNodeToTree(
  nodes: OrgChartNode[],
  parentName: string,
  child: OrgChartNode
): boolean {
  for (const node of nodes) {
    if (node.kind === 'asset') {
      continue
    }
    if (node.kind === 'position') {
      if (node.position === parentName) {
        node.children = [...(node.children ?? []), child]
        return true
      }
      if (node.children && attachOrgChartNodeToTree(node.children, parentName, child)) {
        return true
      }
      continue
    }
    if (node.kind === 'group' && attachOrgChartNodeToTree(node.children, parentName, child)) {
      return true
    }
  }
  return false
}

export function attachOrgChartAssetsToLayout(
  layout: WorkspaceOrgChartLayout,
  assets: ResourceListItemData[]
): WorkspaceOrgChartLayout {
  const placedAssets = assets
    .filter((asset) => asset.orgChartReportsTo)
    .sort((a, b) => {
      if (a.orgChartSortOrder !== b.orgChartSortOrder) {
        return a.orgChartSortOrder - b.orgChartSortOrder
      }
      return a.name.localeCompare(b.name)
    })

  for (const asset of placedAssets) {
    const reportsTo = asset.orgChartReportsTo
    if (!reportsTo) continue

    const childNode: OrgChartNode = {
      kind: 'asset',
      assetKey: asset.assetKey,
      label: asset.name,
      assetType: asset.type,
      color: 'neutral',
    }

    if (reportsTo === layout.rootPosition) {
      layout.rootChildren.push(childNode)
      continue
    }

    const allBranches: OrgChartNode[] = [
      ...layout.rootChildren,
      ...layout.commandStaffBranch.children,
      ...layout.sectionBranches.flatMap((branch) => branch.children),
    ]
    attachOrgChartNodeToTree(allBranches, reportsTo, childNode)
  }

  return layout
}
