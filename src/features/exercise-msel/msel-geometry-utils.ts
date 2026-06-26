import type { MselInject, MselInjectSnapshot, MselMapFeature, MselMapPointFeature } from './types'

export function createMselMapFeatureId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `msel-feature-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function isValidPointCoordinates(value: unknown): value is [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    return false
  }
  const [longitude, latitude] = value
  return (
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    typeof latitude === 'number' &&
    Number.isFinite(latitude)
  )
}

function normalizeMapFeature(raw: unknown): MselMapFeature | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'string' && record.id.trim() ? record.id : createMselMapFeatureId()

  if (record.type === 'point' && isValidPointCoordinates(record.coordinates)) {
    return { id, type: 'point', coordinates: record.coordinates }
  }

  if (record.type === 'polygon' && Array.isArray(record.rings)) {
    const rings = record.rings
      .filter((ring): ring is number[][] => Array.isArray(ring))
      .map((ring) =>
        ring.filter(
          (pair): pair is [number, number] =>
            Array.isArray(pair) &&
            pair.length === 2 &&
            typeof pair[0] === 'number' &&
            Number.isFinite(pair[0]) &&
            typeof pair[1] === 'number' &&
            Number.isFinite(pair[1])
        )
      )
      .filter((ring) => ring.length >= 3)

    if (rings.length === 0) {
      return null
    }

    return { id, type: 'polygon', rings }
  }

  return null
}

export function migrateMapLocationToFeatures(
  mapLocation: [number, number] | null | undefined
): MselMapFeature[] {
  if (!mapLocation) {
    return []
  }
  return [
    {
      id: createMselMapFeatureId(),
      type: 'point',
      coordinates: mapLocation,
    },
  ]
}

export function getInjectMapFeatures(
  inject: Pick<MselInject, 'mapFeatures' | 'mapLocation'>
): MselMapFeature[] {
  if (Array.isArray(inject.mapFeatures) && inject.mapFeatures.length > 0) {
    return inject.mapFeatures
  }
  return migrateMapLocationToFeatures(inject.mapLocation)
}

export function normalizeInjectMapFeatures(inject: MselInject): MselInject {
  const normalizedFeatures = Array.isArray(inject.mapFeatures)
    ? inject.mapFeatures
        .map(normalizeMapFeature)
        .filter((feature): feature is MselMapFeature => feature !== null)
    : []

  const features =
    normalizedFeatures.length > 0
      ? normalizedFeatures
      : migrateMapLocationToFeatures(inject.mapLocation)

  const primaryPoint = features.find(
    (feature): feature is MselMapPointFeature => feature.type === 'point'
  )

  return {
    ...inject,
    mapFeatures: features,
    mapLocation: primaryPoint?.coordinates ?? null,
  }
}

export function normalizeSnapshotMapFeatures(snapshot: MselInjectSnapshot): MselInjectSnapshot {
  const features = getInjectMapFeatures(snapshot)
  const primaryPoint = features.find(
    (feature): feature is MselMapPointFeature => feature.type === 'point'
  )
  return {
    ...snapshot,
    mapFeatures: features,
    mapLocation: primaryPoint?.coordinates ?? snapshot.mapLocation ?? null,
  }
}

export function hasInjectMapGeometry(
  inject: Pick<MselInject, 'mapFeatures' | 'mapLocation'>
): boolean {
  return getInjectMapFeatures(inject).length > 0
}

export type MapFeatureExtent = {
  xmin: number
  ymin: number
  xmax: number
  ymax: number
}

function extendExtent(
  extent: MapFeatureExtent | null,
  longitude: number,
  latitude: number
): MapFeatureExtent {
  if (!extent) {
    return { xmin: longitude, ymin: latitude, xmax: longitude, ymax: latitude }
  }
  return {
    xmin: Math.min(extent.xmin, longitude),
    ymin: Math.min(extent.ymin, latitude),
    xmax: Math.max(extent.xmax, longitude),
    ymax: Math.max(extent.ymax, latitude),
  }
}

export function getMapFeaturesExtent(features: MselMapFeature[]): MapFeatureExtent | null {
  let extent: MapFeatureExtent | null = null

  for (const feature of features) {
    if (feature.type === 'point') {
      const [longitude, latitude] = feature.coordinates
      extent = extendExtent(extent, longitude, latitude)
      continue
    }

    for (const ring of feature.rings) {
      for (const [longitude, latitude] of ring) {
        extent = extendExtent(extent, longitude, latitude)
      }
    }
  }

  return extent
}

export function getMapFeatureLabel(feature: MselMapFeature, index: number): string {
  if (feature.type === 'point') {
    const [longitude, latitude] = feature.coordinates
    return `Point ${index + 1} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
  }
  return `Area ${index + 1} (${feature.rings[0]?.length ?? 0} vertices)`
}
