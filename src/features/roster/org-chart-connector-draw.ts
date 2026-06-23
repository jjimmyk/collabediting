export type OrgChartSvgLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  thick?: boolean
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
  const parsed = Number.parseFloat(chart.dataset.orgChartZoom ?? '')
  if (Number.isFinite(parsed) && parsed > 0) return parsed

  let node: HTMLElement | null = chart
  while (node) {
    const zoomValue = Number.parseFloat(node.style.zoom)
    if (Number.isFinite(zoomValue) && zoomValue > 0) return zoomValue
    node = node.parentElement
  }

  return 1
}

/** Map viewport rects into the chart's layout coordinate space (CSS zoom aware). */
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

export function spineConnectLines(
  chart: HTMLElement,
  parentEl: HTMLElement,
  childEls: HTMLElement[],
  anchorRatio: number,
  zoom = readOrgChartZoom(chart)
): OrgChartSvgLine[] {
  if (childEls.length === 0) return []

  const parent = orgChartLayoutRect(chart, parentEl, zoom)
  const spineX = parent.left + parent.width * anchorRatio
  const spineTop = parent.bottom
  const childRects = childEls.map((child) => orgChartLayoutRect(chart, child, zoom))
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

export function icBusConnectLines(
  chart: HTMLElement,
  commanderEl: HTMLElement,
  headerEls: HTMLElement[],
  busOffsetPx = ORG_CHART_IC_BUS_OFFSET_PX,
  zoom = readOrgChartZoom(chart)
): OrgChartSvgLine[] {
  if (headerEls.length === 0) return []

  const commander = orgChartLayoutRect(chart, commanderEl, zoom)
  const cmdCx = commander.cx
  const cmdBottom = commander.bottom

  const headers = headerEls.map((el) => orgChartLayoutRect(chart, el, zoom))
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

