export type OrgChartSvgLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  thick?: boolean
}

export const ORG_CHART_IC_BUS_OFFSET_PX = 22

export function spineConnectLines(
  chartRect: DOMRect,
  parentEl: HTMLElement,
  childEls: HTMLElement[],
  anchorRatio: number
): OrgChartSvgLine[] {
  if (childEls.length === 0) return []

  const parent = parentEl.getBoundingClientRect()
  const spineX = parent.left - chartRect.left + parent.width * anchorRatio
  const spineTop = parent.bottom - chartRect.top
  const childRects = childEls.map((child) => {
    const rect = child.getBoundingClientRect()
    return {
      left: rect.left - chartRect.left,
      cy: rect.top - chartRect.top + rect.height / 2,
    }
  })
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
  chartRect: DOMRect,
  commanderEl: HTMLElement,
  headerEls: HTMLElement[],
  busOffsetPx = ORG_CHART_IC_BUS_OFFSET_PX
): OrgChartSvgLine[] {
  if (headerEls.length === 0) return []

  const commander = commanderEl.getBoundingClientRect()
  const cmdCx = commander.left - chartRect.left + commander.width / 2
  const cmdBottom = commander.bottom - chartRect.top

  const headers = headerEls.map((el) => {
    const rect = el.getBoundingClientRect()
    return {
      cx: rect.left - chartRect.left + rect.width / 2,
      top: rect.top - chartRect.top,
    }
  })

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
