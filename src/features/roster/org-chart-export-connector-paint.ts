import {
  buildWideLayoutConnectorLinks,
  type OrgChartConnectorLinkContext,
} from '@/features/roster/build-wide-layout-connector-links'
import {
  icBusConnectLines,
  readOrgChartZoom,
  spineConnectLines,
  type OrgChartSvgLine,
} from '@/features/roster/org-chart-connector-draw'
import { ORG_CHART_SPINE_ANCHOR_RATIO } from '@/features/roster/org-chart-layout-tokens'
import { buildOrgChartLayoutForExport } from '@/features/roster/build-org-chart-for-export'
import { resolveIcs207CaptureRoot } from '@/features/roster/org-chart-export-capture'
import { buildProjectedOrgChartExportData } from '@/features/roster/org-chart-export-scope'
import { resolveVisibleRosterPositions } from '@/features/roster/roster-display-filters'
import type { ExportOrgChartIcs207Input } from '@/features/ics207/export-org-chart-ics207'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'

export const ICS207_EXPORT_CONNECTORS_ATTR = 'data-ics207-export-connectors'

export type OrgChartExportPaintInput = {
  orgChartLayout: WorkspaceOrgChartLayout
  linkContext: OrgChartConnectorLinkContext
  zoom: number
}

export type ExportConnectorPaintResult = {
  lineCount: number
  ok: boolean
  reason?: string
}

function escapeConnectorId(id: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id
}

export function resolveOrgChartCardElement(
  chart: HTMLElement,
  id: string
): HTMLElement | null {
  return chart.querySelector<HTMLElement>(`[data-org-chart-id="${escapeConnectorId(id)}"]`)
}

export function countExportConnectorLines(root: HTMLElement): number {
  return root.querySelectorAll(`[${ICS207_EXPORT_CONNECTORS_ATTR}] line`).length
}

export function countOrgChartConnectorLinesAny(root: HTMLElement): number {
  return root.querySelectorAll(
    '[data-org-chart-connectors] line, [data-ics207-export-connectors] line'
  ).length
}

function appendSvgLines(svg: SVGSVGElement, lines: OrgChartSvgLine[]): void {
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

export function ensureIcs207ExportConnectorSvg(chart: HTMLElement): SVGSVGElement {
  const existing = chart.querySelector<SVGSVGElement>(`[${ICS207_EXPORT_CONNECTORS_ATTR}]`)
  if (existing) return existing

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute(ICS207_EXPORT_CONNECTORS_ATTR, '')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add(
    'pointer-events-none',
    'absolute',
    'inset-0',
    'z-0',
    'h-full',
    'w-full',
    'overflow-visible'
  )
  chart.appendChild(svg)
  return svg
}

function computeConnectorLines(
  chart: HTMLElement,
  input: OrgChartExportPaintInput
): OrgChartSvgLine[] {
  const { spineLinks, icBusLinks } = buildWideLayoutConnectorLinks(
    input.orgChartLayout,
    input.linkContext
  )
  const chartZoom = readOrgChartZoom(chart) || input.zoom
  const lines: OrgChartSvgLine[] = []

  for (const link of spineLinks) {
    const parentEl = resolveOrgChartCardElement(chart, link.parentId)
    if (!parentEl) continue
    const childEls = link.childIds
      .map((id) => resolveOrgChartCardElement(chart, id))
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
    const commanderEl = resolveOrgChartCardElement(chart, icBus.commanderId)
    const headerEls = icBus.headerIds
      .map((id) => resolveOrgChartCardElement(chart, id))
      .filter((el): el is HTMLElement => el !== null)
    if (commanderEl && headerEls.length > 0) {
      lines.push(...icBusConnectLines(chart, commanderEl, headerEls, undefined, chartZoom))
    }
  }

  return lines
}

export function paintExportConnectors(
  chart: HTMLElement,
  input: OrgChartExportPaintInput
): ExportConnectorPaintResult {
  const width = chart.offsetWidth
  const height = chart.offsetHeight
  const cardCount = chart.querySelectorAll('[data-org-chart-id]').length

  if (width <= 0 || height <= 0) {
    return { lineCount: 0, ok: false, reason: 'Org chart has zero dimensions.' }
  }

  if (cardCount <= 1) {
    const svg = ensureIcs207ExportConnectorSvg(chart)
    svg.replaceChildren()
    return { lineCount: 0, ok: true }
  }

  const lines = computeConnectorLines(chart, input)
  const svg = ensureIcs207ExportConnectorSvg(chart)
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.replaceChildren()
  appendSvgLines(svg, lines)

  if (lines.length === 0) {
    return {
      lineCount: 0,
      ok: false,
      reason: 'Could not measure org chart cards for connector lines.',
    }
  }

  return { lineCount: lines.length, ok: true }
}

export function buildOrgChartExportPaintInput(
  exportInput: ExportOrgChartIcs207Input
): OrgChartExportPaintInput {
  const projected = buildProjectedOrgChartExportData({
    catalog: exportInput.catalog,
    entries: exportInput.entries,
    assets: exportInput.assets,
    roster: exportInput.roster,
    scope: exportInput.scope,
  })

  const orgChartLayout = buildOrgChartLayoutForExport(
    projected.catalog,
    projected.assets,
    projected.roster,
    exportInput.scope
  )

  const visiblePositions = resolveVisibleRosterPositions(
    projected.entries,
    exportInput.visualSnapshot.displayFilters,
    projected.catalog
  )

  return {
    orgChartLayout,
    linkContext: {
      entriesByPosition: projected.entriesByPosition,
      assetsByKey: projected.assetsByKey,
      rosterById: projected.rosterById,
      visiblePositions,
      displayFilters: exportInput.visualSnapshot.displayFilters,
    },
    zoom: exportInput.visualSnapshot.zoom,
  }
}

async function nextFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
}

export async function waitAndPaintExportConnectors(
  container: HTMLElement,
  input: OrgChartExportPaintInput,
  options: { timeoutMs?: number } = {}
): Promise<ExportConnectorPaintResult> {
  const timeoutMs = options.timeoutMs ?? 8_000
  const started = Date.now()
  let lastResult: ExportConnectorPaintResult = {
    lineCount: 0,
    ok: false,
    reason: 'Org chart preview is not ready.',
  }

  while (Date.now() - started < timeoutMs) {
    const chart = resolveIcs207CaptureRoot(container)
    if (!chart) {
      await nextFrames(1)
      continue
    }

    const cardCount = chart.querySelectorAll('[data-org-chart-id]').length
    if (cardCount === 0) {
      await nextFrames(1)
      continue
    }

    lastResult = paintExportConnectors(chart, input)
    if (lastResult.ok) {
      await nextFrames(2)
      return lastResult
    }

    await nextFrames(1)
  }

  return lastResult
}
