import {
  createMselMapFeatureId,
  getMapFeatureLabel,
} from '@/features/exercise-msel/msel-geometry-utils'
import type { MselMapFeature } from '@/features/exercise-msel/types'
import Point from '@arcgis/core/geometry/Point'
import Polygon from '@arcgis/core/geometry/Polygon'
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils'
import type {
  Ics215aIncidentArea,
  Ics215aLocationByPositionEntry,
  Ics215aLocationMethod,
  Ics215aSafetyAnalysisLocation,
  Ics215aSafetyAnalysisRow,
} from '@/features/ics215a/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

const LOCATION_METHODS: Ics215aLocationMethod[] = [
  '',
  'enter-address',
  'enter-coordinates',
  'enter-polygon-coordinates',
  'draw-point',
  'draw-polygon',
]

function isValidCoordinate(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function parseCoordinatePair(line: string): [number, number] | null {
  const trimmed = line.trim()
  if (!trimmed) {
    return null
  }
  const parts = trimmed.split(/[,\s]+/).filter(Boolean)
  if (parts.length < 2) {
    return null
  }
  const first = Number(parts[0])
  const second = Number(parts[1])
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null
  }

  // Accept lat,lng or lng,lat by validating ranges.
  const asLngLat: [number, number] = [first, second]
  const asLatLng: [number, number] = [second, first]
  if (
    isValidCoordinate(asLngLat[0], -180, 180) &&
    isValidCoordinate(asLngLat[1], -90, 90)
  ) {
    return asLngLat
  }
  if (
    isValidCoordinate(asLatLng[0], -180, 180) &&
    isValidCoordinate(asLatLng[1], -90, 90)
  ) {
    return asLatLng
  }
  return null
}

export function createDefaultIcs215aLocation(): Ics215aSafetyAnalysisLocation {
  return { method: '', mapFeatures: [] }
}

export function migrateIncidentArea(legacy: unknown): Ics215aIncidentArea {
  if (legacy && typeof legacy === 'object') {
    const record = legacy as Record<string, unknown>
    if (record.kind === 'roster-position' && typeof record.position === 'string') {
      return { kind: 'roster-position', position: record.position.trim() }
    }
    if (record.kind === 'custom' && typeof record.name === 'string') {
      return { kind: 'custom', name: record.name.trim() }
    }
  }
  return { kind: 'custom', name: String(legacy ?? '').trim() }
}

export function parsePolygonCoordinatesText(text: string): MselMapFeature[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 3) {
    return []
  }

  const ring: [number, number][] = []
  for (const line of lines) {
    const pair = parseCoordinatePair(line)
    if (!pair) {
      return []
    }
    ring.push(pair)
  }

  return [
    {
      id: createMselMapFeatureId(),
      type: 'polygon',
      rings: [ring],
    },
  ]
}

function toGeographicPolygon(polygon: Polygon): Polygon {
  if (polygon.spatialReference?.isWebMercator) {
    return webMercatorUtils.webMercatorToGeographic(polygon) as Polygon
  }
  return polygon
}

function ringLooksLikeWebMercator(ring: number[][]): boolean {
  return ring.some(
    ([longitude, latitude]) =>
      Math.abs(longitude) > 180 || Math.abs(latitude) > 90
  )
}

function normalizePolygonRings(rawRings: unknown): number[][][] {
  const rings = (Array.isArray(rawRings) ? rawRings : [])
    .filter((ring): ring is unknown[] => Array.isArray(ring))
    .map((ring) =>
      ring
        .map((vertex) =>
          typeof vertex === 'string'
            ? parseCoordinatePair(vertex)
            : Array.isArray(vertex)
              ? parseCoordinatePair(vertex.join(','))
              : null
        )
        .filter((pair): pair is [number, number] => pair !== null)
    )
    .filter((ring) => ring.length >= 3)

  if (rings.length === 0) {
    return []
  }

  if (!ringLooksLikeWebMercator(rings[0] ?? [])) {
    return rings
  }

  const projected = new Polygon({
    rings,
    spatialReference: { wkid: 3857 },
  })
  const geographic = toGeographicPolygon(projected)
  return geographic.rings.filter((ring) => ring.length >= 3)
}

