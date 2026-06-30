import {
  ORG_CHART_CARD_TO_CHILDREN_GAP_PX,
  ORG_CHART_SPINE_ANCHOR_RATIO,
  ORG_CHART_SUBORDINATE_ARM_CHANNEL_PX,
} from '@/features/roster/org-chart-layout-tokens'

export type OrgChartSvgLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  thick?: boolean
  dashed?: boolean
}

export type OrgChartLayoutRect = {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
  cx: number
  cy: number
}

export const ORG_CHART_IC_BUS_OFFSET_PX = 22

export function readOrgChartZoom(chart: HTMLElement): number {
  const fromDataset = Number.parseFloat(chart.dataset.orgChartZoom ?? '')
  if (Number.isFinite(fromDataset) && fromDataset > 0) {
    return fromDataset
  }

  let node: HTMLElement | null = chart.parentElement
  while (node) {
    const zoom = node.style.zoom
    if (zoom && zoom !== '1' && zoom !== 'normal') {
      const parsed = Number.parseFloat(zoom)
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed
      }
    }
    node = node.parentElement
  }

  return 1
}

/** Map viewport rects into the chart's layout coordinate space (CSS zoom aware). */
export function toLayoutSpace(
  chart: HTMLElement,
  element: HTMLElement,
  zoom = readOrgChartZoom(chart)
): OrgChartLayoutRect {
  return orgChartLayoutRect(chart, element, zoom)
}

/** @deprecated Prefer toLayoutSpace — kept for existing call sites. */
export function orgChartLayoutRect(
  chart: HTMLElement,
  element: HTMLElement,
  zoom = readOrgChartZoom(chart)
): OrgChartLayoutRect {
  const chartRect = chart.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  const scale = zoom > 0 ? zoom : 1
  const left = (rect.left - chartRect.left) / scale
  const top = (rect.top - chartRect.top) / scale
  const width = rect.width / scale
  const height = rect.height / scale
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    cx: left + width / 2,
    cy: top + height / 2,
  }
}

export function measureOrgChartCardRect(
  chart: HTMLElement,
  cardEl: HTMLElement,
  zoom = readOrgChartZoom(chart)
): OrgChartLayoutRect {
  return toLayoutSpace(chart, cardEl, zoom)
}

export function resolveSpineAnchorX(
  parentRect: OrgChartLayoutRect,
  anchorRatio = ORG_CHART_SPINE_ANCHOR_RATIO
): number {
  return parentRect.left + parentRect.width * anchorRatio
}

export function spineConnectLines(
  chart: HTMLElement,
  parentEl: HTMLElement,
  childEls: HTMLElement[],
  anchorRatio: number,
  zoom = readOrgChartZoom(chart)
): OrgChartSvgLine[] {
  if (childEls.length === 0) return []

  const parent = measureOrgChartCardRect(chart, parentEl, zoom)
  const spineX = resolveSpineAnchorX(parent, anchorRatio)
  const spineTop = parent.bottom + ORG_CHART_CARD_TO_CHILDREN_GAP_PX
  const childRects = childEls.map((child) => measureOrgChartCardRect(chart, child, zoom))
  const spineBottom = childRects[childRects.length - 1].cy

  return [
    { x1: spineX, y1: spineTop, x2: spineX, y2: spineBottom },
    ...childRects.map((child) => ({
      x1: spineX,
      y1: child.cy,
      x2: child.left,
      y2: child.cy,
    })),
  ]
}

export function crossbarConnectLines(
  chart: HTMLElement,
  parentEl: HTMLElement,
  childEls: HTMLElement[],
  zoom?: number
): OrgChartSvgLine[] {
  if (childEls.length === 0) return []

  const resolvedZoom = zoom ?? readOrgChartZoom(chart)
  const parent = measureOrgChartCardRect(chart, parentEl, resolvedZoom)
  const childRects = childEls.map((child) => measureOrgChartCardRect(chart, child, resolvedZoom))
  const busY = parent.bottom + ORG_CHART_CARD_TO_CHILDREN_GAP_PX

  return [
    { x1: parent.cx, y1: parent.bottom, x2: parent.cx, y2: busY },
    {
      x1: childRects[0].cx,
      y1: busY,
      x2: childRects[childRects.length - 1].cx,
      y2: busY,
    },
    ...childRects.map((child) => ({
      x1: child.cx,
      y1: busY,
      x2: child.cx,
      y2: child.top,
    })),
  ]
}

export function icBusConnectLines(
  chart: HTMLElement,
  commanderEl: HTMLElement,
  headerEls: HTMLElement[],
  busOffsetPx = ORG_CHART_IC_BUS_OFFSET_PX,
  zoom = readOrgChartZoom(chart)
): OrgChartSvgLine[] {
  if (headerEls.length === 0) return []

  const commander = measureOrgChartCardRect(chart, commanderEl, zoom)
  const cmdCx = commander.cx
  const cmdBottom = commander.bottom

  const headers = headerEls.map((el) => measureOrgChartCardRect(chart, el, zoom))
  const busY = headers[0].top - busOffsetPx

  return [
    { x1: cmdCx, y1: cmdBottom, x2: cmdCx, y2: busY, thick: true },
    {
      x1: headers[0].cx,
      y1: busY,
      x2: headers[headers.length - 1].cx,
      y2: busY,
      thick: true,
    },
    ...headers.map((header) => ({
      x1: header.cx,
      y1: busY,
      x2: header.cx,
      y2: header.top,
      thick: true,
    })),
  ]
}

/** Expected horizontal arm length from spine anchor to nested child left edge. */
export function expectedSpineHorizontalArmLengthPx(): number {
  return ORG_CHART_SUBORDINATE_ARM_CHANNEL_PX
}
