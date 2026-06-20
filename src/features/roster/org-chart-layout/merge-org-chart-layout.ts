import { computeDefaultOrgChartLayout } from '@/features/roster/org-chart-layout/default-org-chart-layout'
import type {
  OrgChartCanvasNodeDef,
  OrgChartNodePosition,
  OrgChartPersistedLayout,
  OrgChartViewport,
} from '@/features/roster/org-chart-layout/types'
import { DEFAULT_ORG_CHART_VIEWPORT } from '@/features/roster/org-chart-layout/types'

export function mergeOrgChartLayout(
  nodeDefs: OrgChartCanvasNodeDef[],
  saved: OrgChartPersistedLayout | null | undefined
): {
  nodePositions: Record<string, OrgChartNodePosition>
  viewport: OrgChartViewport
} {
  const defaults = computeDefaultOrgChartLayout(nodeDefs)
  const validIds = new Set(nodeDefs.map((def) => def.id))
  const merged: Record<string, OrgChartNodePosition> = { ...defaults }

  if (saved?.version === 1 && saved.nodes) {
    for (const [id, position] of Object.entries(saved.nodes)) {
      if (!validIds.has(id)) continue
      if (
        typeof position?.x === 'number' &&
        Number.isFinite(position.x) &&
        typeof position?.y === 'number' &&
        Number.isFinite(position.y)
      ) {
        merged[id] = { x: position.x, y: position.y }
      }
    }
  }

  const viewport =
    saved?.viewport &&
    typeof saved.viewport.x === 'number' &&
    typeof saved.viewport.y === 'number' &&
    typeof saved.viewport.zoom === 'number'
      ? saved.viewport
      : DEFAULT_ORG_CHART_VIEWPORT

  return { nodePositions: merged, viewport }
}

export function extractPersistedLayoutFromFlow(
  nodeDefs: OrgChartCanvasNodeDef[],
  nodePositions: Record<string, OrgChartNodePosition>,
  viewport: OrgChartViewport
): OrgChartPersistedLayout {
  const nodes: Record<string, OrgChartNodePosition> = {}
  for (const def of nodeDefs) {
    const position = nodePositions[def.id]
    if (position) {
      nodes[def.id] = { x: position.x, y: position.y }
    }
  }
  return {
    version: 1,
    nodes,
    viewport,
  }
}
