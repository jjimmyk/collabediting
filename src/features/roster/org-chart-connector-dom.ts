import type { OrgChartIcBusLink, OrgChartSpineLink } from '@/features/roster/org-chart-connector-context.types'

export const ORG_CHART_CONNECTOR_REDRAW_EVENT = 'org-chart-redraw-connectors'
export const ORG_CHART_IC_BUS_LINKS_ATTR = 'data-org-chart-ic-bus-links'

export function resolveOrgChartCardElement(
  chart: HTMLElement,
  id: string,
  getCardElement?: (id: string) => HTMLElement | null
): HTMLElement | null {
  const fromMap = getCardElement?.(id) ?? null
  if (fromMap?.isConnected) return fromMap

  const escapedId =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id
  return chart.querySelector<HTMLElement>(`[data-org-chart-id="${escapedId}"]`)
}

export function collectSpineLinksFromDom(chart: HTMLElement): OrgChartSpineLink[] {
  const links: OrgChartSpineLink[] = []
  for (const element of chart.querySelectorAll<HTMLElement>('[data-org-chart-spine-parent-id]')) {
    const parentId = element.getAttribute('data-org-chart-spine-parent-id')?.trim()
    const childIdsAttr = element.getAttribute('data-org-chart-spine-child-ids')?.trim()
    if (!parentId || !childIdsAttr) continue
    const childIds = childIdsAttr.split('\0').filter(Boolean)
    if (childIds.length === 0) continue
    links.push({ parentId, childIds })
  }
  return links
}

export function collectIcBusLinksFromDom(chart: HTMLElement): OrgChartIcBusLink[] {
  const raw = chart.getAttribute(ORG_CHART_IC_BUS_LINKS_ATTR)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as OrgChartIcBusLink[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function triggerOrgChartConnectorRedraw(root: HTMLElement): void {
  root.dispatchEvent(
    new CustomEvent(ORG_CHART_CONNECTOR_REDRAW_EVENT, { bubbles: false })
  )
}