function normalizeMapFeatures(raw: unknown): MselMapFeature[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const features: MselMapFeature[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const record = entry as Record<string, unknown>
    const id =
      typeof record.id === 'string' && record.id.trim()
        ? record.id
        : createMselMapFeatureId()

    if (record.type === 'point' && Array.isArray(record.coordinates)) {
      const pair = parseCoordinatePair(record.coordinates.join(','))
      if (pair) {
        features.push({ id, type: 'point', coordinates: pair })
      }
      continue
    }

    if (record.type === 'polygon' && Array.isArray(record.rings)) {
      const rings = normalizePolygonRings(record.rings)
      if (rings.length > 0) {
        features.push({ id, type: 'polygon', rings })
      }
    }
  }
  return features
}

function buildPointFeatureFromCoordinates(
  latitude: string,
  longitude: string
): MselMapFeature[] {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (
    !isValidCoordinate(lng, -180, 180) ||
    !isValidCoordinate(lat, -90, 90)
  ) {
    return []
  }
  return [
    {
      id: createMselMapFeatureId(),
      type: 'point',
      coordinates: [lng, lat],
    },
  ]
}

export function normalizeIcs215aLocation(raw: unknown): Ics215aSafetyAnalysisLocation {
  if (!raw || typeof raw !== 'object') {
    return createDefaultIcs215aLocation()
  }

  const record = raw as Record<string, unknown>
  const method = LOCATION_METHODS.includes(record.method as Ics215aLocationMethod)
    ? (record.method as Ics215aLocationMethod)
    : ''

  const location: Ics215aSafetyAnalysisLocation = {
    method,
    address: typeof record.address === 'string' ? record.address : '',
    latitude: typeof record.latitude === 'string' ? record.latitude : '',
    longitude: typeof record.longitude === 'string' ? record.longitude : '',
    polygonCoordinatesText:
      typeof record.polygonCoordinatesText === 'string'
        ? record.polygonCoordinatesText
        : '',
    geometrySummary:
      typeof record.geometrySummary === 'string' ? record.geometrySummary : '',
    mapFeatures: normalizeMapFeatures(record.mapFeatures),
  }

  if (location.mapFeatures && location.mapFeatures.length > 0) {
    return location
  }

  if (method === 'enter-coordinates') {
    location.mapFeatures = buildPointFeatureFromCoordinates(
      location.latitude ?? '',
      location.longitude ?? ''
    )
  } else if (method === 'enter-polygon-coordinates') {
    location.mapFeatures = parsePolygonCoordinatesText(location.polygonCoordinatesText ?? '')
  }

  return location
}

export function getIcs215aLocationMapFeatures(
  location: Ics215aSafetyAnalysisLocation
): MselMapFeature[] {
  const normalized = normalizeIcs215aLocation(location)
  return normalized.mapFeatures ?? []
}

export function hasIcs215aLocationGeometry(location: Ics215aSafetyAnalysisLocation): boolean {
  return getIcs215aLocationMapFeatures(location).length > 0
}

export function formatIcs215aIncidentAreaLabel(
  area: Ics215aIncidentArea,
  catalog?: WorkspacePositionCatalog
): string {
  if (area.kind === 'roster-position') {
    const position = area.position.trim()
    if (!position) {
      return ''
    }
    if (catalog && !catalog.rosterPositionNames.includes(position)) {
      return `${position} (not on current roster)`
    }
    return position
  }
  return area.name.trim()
}

export function formatIcs215aLocationSummary(
  location: Ics215aSafetyAnalysisLocation
): string {
  const normalized = normalizeIcs215aLocation(location)
  if (normalized.geometrySummary?.trim()) {
    return normalized.geometrySummary.trim()
  }
  if (normalized.method === 'enter-address' && normalized.address?.trim()) {
    return normalized.address.trim()
  }

  const features = normalized.mapFeatures ?? []
  if (features.length === 0) {
    return ''
  }
  if (features.length === 1) {
    return getMapFeatureLabel(features[0], 0)
  }
  return features.map((feature, index) => getMapFeatureLabel(feature, index)).join('; ')
}

