import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'

export const ORG_CHART_IC_CONNECTOR_ID = 'header:incident-commander'

export function orgChartPositionConnectorId(position: string): string {
  return `pos:${position}`
}

export function orgChartNodeConnectorId(node: OrgChartNode): string {
  if (node.kind === 'position') return orgChartPositionConnectorId(node.position)
  if (node.kind === 'asset') return `asset:${node.assetKey}`
  if (node.kind === 'single_resource') return `sr:${node.memberId}`
  return `node:${node.kind}`
}
