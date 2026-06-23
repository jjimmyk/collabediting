import { useLayoutEffect } from 'react'
import { ORG_CHART_PAINT_COMPLETE_ATTR } from '@/features/roster/org-chart-export-capture'
import { useOrgChartConnectors } from '@/features/roster/org-chart-connector-context'
import {
  icBusConnectLines,
  readOrgChartZoom,
  spineConnectLines,
} from '@/features/roster/org-chart-connector-draw'
import { ORG_CHART_SPINE_ANCHOR_RATIO } from '@/features/roster/org-chart-layout-tokens'

function appendSvgLines(
  svg: SVGSVGElement,
  lines: ReturnType<typeof spineConnectLines>
) {
  for (const segment of lines) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    el.setAttribute('x1', String(segment.x1))
    el.setAttribute('y1', String(segment.y1))
    el.setAttribute('x2', String(segment.x2))
    el.setAttribute('y2', String(segment.y2))
    el.setAttribute(
      'stroke',
      segment.thick ? 'rgb(107 114 128)' : 'rgb(156 163 175)'
    )
    el.setAttribute('stroke-width', segment.thick ? '2' : '1.5')
    svg.appendChild(el)
  }
}

export function OrgChartConnectorOverlay({ zoom = 1 }: { zoom?: number }) {
  const { chartRef, spineLinksRef, icBusLinksRef, getCardElement, subscribeRedraw } =
    useOrgChartConnectors()

  useLayoutEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const svg = chart.querySelector<SVGSVGElement>('[data-org-chart-connectors]')
    if (!svg) return

    const draw = () => {
      const chartZoom = readOrgChartZoom(chart) || zoom
      const width = chart.offsetWidth
      const height = chart.offsetHeight
      if (width <= 0 || height <= 0) return

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
      svg.setAttribute('width', String(width))
      svg.setAttribute('height', String(height))
      svg.innerHTML = ''

      const lines: ReturnType<typeof spineConnectLines> = []

      for (const link of spineLinksRef.current) {
        const parentEl = getCardElement(link.parentId)
        if (!parentEl) continue
        const childEls = link.childIds
          .map((id) => getCardElement(id))
          .filter((el): el is HTMLElement => el !== null)
        if (childEls.length === 0) continue
        lines.push(
          ...spineConnectLines(
            chart,
            parentEl,
            childEls,
            ORG_CHART_SPINE_ANCHOR_RATIO,
            chartZoom
          )
        )
      }

      for (const icBus of icBusLinksRef.current) {
        const commanderEl = getCardElement(icBus.commanderId)
        const headerEls = icBus.headerIds
          .map((id) => getCardElement(id))
          .filter((el): el is HTMLElement => el !== null)
        if (commanderEl && headerEls.length > 0) {
          lines.push(...icBusConnectLines(chart, commanderEl, headerEls, undefined, chartZoom))
        }
      }

      appendSvgLines(svg, lines)
      chart.setAttribute(ORG_CHART_PAINT_COMPLETE_ATTR, 'true')
    }

    draw()
    let cancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) draw()
      })
    })
    const observer = new ResizeObserver(draw)
    observer.observe(chart)
    const unsubscribe = subscribeRedraw(draw)
    return () => {
      cancelled = true
      observer.disconnect()
      unsubscribe()
    }
  }, [chartRef, getCardElement, icBusLinksRef, spineLinksRef, subscribeRedraw, zoom])

  return (
    <svg
      data-org-chart-connectors
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
    />
  )
}
