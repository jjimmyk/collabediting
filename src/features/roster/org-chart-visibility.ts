import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'
import { singleResourceNodeVisible } from '@/features/roster/roster-display-filters'

export function filterVisibleOrgChartChildren(
  children: OrgChartNode[],
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters
): OrgChartNode[] {
  return children.filter((child) => {
    if (child.kind === 'asset') return true
    if (child.kind === 'single_resource') {
      return singleResourceNodeVisible(child.scheduled, displayFilters)
    }
    if (child.kind === 'stack' || child.kind === 'fork') {
      return (
        filterVisibleOrgChartChildren(child.children, visiblePositions, displayFilters).length > 0
      )
    }
    if (child.kind === 'position') {
      return (
        visiblePositions.has(child.position) ||
        filterVisibleOrgChartChildren(child.children ?? [], visiblePositions, displayFilters)
          .length > 0
      )
    }
    return false
  })
}

export function positionNodeIsVisible(
  position: string,
  children: OrgChartNode[],
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters
): boolean {
  if (visiblePositions.has(position)) return true
  return filterVisibleOrgChartChildren(children, visiblePositions, displayFilters).length > 0
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
  displayFilters: RosterDisplayFilters
): boolean {
  return positionNodeIsVisible(
    node.position,
    node.children ?? [],
    visiblePositions,
    displayFilters
  )
}
