import type {
  OrgChartCanvasNodeDef,
  OrgChartNodePosition,
} from '@/features/roster/org-chart-layout/types'
import {
  ORG_CHART_LAYOUT_H_GAP,
  ORG_CHART_LAYOUT_ROOT_X,
  ORG_CHART_LAYOUT_ROOT_Y,
  ORG_CHART_LAYOUT_V_GAP,
  ORG_CHART_NODE_HEIGHT,
  ORG_CHART_NODE_WIDTH,
} from '@/features/roster/org-chart-layout/types'

function groupNodesByParent(
  nodeDefs: OrgChartCanvasNodeDef[]
): Map<string | null, OrgChartCanvasNodeDef[]> {
  const byParent = new Map<string | null, OrgChartCanvasNodeDef[]>()
  for (const def of nodeDefs) {
    const list = byParent.get(def.parentId) ?? []
    list.push(def)
    byParent.set(def.parentId, list)
  }
  return byParent
}

export function computeDefaultOrgChartLayout(
  nodeDefs: OrgChartCanvasNodeDef[]
): Record<string, OrgChartNodePosition> {
  if (nodeDefs.length === 0) {
    return {}
  }

  const byParent = groupNodesByParent(nodeDefs)
  const positions: Record<string, OrgChartNodePosition> = {}
  let level = byParent.get(null) ?? []
  let y = ORG_CHART_LAYOUT_ROOT_Y

  while (level.length > 0) {
    const rowWidth =
      level.length * ORG_CHART_NODE_WIDTH + Math.max(0, level.length - 1) * ORG_CHART_LAYOUT_H_GAP
    let x = ORG_CHART_LAYOUT_ROOT_X - rowWidth / 2

    for (const node of level) {
      positions[node.id] = { x, y }
      x += ORG_CHART_NODE_WIDTH + ORG_CHART_LAYOUT_H_GAP
    }

    y += ORG_CHART_NODE_HEIGHT + ORG_CHART_LAYOUT_V_GAP
    level = level.flatMap((node) => byParent.get(node.id) ?? [])
  }

  return positions
}
