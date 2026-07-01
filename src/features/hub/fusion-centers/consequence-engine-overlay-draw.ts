import { line, curveBasis } from 'd3-shape'
import {
  sectorImpactRadius,
  statusToSvgPaint,
} from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import type {
  ConsequenceLinkPath,
  ConsequenceOverlayDrawOptions,
  ConsequenceScenario,
  ProjectGeoToScreen,
  ProjectedConsequenceScenario,
  ScreenPoint,
} from '@/features/hub/fusion-centers/consequence-engine-types'

const SVG_NS = 'http://www.w3.org/2000/svg'
const PACKET_COUNT_PER_LINK = 3
const DASH_PATTERN = '8 12'
const HUB_RADIUS = 10
const PACKET_RADIUS = 4

export function projectScenarioToScreen(
  scenario: ConsequenceScenario,
  projectFn: ProjectGeoToScreen
): ProjectedConsequenceScenario | null {
  const hubPoint = projectFn(scenario.hub.coordinates)
  if (!hubPoint) {
    return null
  }

  const sectors = scenario.sectors
    .map((sector) => {
      const point = projectFn(sector.coordinates)
      if (!point) {
        return null
      }
      return { ...sector, ...point }
    })
    .filter((sector): sector is NonNullable<typeof sector> => sector !== null)

  if (sectors.length === 0) {
    return null
  }

  return {
    hub: { ...scenario.hub, ...hubPoint },
    sectors,
  }
}

function measurePathLength(pathD: string): number {
  if (!pathD || typeof document === 'undefined') {
    return 0
  }
  const probe = document.createElementNS(SVG_NS, 'path')
  probe.setAttribute('d', pathD)
  return probe.getTotalLength()
}

export function buildCurvedLinkPath(hub: ScreenPoint, sector: ScreenPoint): ConsequenceLinkPath {
  const midX = (hub.x + sector.x) / 2
  const midY = (hub.y + sector.y) / 2
  const controlOffsetX = (sector.y - hub.y) * 0.12
  const controlOffsetY = (hub.x - sector.x) * 0.12
  const pathPoints: [number, number][] = [
    [hub.x, hub.y],
    [midX + controlOffsetX, midY + controlOffsetY],
    [sector.x, sector.y],
  ]
  const pathGenerator = line<[number, number]>().curve(curveBasis)
  const pathD = pathGenerator(pathPoints) ?? ''
  const length = measurePathLength(pathD) || Math.hypot(sector.x - hub.x, sector.y - hub.y) * 1.25

  return {
    sectorId: 'unknown',
    pathD,
    length,
  }
}

export function buildScenarioLinkPaths(
  projected: ProjectedConsequenceScenario
): ConsequenceLinkPath[] {
  return projected.sectors.map((sector) => {
    const link = buildCurvedLinkPath(projected.hub, sector)
    return { ...link, sectorId: sector.id }
  })
}

export function advancePacketAnimation(offset: number, speed = 0.35): number {
  return (offset + speed) % 1000
}

export function packetOffsetForIndex(index: number, phase: number, length: number): number {
  const spacing = length / PACKET_COUNT_PER_LINK
  return (phase + index * spacing) % length
}

type DrawOverlayResult = {
  hubMarker: { x: number; y: number; visible: boolean }
  sectorLabels: Array<{
    id: string
    name: string
    countdown: string
    status: string
    x: number
    y: number
    visible: boolean
  }>
}

