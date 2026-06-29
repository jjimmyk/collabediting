export type AisVesselStatus = 'Affected' | 'Delayed' | 'Normal'

export type AisVessel = {
  id: string
  mapKey: string
  name: string
  mmsi: string
  vesselType: string
  status: AisVesselStatus
  longitude: number
  latitude: number
  speedKnots: number
  heading: number
}

const VESSEL_NAMES = [
  'Atlantic Pioneer',
  'Gulf Horizon',
  'Bayou Spirit',
  'Channel Star',
  'Pelican Trader',
  'San Jacinto',
  'Buffalo Bayou',
  'Galveston Reach',
  'Chemical Express',
  'Lone Star Carrier',
  'Harbor Sentinel',
  'Tidal Current',
  'Morgan Point',
  'Barbours Pride',
  'Bayport Voyager',
  'Channel Master',
  'Texas Responder',
  'Gulf Navigator',
  'Ship Channel One',
  'Houston Mariner',
  'Energy Transit',
  'Coastal Venture',
  'Pilot Boat 4',
  'Tug Reliance',
  'Tug Independence',
  'LNG Meridian',
  'Tanker Sequoia',
  'Bulk Carrier Orion',
  'Container Atlas',
  'Feeder Phoenix',
  'Chemical Atlas',
  'MT Gulf Crown',
  'ST Freedom',
  'MV Port Arrow',
  'Harbor Queen',
  'Channel Express',
  'Bayou Trader',
  'Gulf Sentinel',
  'Pelican Bay',
  'San Leon',
  'Tidal Wind',
  'Blue Horizon',
  'Redemption',
  'Starboard Light',
  'West Gulf',
  'East Channel',
  'Houston Bridge',
]

/** Water lane anchors in Galveston Bay / Gulf approach (lon, lat). */
const AIS_WATER_LANES: Array<[number, number]> = [
  [-94.865, 29.44],
  [-94.905, 29.46],
  [-94.945, 29.48],
  [-94.885, 29.5],
  [-94.925, 29.42],
  [-94.78, 29.45],
  [-94.82, 29.47],
  [-94.86, 29.49],
]

type AisLaneKind = 'affected' | 'delayed' | 'normal'

function statusForIndex(index: number): AisVesselStatus {
  if (index < 14) {
    return 'Affected'
  }
  if (index < 23) {
    return 'Delayed'
  }
  return 'Normal'
}

function laneKindForStatus(status: AisVesselStatus): AisLaneKind {
  if (status === 'Affected') {
    return 'affected'
  }
  if (status === 'Delayed') {
    return 'delayed'
  }
  return 'normal'
}

function pseudoRandom(seed: number): number {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function polarOffset(
  centerLon: number,
  centerLat: number,
  seed: number,
  maxRadiusLon: number,
  maxRadiusLat: number
): { longitude: number; latitude: number } {
  const angle = pseudoRandom(seed) * Math.PI * 2
  const radius = 0.35 + pseudoRandom(seed + 17) * 0.65
  return {
    longitude: centerLon + Math.cos(angle) * maxRadiusLon * radius,
    latitude: centerLat + Math.sin(angle) * maxRadiusLat * radius,
  }
}

/** Returns true when the coordinate is on water near the Port of Houston approach. */
export function isOnWaterNearHouston(longitude: number, latitude: number): boolean {
  if (latitude > 29.54) {
    return false
  }

  if (longitude < -95.05 && latitude > 29.58) {
    return false
  }

  if (longitude > -94.68 || longitude < -95.05) {
    return false
  }

  if (latitude < 29.34) {
    return false
  }

  return true
}

function pickLaneIndex(index: number, kind: AisLaneKind): number {
  const lanePool =
    kind === 'affected'
      ? [0, 1, 2, 3]
      : kind === 'delayed'
        ? [2, 3, 4, 5]
        : [4, 5, 6, 7]
  return lanePool[index % lanePool.length] ?? 0
}

function scatterPosition(index: number, status: AisVesselStatus): { longitude: number; latitude: number } {
  const kind = laneKindForStatus(status)
  const laneIndex = pickLaneIndex(index, kind)
  const [centerLon, centerLat] = AIS_WATER_LANES[laneIndex] ?? AIS_WATER_LANES[0]!
  const maxRadiusLon =
    kind === 'affected' ? 0.022 : kind === 'delayed' ? 0.028 : 0.045
  const maxRadiusLat =
    kind === 'affected' ? 0.016 : kind === 'delayed' ? 0.02 : 0.032

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const position = polarOffset(
      centerLon,
      centerLat,
      index * 31 + attempt * 13,
      maxRadiusLon,
      maxRadiusLat
    )
    if (isOnWaterNearHouston(position.longitude, position.latitude)) {
      return position
    }
  }

  return { longitude: centerLon, latitude: centerLat - 0.02 }
}

export function generateGeospatialCopAisVessels(count = 47): AisVessel[] {
  return Array.from({ length: count }, (_, index) => {
    const name = VESSEL_NAMES[index] ?? `Vessel ${index + 1}`
    const status = statusForIndex(index)
    const { longitude, latitude } = scatterPosition(index, status)

    return {
      id: `ais-vessel-${index + 1}`,
      mapKey: `geospatial-cop-ais-${index + 1}`,
      name,
      mmsi: `366${String(100000 + index * 137).slice(0, 6)}`,
      vesselType:
        index % 4 === 0
          ? 'Tanker'
          : index % 4 === 1
            ? 'Container'
            : index % 4 === 2
              ? 'Tug'
              : 'Bulk Carrier',
      status,
      longitude,
      latitude,
      speedKnots:
        status === 'Normal' ? 8 + (index % 5) : status === 'Delayed' ? 0.5 + (index % 3) * 0.2 : 0,
      heading: (index * 23 + 110) % 360,
    }
  })
}

export const GEOSPATIAL_COP_AIS_VESSELS = generateGeospatialCopAisVessels()

export function countAisVesselsByStatus(vessels: AisVessel[]): Record<AisVesselStatus, number> {
  return vessels.reduce(
    (counts, vessel) => {
      counts[vessel.status] += 1
      return counts
    },
    { Affected: 0, Delayed: 0, Normal: 0 } satisfies Record<AisVesselStatus, number>
  )
}

/** Minimum great-circle distance in degrees between two lon/lat points. */
export function degreeDistance(
  a: { longitude: number; latitude: number },
  b: { longitude: number; latitude: number }
): number {
  const dLon = a.longitude - b.longitude
  const dLat = a.latitude - b.latitude
  return Math.sqrt(dLon * dLon + dLat * dLat)
}

export function minPairwiseDegreeDistance(vessels: AisVessel[]): number {
  let minDistance = Infinity
  for (let i = 0; i < vessels.length; i += 1) {
    for (let j = i + 1; j < vessels.length; j += 1) {
      const distance = degreeDistance(vessels[i]!, vessels[j]!)
      minDistance = Math.min(minDistance, distance)
    }
  }
  return minDistance
}
