import { useLayoutEffect } from 'react'
import { ORG_CHART_PAINT_COMPLETE_ATTR } from '@/features/roster/org-chart-export-capture'
import { useOrgChartConnectors } from '@/features/roster/org-chart-connector-context'
import type { OrgChartIcBusLink, OrgChartSpineLink } from '@/features/roster/org-chart-connector-context.types'
import {
  collectIcBusLinksFromDom,
  collectSpineLinksFromDom,
  ORG_CHART_CONNECTOR_REDRAW_EVENT,
  ORG_CHART_IC_BUS_LINKS_ATTR,
  resolveOrgChartCardElement,
} from '@/features/roster/org-chart-connector-dom'
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

function mergeSpineLinks(
  primary: OrgChartSpineLink[],
  fallback: OrgChartSpineLink[]
): OrgChartSpineLink[] {
  const byParent = new Map<string, OrgChartSpineLink>()
  for (const link of [...fallback, ...primary]) {
    byParent.set(link.parentId, link)
  }
  return [...byParent.values()]
}

function mergeIcBusLinks(
  primary: OrgChartIcBusLink[],
  fallback: OrgChartIcBusLink[]
): OrgChartIcBusLink[] {
  if (primary.length > 0) return primary
  return fallback
}

function buildConnectorLines(
  chart: HTMLElement,
  svg: SVGSVGElement,
  getCardElement: (id: string) => HTMLElement | null,
  spineLinks: OrgChartSpineLink[],
  icBusLinks: OrgChartIcBusLink[],
  zoom: number
): ReturnType<typeof spineConnectLines> {
  const chartZoom = readOrgChartZoom(chart) || zoom
  const width = chart.offsetWidth
  const height = chart.offsetHeight
  if (width <= 0 || height <= 0) return []

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.innerHTML = ''

  const lines: ReturnType<typeof spineConnectLines> = []

  for (const link of spineLinks) {
    const parentEl = resolveOrgChartCardElement(chart, link.parentId, getCardElement)
    if (!parentEl) continue
    const childEls = link.childIds
      .map((id) => resolveOrgChartCardElement(chart, id, getCardElement))
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

  for (const icBus of icBusLinks) {
    const commanderEl = resolveOrgChartCardElement(chart, icBus.commanderId, getCardElement)
    const headerEls = icBus.headerIds
      .map((id) => resolveOrgChartCardElement(chart, id, getCardElement))
      .filter((el): el is HTMLElement => el !== null)
    if (commanderEl && headerEls.length > 0) {
      lines.push(...icBusConnectLines(chart, commanderEl, headerEls, undefined, chartZoom))
    }
  }

  return lines
}

export function OrgChartConnectorOverlay({ zoom = 1 }: { zoom?: number }) {
  const { chartRef, spineLinksRef, icBusLinksRef, getCardElement, subscribeRedraw } =
    useOrgChartConnectors()

  useLayoutEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const svg = chart.querySelector<SVGSVGElement>('[data-org-chart-connectors]')
    if (!svg) return

    let retryTimers: ReturnType<typeof globalThis.setTimeout>[] = []
    let cancelled = false

    const scheduleRetry = (delayMs: number) => {
      if (cancelled) return
      const timer = globalThis.setTimeout(() => {
        retryTimers = retryTimers.filter((entry) => entry !== timer)
        draw()
      }, delayMs)
      retryTimers.push(timer)
    }

    const draw = () => {
      if (cancelled) return

      const width = chart.offsetWidth
      const height = chart.offsetHeight
      if (width <= 0 || height <= 0) {
        chart.removeAttribute(ORG_CHART_PAINT_COMPLETE_ATTR)
        scheduleRetry(16)
        return
      }

      const spineLinks = mergeSpineLinks(
        spineLinksRef.current,
        collectSpineLinksFromDom(chart)
      )
      const icBusLinks = mergeIcBusLinks(
        icBusLinksRef.current,
        collectIcBusLinksFromDom(chart)
      )

      const lines = buildConnectorLines(
        chart,
        svg,
        getCardElement,
        spineLinks,
        icBusLinks,
        zoom
      )

      appendSvgLines(svg, lines)

      if (lines.length > 0) {
        chart.setAttribute(ORG_CHART_PAINT_COMPLETE_ATTR, 'true')
        return
      }

      chart.removeAttribute(ORG_CHART_PAINT_COMPLETE_ATTR)
      const cardCount = chart.querySelectorAll('[data-org-chart-id]').length
      if (cardCount > 1) {
        scheduleRetry(32)
      }
    }

    draw()
    scheduleRetry(100)
    scheduleRetry(300)

    let frameCancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!frameCancelled) draw()
      })
    })

    const observer = new ResizeObserver(draw)
    observer.observe(chart)

    const mutationObserver = new MutationObserver(() => {
      draw()
    })
    mutationObserver.observe(chart, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'data-org-chart-id',
        'data-org-chart-spine-parent-id',
        'data-org-chart-spine-child-ids',
        ORG_CHART_IC_BUS_LINKS_ATTR,
      ],
    })

    const unsubscribe = subscribeRedraw(draw)
    const handleRedrawEvent = () => draw()
    chart.addEventListener(ORG_CHART_CONNECTOR_REDRAW_EVENT, handleRedrawEvent)

    return () => {
      cancelled = true
      frameCancelled = true
      if (retryTimers.length > 0) {
        for (const timer of retryTimers) {
          globalThis.clearTimeout(timer)
        }
        retryTimers = []
      }
      observer.disconnect()
      mutationObserver.disconnect()
      unsubscribe()
      chart.removeEventListener(ORG_CHART_CONNECTOR_REDRAW_EVENT, handleRedrawEvent)
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
