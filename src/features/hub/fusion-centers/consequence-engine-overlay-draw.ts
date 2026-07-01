import { line, curveBasis } from 'd3-shape'
import {
  sectorImpactRadius,
  statusToStrokeClass,
} from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import type {
  ConsequenceLinkPath,
  ConsequenceOverlayDrawOptions,
  ConsequenceScenario,
  ProjectGeoToScreen,
  ProjectedConsequenceScenario,
  ScreenPoint,
} from '@/features/hub/fusion-centers/consequence-engine-types'

const PACKET_COUNT_PER_LINK = 3
const DASH_PATTERN = '8 12'

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
  const approximateLength = Math.hypot(sector.x - hub.x, sector.y - hub.y) * 1.25

  return {
    sectorId: 'unknown',
    pathD,
    length: approximateLength,
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
  const width = svg.clientWidth || svg.getBoundingClientRect().width
  const height = svg.clientHeight || svg.getBoundingClientRect().height
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.innerHTML = ''

  const ns = 'http://www.w3.org/2000/svg'
  const linksGroup = document.createElementNS(ns, 'g')
  linksGroup.setAttribute('class', 'consequence-links')
  svg.appendChild(linksGroup)

  const nodesGroup = document.createElementNS(ns, 'g')
  nodesGroup.setAttribute('class', 'consequence-nodes')
  svg.appendChild(nodesGroup)

  const packetsGroup = document.createElementNS(ns, 'g')
  packetsGroup.setAttribute('class', 'consequence-packets')
  svg.appendChild(packetsGroup)

  const linkPaths = buildScenarioLinkPaths(projected)

  for (const link of linkPaths) {
    const sector = projected.sectors.find((entry) => entry.id === link.sectorId)
    const pathEl = document.createElementNS(ns, 'path')
    pathEl.setAttribute('d', link.pathD)
    pathEl.setAttribute('fill', 'none')
    pathEl.setAttribute('stroke-width', '2')
    pathEl.setAttribute('class', sector ? statusToStrokeClass(sector.status) : 'stroke-primary')
    pathEl.setAttribute('stroke-dasharray', DASH_PATTERN)
    if (options.animate) {
      const dashOffset = -options.animationPhase % 20
      pathEl.setAttribute('stroke-dashoffset', String(dashOffset))
    }
    pathEl.setAttribute('opacity', '0.85')
    linksGroup.appendChild(pathEl)

    if (options.animate && link.pathD) {
      for (let index = 0; index < PACKET_COUNT_PER_LINK; index += 1) {
        const packet = document.createElementNS(ns, 'circle')
        packet.setAttribute('r', '3')
        packet.setAttribute('class', 'fill-primary')
        const offset = packetOffsetForIndex(index, options.animationPhase, link.length)
        packet.setAttribute('opacity', '0.9')
        packet.dataset.pathD = link.pathD
        packet.dataset.offset = String(offset)
        packetsGroup.appendChild(packet)
      }
    }
  }

  for (const sector of projected.sectors) {
    const radius = sectorImpactRadius(sector.impactScore)
    const circle = document.createElementNS(ns, 'circle')
    circle.setAttribute('cx', String(sector.x))
    circle.setAttribute('cy', String(sector.y))
    circle.setAttribute('r', String(radius))
    circle.setAttribute('class', `${statusToStrokeClass(sector.status)} fill-background stroke-2`)
    circle.setAttribute('stroke-width', '2')
    nodesGroup.appendChild(circle)
  }

  const hubCircle = document.createElementNS(ns, 'circle')
  hubCircle.setAttribute('cx', String(projected.hub.x))
  hubCircle.setAttribute('cy', String(projected.hub.y))
  hubCircle.setAttribute('r', '8')
  hubCircle.setAttribute('class', 'fill-destructive stroke-destructive')
  hubCircle.setAttribute('stroke-width', '2')
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
  const paths = packetsGroup.querySelectorAll('circle')
  paths.forEach((packet) => {
    const pathD = packet.dataset.pathD
    const offset = Number(packet.dataset.offset ?? 0)
    if (!pathD) {
      return
    }
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
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
