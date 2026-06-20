import type { OrgChartColor } from '@/features/roster/ics-org-chart-structure'

export type OrgChartCanvasNodeKind = 'position' | 'asset' | 'single_resource'

export type OrgChartNodePosition = {
  x: number
  y: number
}

export type OrgChartViewport = {
  x: number
  y: number
  zoom: number
}

export type OrgChartPersistedLayout = {
  version: 1
  nodes: Record<string, OrgChartNodePosition>
  viewport?: OrgChartViewport
}

export type OrgChartCanvasNodeDef = {
  id: string
  kind: OrgChartCanvasNodeKind
  parentId: string | null
  position?: string
  assetKey?: string
  memberId?: string
  color?: OrgChartColor
}

export const ORG_CHART_NODE_WIDTH = 192
export const ORG_CHART_NODE_HEIGHT = 140
export const ORG_CHART_LAYOUT_H_GAP = 48
export const ORG_CHART_LAYOUT_V_GAP = 120
export const ORG_CHART_LAYOUT_ROOT_X = 640
export const ORG_CHART_LAYOUT_ROOT_Y = 40

export const EMPTY_ORG_CHART_PERSISTED_LAYOUT: OrgChartPersistedLayout = {
  version: 1,
  nodes: {},
}

export const DEFAULT_ORG_CHART_VIEWPORT: OrgChartViewport = {
  x: 0,
  y: 0,
  zoom: 1,
}
