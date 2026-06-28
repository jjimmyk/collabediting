export type HubCisaDashboardId =
  | 'cisa-national-geospatial-cop'
  | 'cisa-cyber-operations'
  | 'cisa-fusion-cell'
  | 'cisa-hirt-infrastructure-analysis'
  | 'cisa-sector-dependency-consequence'
  | 'cisa-leadership-decision-view'
  | 'interagency-dashboard'

export type HubDashboardKpiWidget = {
  kind: 'kpi'
  id: string
  label: string
  value: string
  hint?: string
}

export type HubDashboardBarChartWidget = {
  kind: 'bar-chart'
  id: string
  title: string
  description?: string
  dataKey: string
  data: Array<{ label: string; value: number }>
}

export type HubDashboardCategoryBarsWidget = {
  kind: 'category-bars'
  id: string
  title: string
  description?: string
  rows: Array<{ category: string; count: number; detail?: string }>
}

export type HubDashboardTableWidget = {
  kind: 'table'
  id: string
  title: string
  description?: string
  columns: string[]
  rows: string[][]
}

export type HubDashboardWidget =
  | HubDashboardKpiWidget
  | HubDashboardBarChartWidget
  | HubDashboardCategoryBarsWidget
  | HubDashboardTableWidget

export type HubCisaDashboardDefinition = {
  id: HubCisaDashboardId
  label: string
  description: string
  widgets: HubDashboardWidget[]
}

export type HubMoreTab =
  | 'notifications'
  | 'resources'
  | 'aors'
  | 'fema-regions'
  | 'incident-list'
  | 'roster'
  | 'exercises'
  | 'events'
  | 'analytics'
  | 'map-layers'
  | 'briefing'
  | 'msel'
  | 'exercise-objectives'
  | 'sitreps'
  | 'seerist'
  | 'workspace-settings'
  | 'files'
  | HubCisaDashboardId
  | `form-${string}`
