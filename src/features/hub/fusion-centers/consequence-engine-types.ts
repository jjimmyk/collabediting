export type GeoCoordinate = readonly [longitude: number, latitude: number]

export type ScreenPoint = {
  x: number
  y: number
}

export type ProjectGeoToScreen = (coord: GeoCoordinate) => ScreenPoint | null

export type ConsequenceNodeStatus =
  | 'ENCRYPTED'
  | 'CRITICAL'
  | 'HIGH RISK'
  | 'ELEVATED'
  | 'MONITORED'

export type ConsequenceHubNode = {
  id: 'hub'
  name: string
  coordinates: GeoCoordinate
  status: 'ENCRYPTED'
}

export type ConsequenceSectorNode = {
  id: string
  name: string
  coordinates: GeoCoordinate
  impactScore: number
  countdown: string
  status: Exclude<ConsequenceNodeStatus, 'ENCRYPTED'>
  linkedThreatId?: string
}

export type ConsequenceScenario = {
  hub: ConsequenceHubNode
  sectors: readonly ConsequenceSectorNode[]
}

export type ProjectedHubNode = ConsequenceHubNode & ScreenPoint

export type ProjectedSectorNode = ConsequenceSectorNode & ScreenPoint

export type ProjectedConsequenceScenario = {
  hub: ProjectedHubNode
  sectors: ProjectedSectorNode[]
}

export type ConsequenceLinkPath = {
  sectorId: string
  pathD: string
  length: number
}

export type ConsequenceOverlayDrawOptions = {
  animate: boolean
  animationPhase: number
}

export type ConsequenceHubMarkerPosition = ScreenPoint & {
  visible: boolean
}

export type ConsequenceSectorLabelPosition = ProjectedSectorNode & {
  visible: boolean
}
