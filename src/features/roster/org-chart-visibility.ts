import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'
import { singleResourceNodeVisible } from '@/features/roster/roster-display-filters'
import { orgChartNodeConnectorId } from '@/features/roster/org-chart-node-id'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'

export function filterVisibleOrgChartChildren(
  children: OrgChartNode[],
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters,
  isProjected = false
): OrgChartNode[] {
  return children.filter((child) => {
    if (child.kind === 'asset') return true
    if (child.kind === 'single_resource') {
      return singleResourceNodeVisible(child.scheduled, displayFilters, isProjected)
    }
    if (child.kind === 'stack' || child.kind === 'fork') {
      return (
        filterVisibleOrgChartChildren(
          child.children,
          visiblePositions,
          displayFilters,
          isProjected
        ).length > 0
      )
    }
    if (child.kind === 'position') {
      return (
        visiblePositions.has(child.position) ||
        filterVisibleOrgChartChildren(
          child.children ?? [],
          visiblePositions,
          displayFilters,
          isProjected
        ).length > 0
      )
    }
    return false
  })
}

export function positionNodeIsVisible(
  position: string,
  children: OrgChartNode[],
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters,
  isProjected = false
): boolean {
  if (visiblePositions.has(position)) return true
  return filterVisibleOrgChartChildren(children, visiblePositions, displayFilters, isProjected)
    .length > 0
}

export function orgChartNodeKey(node: OrgChartNode, index: number): string {
  if (node.kind === 'asset') return node.assetKey
  if (node.kind === 'single_resource') return node.memberId
  if (node.kind === 'position') return node.position
  if (node.kind === 'stack') return `stack-${index}`
  if (node.kind === 'fork') return `fork-${index}`
  return node.label
}

export function positionBranchIsVisible(
  node: Extract<OrgChartNode, { kind: 'position' }>,
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters,
  isProjected = false
): boolean {
  return positionNodeIsVisible(
    node.position,
    node.children ?? [],
    visiblePositions,
    displayFilters,
    isProjected
  )
}

export function resolveOrgChartNodeConnectorId(
  node: OrgChartNode,
  context: {
    entriesByPosition: Record<string, PositionRosterEntry>
    assetsByKey: Record<string, ResourceListItemData>
    rosterById: Record<string, WorkspaceRosterMember>
    visiblePositions: Set<string>
    displayFilters: RosterDisplayFilters
  }
): string | null {
  if (node.kind === 'asset') {
    return context.assetsByKey[node.assetKey] ? orgChartNodeConnectorId(node) : null
  }
  if (node.kind === 'single_resource') {
    if (!singleResourceNodeVisible(node.scheduled, context.displayFilters)) return null
    return context.rosterById[node.memberId] ? orgChartNodeConnectorId(node) : null
  }
  if (node.kind === 'position') {
    if (
      !positionNodeIsVisible(
        node.position,
        node.children ?? [],
        context.visiblePositions,
        context.displayFilters
      )
    ) {
      return null
    }
    if (!context.entriesByPosition[node.position]) return null
    return orgChartNodeConnectorId(node)
  }
  return null
}

export function buildIcDirectReportNodes(
  commandStaffNodes: Extract<OrgChartNode, { kind: 'position' }>[],
  rootChildren: OrgChartNode[]
): OrgChartNode[] {
  return [...commandStaffNodes, ...rootChildren]
}
