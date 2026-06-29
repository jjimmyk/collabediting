import { describe, expect, it } from 'vitest'
import {
  getHubCisaDashboardLabel,
  HUB_CISA_DASHBOARD_IDS,
  HUB_CISA_DASHBOARD_MENU_ITEMS,
  isHubCisaDashboardTab,
} from '@/features/hub/cisa-dashboards/dashboard-registry'
import { getHubCisaDashboardDefinitions } from '@/features/hub/cisa-dashboards/demo-widget-data'

describe('hub cisa dashboard registry', () => {
  it('defines seven unique hub dashboards', () => {
    expect(HUB_CISA_DASHBOARD_IDS).toHaveLength(7)
    expect(HUB_CISA_DASHBOARD_MENU_ITEMS).toHaveLength(7)
    expect(new Set(HUB_CISA_DASHBOARD_IDS).size).toBe(7)
    expect(new Set(HUB_CISA_DASHBOARD_MENU_ITEMS.map((item) => item.label)).size).toBe(7)
  })

  it('includes Interagency Dashboard without a CISA suffix', () => {
    expect(HUB_CISA_DASHBOARD_MENU_ITEMS.some((item) => item.label === 'Interagency Dashboard')).toBe(
      true
    )
    const cisaMenuLabels = HUB_CISA_DASHBOARD_MENU_ITEMS.filter(
      (item) => item.tab !== 'interagency-dashboard'
    ).map((item) => item.label)
    expect(cisaMenuLabels.every((label) => label.includes('(CISA)'))).toBe(true)
  })

  it('provides synthetic demo widgets for every dashboard', () => {
    for (const dashboard of getHubCisaDashboardDefinitions()) {
      if (dashboard.id === 'cisa-national-geospatial-cop') {
        continue
      }
      expect(dashboard.widgets.length).toBeGreaterThan(0)
      expect(dashboard.widgets.some((widget) => widget.kind === 'kpi')).toBe(true)
    }
  })

  it('detects hub cisa dashboard tabs', () => {
    expect(isHubCisaDashboardTab('cisa-fusion-cell')).toBe(true)
    expect(isHubCisaDashboardTab('interagency-dashboard')).toBe(true)
    expect(isHubCisaDashboardTab('analytics')).toBe(false)
    expect(getHubCisaDashboardLabel('interagency-dashboard')).toBe('Interagency Dashboard')
  })
})