export function drawConsequenceOverlay(
  svg: SVGSVGElement,
  projected: ProjectedConsequenceScenario,
  options: ConsequenceOverlayDrawOptions
): DrawOverlayResult {
  const width = svg.clientWidth || svg.getBoundingClientRect().width || 1
  const height = svg.clientHeight || svg.getBoundingClientRect().height || 1
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.innerHTML = ''

  const linksGroup = document.createElementNS(SVG_NS, 'g')
  linksGroup.setAttribute('class', 'consequence-links')
  svg.appendChild(linksGroup)

  const nodesGroup = document.createElementNS(SVG_NS, 'g')
  nodesGroup.setAttribute('class', 'consequence-nodes')
  svg.appendChild(nodesGroup)

  const packetsGroup = document.createElementNS(SVG_NS, 'g')
  packetsGroup.setAttribute('class', 'consequence-packets')
  svg.appendChild(packetsGroup)

  const linkPaths = buildScenarioLinkPaths(projected)
  const hubPaint = statusToSvgPaint(projected.hub.status)

  for (const link of linkPaths) {
    const sector = projected.sectors.find((entry) => entry.id === link.sectorId)
    const paint = sector ? statusToSvgPaint(sector.status) : statusToSvgPaint('MONITORED')
    const pathEl = document.createElementNS(SVG_NS, 'path')
    pathEl.setAttribute('d', link.pathD)
    pathEl.setAttribute('fill', 'none')
    pathEl.setAttribute('stroke', paint.stroke)
    pathEl.setAttribute('stroke-width', '2.5')
    pathEl.setAttribute('stroke-dasharray', DASH_PATTERN)
    if (options.animate) {
      pathEl.setAttribute('stroke-dashoffset', String(-options.animationPhase % 20))
    }
    pathEl.setAttribute('opacity', '0.9')
    linksGroup.appendChild(pathEl)

    if (options.animate && link.pathD && link.length > 0) {
      for (let index = 0; index < PACKET_COUNT_PER_LINK; index += 1) {
        const packet = document.createElementNS(SVG_NS, 'circle')
        packet.setAttribute('r', String(PACKET_RADIUS))
        packet.setAttribute('fill', 'var(--primary)')
        packet.setAttribute('stroke', 'var(--background)')
        packet.setAttribute('stroke-width', '1')
        const offset = packetOffsetForIndex(index, options.animationPhase, link.length)
        packet.setAttribute('opacity', '0.95')
        packet.dataset.pathD = link.pathD
        packet.dataset.offset = String(offset)
        packetsGroup.appendChild(packet)
      }
    }
  }

  for (const sector of projected.sectors) {
    const radius = sectorImpactRadius(sector.impactScore)
    const paint = statusToSvgPaint(sector.status)
    const circle = document.createElementNS(SVG_NS, 'circle')
    circle.setAttribute('cx', String(sector.x))
    circle.setAttribute('cy', String(sector.y))
    circle.setAttribute('r', String(radius))
    circle.setAttribute('stroke', paint.stroke)
    circle.setAttribute('fill', paint.fill)
    circle.setAttribute('stroke-width', '2.5')
    nodesGroup.appendChild(circle)
  }

  const hubCircle = document.createElementNS(SVG_NS, 'circle')
  hubCircle.setAttribute('cx', String(projected.hub.x))
  hubCircle.setAttribute('cy', String(projected.hub.y))
  hubCircle.setAttribute('r', String(HUB_RADIUS))
  hubCircle.setAttribute('stroke', hubPaint.stroke)
  hubCircle.setAttribute('fill', hubPaint.stroke)
  hubCircle.setAttribute('stroke-width', '2.5')
  hubCircle.setAttribute('opacity', '0.95')
  nodesGroup.appendChild(hubCircle)

  updatePacketPositions(packetsGroup)

  return {
    hubMarker: { x: projected.hub.x, y: projected.hub.y, visible: true },
    sectorLabels: projected.sectors.map((sector) => ({
      id: sector.id,
      name: sector.name,
      countdown: sector.countdown,
      status: sector.status,
      x: sector.x + sectorImpactRadius(sector.impactScore) + 6,
      y: sector.y - 4,
      visible: true,
    })),
  }
}

export function updatePacketPositions(packetsGroup: SVGGElement) {
  packetsGroup.querySelectorAll('circle').forEach((packet) => {
    const pathD = packet.dataset.pathD
    const offset = Number(packet.dataset.offset ?? 0)
    if (!pathD) {
      return
    }
    const probe = document.createElementNS(SVG_NS, 'path')
    probe.setAttribute('d', pathD)
    const length = probe.getTotalLength()
    if (length <= 0) {
      return
    }
    const point = probe.getPointAtLength(offset % length)
    packet.setAttribute('cx', String(point.x))
    packet.setAttribute('cy', String(point.y))
  })
}
