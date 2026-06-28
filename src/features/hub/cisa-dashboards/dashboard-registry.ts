import type { HubCisaDashboardId, HubMoreTab } from '@/features/hub/cisa-dashboards/types'
import { getHubCisaDashboardDefinitions } from '@/features/hub/cisa-dashboards/demo-widget-data'

export const HUB_CISA_DASHBOARD_IDS: HubCisaDashboardId[] = [
  'cisa-national-geospatial-cop',
  'cisa-cyber-operations',
  'cisa-fusion-cell',
  'cisa-hirt-infrastructure-analysis',
  'cisa-sector-dependency-consequence',
  'cisa-leadership-decision-view',
  'interagency-dashboard',
]

export const HUB_CISA_DASHBOARD_MENU_ITEMS: Array<{ tab: HubCisaDashboardId; label: string }> =
  getHubCisaDashboardDefinitions().map((dashboard) => ({
    tab: dashboard.id,
    label: dashboard.label,
  }))

export function isHubCisaDashboardTab(tab: HubMoreTab): tab is HubCisaDashboardId {
  return HUB_CISA_DASHBOARD_IDS.includes(tab as HubCisaDashboardId)
}

export function getHubCisaDashboardLabel(tab: HubCisaDashboardId): string {
  return HUB_CISA_DASHBOARD_MENU_ITEMS.find((item) => item.tab === tab)?.label ?? tab
}
