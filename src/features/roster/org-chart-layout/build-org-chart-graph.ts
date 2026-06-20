import type { Edge, Node } from '@xyflow/react'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'
import {
  assetNodeId,
  positionNodeId,
  singleResourceNodeId,
} from '@/features/roster/org-chart-layout/node-ids'
import type {
  OrgChartCanvasNodeDef,
  OrgChartNodePosition,
} from '@/features/roster/org-chart-layout/types'
import {
  ORG_CHART_NODE_HEIGHT,
  ORG_CHART_NODE_WIDTH,
} from '@/features/roster/org-chart-layout/types'

function positionHasVisibleSubtree(
  node: Extract<OrgChartNode, { kind: 'position' }>,
  visiblePositions: Set<string>
): boolean {
  if (visiblePositions.has(node.position)) return true
  return (node.children ?? []).some((child) => {
    if (child.kind === 'asset' || child.kind === 'single_resource') return true
    if (child.kind === 'position') return positionHasVisibleSubtree(child, visiblePositions)
    return false
  })
}

function walkOrgChartNodes(
  nodes: OrgChartNode[],
  parentId: string | null,
  visiblePositions: Set<string>,
  collected: OrgChartCanvasNodeDef[]
): void {
  for (const node of nodes) {
    if (node.kind === 'asset') {
      collected.push({
        id: assetNodeId(node.assetKey),
        kind: 'asset',
        assetKey: node.assetKey,
        parentId,
        color: node.color,
      })
      continue
    }

    if (node.kind === 'single_resource') {
      collected.push({
        id: singleResourceNodeId(node.memberId),
        kind: 'single_resource',
        memberId: node.memberId,
        parentId,
        color: node.color,
      })
      continue
    }

    if (node.kind === 'position') {
      if (!positionHasVisibleSubtree(node, visiblePositions)) {
        continue
      }
      const id = positionNodeId(node.position)
      collected.push({
        id,
        kind: 'position',
        position: node.position,
        parentId,
        color: node.color,
      })
      walkOrgChartNodes(node.children ?? [], id, visiblePositions, collected)
      continue
    }

    walkOrgChartNodes(node.children, parentId, visiblePositions, collected)
  }
}

export function collectOrgChartCanvasNodes(
  layout: WorkspaceOrgChartLayout,
  visiblePositions: Set<string>
): OrgChartCanvasNodeDef[] {
  const nodes: OrgChartCanvasNodeDef[] = []
  const rootId = positionNodeId(layout.rootPosition)
  const showRoot = visiblePositions.has(layout.rootPosition)

  if (showRoot) {
    nodes.push({
      id: rootId,
      kind: 'position',
      position: layout.rootPosition,
      parentId: null,
    })
  }

  const rootParentId = showRoot ? rootId : null

  walkOrgChartNodes(layout.rootChildren, rootParentId, visiblePositions, nodes)
  walkOrgChartNodes(layout.commandStaffBranch.children, rootParentId, visiblePositions, nodes)

  for (const branch of layout.sectionBranches) {
    walkOrgChartNodes(branch.children, rootParentId, visiblePositions, nodes)
  }

  return nodes
}

export function buildOrgChartFlowElements(
  nodeDefs: OrgChartCanvasNodeDef[],
  nodePositions: Record<string, OrgChartNodePosition>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = nodeDefs.map((def) => ({
    id: def.id,
    type: 'orgChart',
    position: nodePositions[def.id] ?? { x: 0, y: 0 },
    data: { def },
    draggable: false,
    selectable: false,
    width: ORG_CHART_NODE_WIDTH,
    height: ORG_CHART_NODE_HEIGHT,
  }))

  const edges: Edge[] = nodeDefs
    .filter((def) => def.parentId)
    .map((def) => ({
      id: `${def.parentId}->${def.id}`,
      source: def.parentId!,
      target: def.id,
      type: 'smoothstep',
      animated: false,
      selectable: false,
      focusable: false,
      style: { stroke: 'hsl(var(--border))', strokeWidth: 1.5 },
    }))

  return { nodes, edges }
}