export type Ics215aLocationByPositionIndex = Record<string, Ics215aLocationByPositionEntry[]>

export function buildIcs215aLocationsByPosition(
  rows: Ics215aSafetyAnalysisRow[]
): Ics215aLocationByPositionIndex {
  const index: Ics215aLocationByPositionIndex = {}

  for (const row of rows) {
    if (row.incidentArea.kind !== 'roster-position') {
      continue
    }
    const position = row.incidentArea.position.trim()
    if (!position) {
      continue
    }
    const summary = formatIcs215aLocationSummary(row.location)
    if (!summary && !hasIcs215aLocationGeometry(row.location)) {
      continue
    }
    if (!index[position]) {
      index[position] = []
    }
    index[position].push({
      rowId: row.id,
      location: row.location,
      summary: summary || 'Location set',
    })
  }

  return index
}

export function createMapFeaturesFromSketchSummary(input: {
  mode: 'point' | 'polygon'
  longitude: number
  latitude: number
  polygonRing?: Array<[number, number]>
}): { mapFeatures: MselMapFeature[]; geometrySummary: string } {
  if (input.mode === 'point') {
    const mapFeatures: MselMapFeature[] = [
      {
        id: createMselMapFeatureId(),
        type: 'point',
        coordinates: [input.longitude, input.latitude],
      },
    ]
    return {
      mapFeatures,
      geometrySummary: `Point selected at ${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}`,
    }
  }

  const ring = input.polygonRing ?? []
  if (ring.length < 3) {
    return { mapFeatures: [], geometrySummary: 'Polygon selected' }
  }

  return {
    mapFeatures: [
      {
        id: createMselMapFeatureId(),
        type: 'polygon',
        rings: [ring],
      },
    ],
    geometrySummary: `Polygon selected near ${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}`,
  }
}

function ringToLngLatPairs(ring: number[][]): Array<[number, number]> {
  const trimmed =
    ring.length >= 2 &&
    ring[0]?.[0] === ring[ring.length - 1]?.[0] &&
    ring[0]?.[1] === ring[ring.length - 1]?.[1]
      ? ring.slice(0, -1)
      : ring

  return trimmed
    .filter((pair) => Array.isArray(pair) && pair.length >= 2)
    .map((pair) => [Number(pair[0]), Number(pair[1])] as [number, number])
    .filter(
      ([longitude, latitude]) =>
        Number.isFinite(longitude) &&
        Number.isFinite(latitude) &&
        longitude >= -180 &&
        longitude <= 180 &&
        latitude >= -90 &&
        latitude <= 90
    )
}

export function createMapFeaturesFromArcGisGeometry(
  geometry: Point | Polygon
): { mapFeatures: MselMapFeature[]; geometrySummary: string } {
  if (geometry.type === 'point') {
    const point = geometry as Point
    if (point.latitude == null || point.longitude == null) {
      return { mapFeatures: [], geometrySummary: 'Point selected' }
    }
    return createMapFeaturesFromSketchSummary({
      mode: 'point',
      latitude: point.latitude,
      longitude: point.longitude,
    })
  }

  if (geometry.type === 'polygon') {
    const geographic = toGeographicPolygon(geometry as Polygon)
    const ring = ringToLngLatPairs(geographic.rings[0] ?? [])
    const centroid = geographic.extent?.center
    return createMapFeaturesFromSketchSummary({
      mode: 'polygon',
      latitude: centroid?.latitude ?? ring[0]?.[1] ?? 0,
      longitude: centroid?.longitude ?? ring[0]?.[0] ?? 0,
      polygonRing: ring,
    })
  }

  return { mapFeatures: [], geometrySummary: '' }
}
