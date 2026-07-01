import type {
  ConsequenceNodeStatus,
  ConsequenceScenario,
  GeoCoordinate,
} from '@/features/hub/fusion-centers/consequence-engine-types'

export const FUSION_CASCADE_LAYER_DEFINITION = {
  id: 'fusion-cascade-impacts',
  label: 'Cascading Impacts Consequence Engine',
  description:
    'Animated cascade paths from Port of Houston cyber incident hub to critical infrastructure sectors.',
} as const

export const FUSION_CASCADE_SCENARIO: ConsequenceScenario = {
  hub: {
    id: 'hub',
    name: 'Port of Houston',
    coordinates: [-95.1411, 29.7438],
    status: 'ENCRYPTED',
  },
  sectors: [
    {
      id: 'energy',
      name: 'Energy Sector',
      coordinates: [-93.9399, 29.9861],
      impactScore: 78,
      countdown: '06:00:00',
      status: 'CRITICAL',
      linkedThreatId: 'PHT-ENRG-003',
    },
    {
      id: 'transportation',
      name: 'Transportation',
      coordinates: [-95.3698, 29.7604],
      impactScore: 62,
      countdown: '12:00:00',
      status: 'HIGH RISK',
      linkedThreatId: 'PHT-TRAN-004',
    },
    {
      id: 'defense-logistics',
      name: 'Defense Logistics',
      coordinates: [-94.6835, 29.3013],
      impactScore: 55,
      countdown: '18:00:00',
      status: 'ELEVATED',
      linkedThreatId: 'PHT-TRAN-004',
    },
    {
      id: 'food-ag',
      name: 'Food & Ag',
      coordinates: [-96.3344, 30.628],
      impactScore: 31,
      countdown: '24:00:00',
      status: 'MONITORED',
      linkedThreatId: 'PHT-FOOD-005',
    },
  ],
} as const

export type ConsequenceMapExtent = {
  center: GeoCoordinate
  zoom: number
}

export type ConsequenceSvgPaint = {
  stroke: string
  fill: string
}

export function getConsequenceMapExtent(
  scenario: ConsequenceScenario = FUSION_CASCADE_SCENARIO
): ConsequenceMapExtent {
  const coordinates: GeoCoordinate[] = [
    scenario.hub.coordinates,
    ...scenario.sectors.map((sector) => sector.coordinates),
  ]
  const longitudes = coordinates.map(([lng]) => lng)
  const latitudes = coordinates.map(([, lat]) => lat)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    zoom: 8,
  }
}

export function statusToTailwindClass(status: ConsequenceNodeStatus): string {
  switch (status) {
    case 'ENCRYPTED':
      return 'text-destructive'
    case 'CRITICAL':
      return 'text-destructive'
    case 'HIGH RISK':
      return 'text-amber-600 dark:text-amber-400'
    case 'ELEVATED':
      return 'text-orange-600 dark:text-orange-400'
    case 'MONITORED':
      return 'text-muted-foreground'
    default:
      return 'text-muted-foreground'
  }
}

export function statusToSvgPaint(status: ConsequenceNodeStatus): ConsequenceSvgPaint {
  switch (status) {
    case 'ENCRYPTED':
    case 'CRITICAL':
      return { stroke: 'var(--destructive)', fill: 'var(--background)' }
    case 'HIGH RISK':
      return { stroke: 'var(--color-amber-500)', fill: 'var(--background)' }
    case 'ELEVATED':
      return { stroke: 'var(--color-orange-500)', fill: 'var(--background)' }
    case 'MONITORED':
      return { stroke: 'var(--muted-foreground)', fill: 'var(--background)' }
    default:
      return { stroke: 'var(--primary)', fill: 'var(--background)' }
  }
}

export function sectorImpactRadius(impactScore: number): number {
  return 4 + impactScore / 8
}
