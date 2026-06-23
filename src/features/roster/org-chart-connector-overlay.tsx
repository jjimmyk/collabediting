import { useLayoutEffect } from 'react'
import { ORG_CHART_PAINT_COMPLETE_ATTR } from '@/features/roster/org-chart-export-capture'
import { useOrgChartConnectors } from '@/features/roster/org-chart-connector-context'
import type { OrgChartIcBusLink, OrgChartSpineLink } from '@/features/roster/org-chart-connector-context.types'
import {
  collectIcBusLinksFromDom,
  collectSpineLinksFromDom,
  ORG_CHART_CONNECTOR_REDRAW_EVENT,
  resolveOrgChartCardElement,
} from '@/features/roster/org-chart-connector-dom'
import {
  icBusConnectLines,
  readOrgChartZoom,
  spineConnectLines,
  type OrgChartSvgLine,
} from '@/features/roster/org-chart-connector-draw'
import { ORG_CHART_SPINE_ANCHOR_RATIO } from '@/features/roster/org-chart-layout-tokens'

const MAX_MOUNT_RETRIES = 8
const MOUNT_RETRY_MS = 100

function appendSvgLines(svg: SVGSVGElement, lines: OrgChartSvgLine[]) {
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
  return primary.length > 0 ? primary : fallback
}

function computeConnectorLines(
  chart: HTMLElement,
  getCardElement: (id: string) => HTMLElement | null,
  spineLinks: OrgChartSpineLink[],
  icBusLinks: OrgChartIcBusLink[],
  zoom: number
): OrgChartSvgLine[] {
  const chartZoom = readOrgChartZoom(chart) || zoom
  const lines: OrgChartSvgLine[] = []

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

    let cancelled = false
    let drawing = false
    let drawScheduled = false
    let mountRetryCount = 0
    let mountRetryTimer: ReturnType<typeof globalThis.setTimeout> | null = null

    const clearMountRetry = () => {
      if (mountRetryTimer !== null) {
        globalThis.clearTimeout(mountRetryTimer)
        mountRetryTimer = null
      }
    }

    const scheduleDraw = () => {
      if (cancelled || drawScheduled) return
      drawScheduled = true
      requestAnimationFrame(() => {
        drawScheduled = false
        if (!cancelled) draw()
      })
    }

    const maybeScheduleMountRetry = (lineCount: number) => {
      const cardCount = chart.querySelectorAll('[data-org-chart-id]').length
      if (
        cancelled ||
        lineCount > 0 ||
        cardCount <= 1 ||
        mountRetryCount >= MAX_MOUNT_RETRIES ||
        mountRetryTimer !== null
      ) {
        return
      }
      mountRetryCount += 1
      mountRetryTimer = globalThis.setTimeout(() => {
        mountRetryTimer = null
        scheduleDraw()
      }, MOUNT_RETRY_MS)
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleDraw()
    })

    const draw = () => {
      if (cancelled || drawing) return

      const width = chart.offsetWidth
      const height = chart.offsetHeight
      if (width <= 0 || height <= 0) {
        chart.removeAttribute(ORG_CHART_PAINT_COMPLETE_ATTR)
        maybeScheduleMountRetry(0)
        return
      }

      drawing = true
      resizeObserver.disconnect()

      try {
        const spineLinks = mergeSpineLinks(
          spineLinksRef.current,
          collectSpineLinksFromDom(chart)
        )
        const icBusLinks = mergeIcBusLinks(
          icBusLinksRef.current,
          collectIcBusLinksFromDom(chart)
        )
        const lines = computeConnectorLines(
          chart,
          getCardElement,
          spineLinks,
          icBusLinks,
          zoom
        )

        svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        svg.setAttribute('width', String(width))
        svg.setAttribute('height', String(height))
        svg.replaceChildren()
        appendSvgLines(svg, lines)

        if (lines.length > 0) {
          chart.setAttribute(ORG_CHART_PAINT_COMPLETE_ATTR, 'true')
          clearMountRetry()
        } else {
          chart.removeAttribute(ORG_CHART_PAINT_COMPLETE_ATTR)
          maybeScheduleMountRetry(0)
        }
      } finally {
        drawing = false
        if (!cancelled) {
          resizeObserver.observe(chart)
        }
      }
    }

    scheduleDraw()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) scheduleDraw()
      })
    })

    resizeObserver.observe(chart)
    const unsubscribe = subscribeRedraw(scheduleDraw)
    const handleRedrawEvent = () => scheduleDraw()
    chart.addEventListener(ORG_CHART_CONNECTOR_REDRAW_EVENT, handleRedrawEvent)

    return () => {
      cancelled = true
      clearMountRetry()
      resizeObserver.disconnect()
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
