import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import { filterVisibleOrgChartChildren, resolveOrgChartNodeConnectorId } from '@/features/roster/org-chart-visibility'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'

export type OrgChartSpinePartitionContext = {
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
  displayFilters: RosterDisplayFilters
}

function flattenStackNodes(
  nodes: OrgChartNode[],
  context: OrgChartSpinePartitionContext
): OrgChartNode[] {
  const flattened: OrgChartNode[] = []
  for (const node of nodes) {
    if (node.kind === 'stack') {
      flattened.push(
        ...flattenStackNodes(
          filterVisibleOrgChartChildren(
            node.children,
            context.visiblePositions,
            context.displayFilters
          ),
          context
        )
      )
      continue
    }
    if (node.kind === 'fork') {
      flattened.push(node)
      continue
    }
    flattened.push(node)
  }
  return flattened
}

function resolveNodeConnectorStyle(node: OrgChartNode): 'solid' | 'dashed' {
  return node.kind === 'position' && node.connectorStyle === 'dashed' ? 'dashed' : 'solid'
}

function collectDirectConnectorIds(
  nodes: OrgChartNode[],
  context: OrgChartSpinePartitionContext
): { solid: string[]; dashed: string[] } {
  const solid: string[] = []
  const dashed: string[] = []

  for (const node of nodes) {
    if (node.kind === 'fork') {
      const visibleChildren = filterVisibleOrgChartChildren(
        node.children,
        context.visiblePositions,
        context.displayFilters
      )
      for (const child of visibleChildren) {
        const connectorId = resolveOrgChartNodeConnectorId(child, context)
        if (!connectorId) continue
        if (resolveNodeConnectorStyle(child) === 'dashed') {
          dashed.push(connectorId)
        } else {
          solid.push(connectorId)
        }
      }
      continue
    }

    if (node.kind === 'stack') {
      const flattened = flattenStackNodes([node], context)
      for (const child of flattened) {
        const connectorId = resolveOrgChartNodeConnectorId(child, context)
        if (!connectorId) continue
        if (resolveNodeConnectorStyle(child) === 'dashed') {
          dashed.push(connectorId)
        } else {
          solid.push(connectorId)
        }
      }
      continue
    }

    const connectorId = resolveOrgChartNodeConnectorId(node, context)
    if (!connectorId) continue
    if (resolveNodeConnectorStyle(node) === 'dashed') {
      dashed.push(connectorId)
    } else {
      solid.push(connectorId)
    }
  }

  return { solid, dashed }
}

export function partitionWideSpineConnectorIds(
  nodes: OrgChartNode[],
  context: OrgChartSpinePartitionContext
): { solid: string[]; dashed: string[] } {
  const visibleNodes = filterVisibleOrgChartChildren(
    nodes,
    context.visiblePositions,
    context.displayFilters
  )
  return collectDirectConnectorIds(visibleNodes, context)
}

export function collectWideSpineChildIds(
  nodes: OrgChartNode[],
  context: OrgChartSpinePartitionContext
): string[] {
  const { solid, dashed } = partitionWideSpineConnectorIds(nodes, context)
  return [...solid, ...dashed]
}
