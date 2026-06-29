import { HUB_CISA_DASHBOARD_MENU_ITEMS } from '@/features/hub/cisa-dashboards/dashboard-registry'
import type { HubMoreTab } from '@/features/hub/cisa-dashboards/types'

export type HubMoreMenuItem = {
  tab: HubMoreTab
  label: string
}

const HUB_MORE_MENU_BASE: HubMoreMenuItem[] = [
  { tab: 'analytics', label: 'Analytics' },
  { tab: 'map-layers', label: 'Map Layers' },
  { tab: 'seerist', label: 'Seerist' },
  { tab: 'resources', label: 'Assets' },
  { tab: 'exercises', label: 'Exercises' },
  { tab: 'incident-list', label: 'Incidents' },
  { tab: 'sitreps', label: 'SITREPs' },
]

export function getHubMoreMenuItems(cisaEnabled: boolean): HubMoreMenuItem[] {
  if (!cisaEnabled) {
    return [...HUB_MORE_MENU_BASE]
  }

  return [
    ...HUB_MORE_MENU_BASE,
    ...HUB_CISA_DASHBOARD_MENU_ITEMS.map((item) => ({
      tab: item.tab,
      label: item.label,
    })),
  ]
}
