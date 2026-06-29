import { GEOSPATIAL_COP_IMPACTED_ASSETS } from '@/features/hub/cisa-dashboards/geospatial-cop-impacted-assets'
import { GEOSPATIAL_COP_IMPACTED_AORS } from '@/features/hub/cisa-dashboards/geospatial-cop-impacted-aors'
import {
  PORT_OF_HOUSTON_OUTAGE_INCIDENT,
  PORT_OF_HOUSTON_OUTAGE_INCIDENT_MAP_KEY,
} from '@/features/hub/cisa-dashboards/geospatial-cop-dashboard-data'

export const GEOSPATIAL_COP_MAP_KIND = 'geospatial-cop-layer'
export const GEOSPATIAL_COP_AIS_MAP_KIND = 'geospatial-cop-ais'

export type GeospatialCopMapGeometry =
  | { type: 'point'; longitude: number; latitude: number }
  | { type: 'polyline'; paths: Array<[number, number]> }
  | { type: 'polygon'; rings: Array<Array<[number, number]>> }

export type GeospatialCopMapFeature = {
  id: string
  mapKey: string
  label: string
  layerCategory: string
  status: string
  region: string
  updated: string
  incidentId?: string
  geometry: GeospatialCopMapGeometry
}

/** Port of Houston ship channel corridor on the upper Texas coast. */
export const PORT_OF_HOUSTON_BOUNDARY_RING: Array<[number, number]> = [
  [-94.985, 29.548],
  [-94.958, 29.562],
  [-94.972, 29.592],
  [-95.008, 29.612],
  [-95.038, 29.628],
  [-95.098, 29.652],
  [-95.168, 29.678],
  [-95.238, 29.702],
  [-95.288, 29.712],
  [-95.308, 29.692],
  [-95.278, 29.662],
  [-95.218, 29.632],
  [-95.148, 29.602],
  [-95.078, 29.572],
  [-94.985, 29.548],
]

export const GEOSPATIAL_COP_BASE_MAP_FEATURES: GeospatialCopMapFeature[] = [
  {
    id: 'port-houston-footprint',
    mapKey: 'geospatial-cop-port-houston-footprint',
    label: 'Port of Houston operational area',
    layerCategory: 'Port boundary',
    status: 'Active',
    region: PORT_OF_HOUSTON_OUTAGE_INCIDENT.region,
    updated: PORT_OF_HOUSTON_OUTAGE_INCIDENT.lastUpdate,
    incidentId: PORT_OF_HOUSTON_OUTAGE_INCIDENT.id,
    geometry: {
      type: 'polygon',
      rings: [PORT_OF_HOUSTON_BOUNDARY_RING],
    },
  },
  {
    id: 'port-houston-outage',
    mapKey: PORT_OF_HOUSTON_OUTAGE_INCIDENT_MAP_KEY,
    label: PORT_OF_HOUSTON_OUTAGE_INCIDENT.name,
    layerCategory: 'Active incident',
    status: PORT_OF_HOUSTON_OUTAGE_INCIDENT.status,
    region: PORT_OF_HOUSTON_OUTAGE_INCIDENT.region,
    updated: PORT_OF_HOUSTON_OUTAGE_INCIDENT.lastUpdate,
    incidentId: PORT_OF_HOUSTON_OUTAGE_INCIDENT.id,
    geometry: {
      type: 'point',
      longitude: PORT_OF_HOUSTON_OUTAGE_INCIDENT.location[0],
      latitude: PORT_OF_HOUSTON_OUTAGE_INCIDENT.location[1],
    },
  },
  ...GEOSPATIAL_COP_IMPACTED_ASSETS.map((asset) => ({
    id: asset.assetKey,
    mapKey: asset.copMapKey,
    label: asset.name,
    layerCategory: `Impacted asset · ${asset.sector}`,
    status: asset.assetStatus,
    region: asset.location,
    updated: PORT_OF_HOUSTON_OUTAGE_INCIDENT.lastUpdate,
    incidentId: PORT_OF_HOUSTON_OUTAGE_INCIDENT.id,
    geometry: {
      type: 'point' as const,
      longitude: asset.mapLocation[0],
      latitude: asset.mapLocation[1],
    },
  })),
  ...GEOSPATIAL_COP_IMPACTED_AORS.map((aor) => ({
    id: aor.id,
    mapKey: aor.copMapKey,
    label: aor.name,
    layerCategory: 'Impacted AOR · Port',
    status: `Risk score ${aor.riskScore}`,
    region: aor.region,
    updated: PORT_OF_HOUSTON_OUTAGE_INCIDENT.lastUpdate,
    incidentId: PORT_OF_HOUSTON_OUTAGE_INCIDENT.id,
    geometry: {
      type: 'point' as const,
      longitude: aor.mapLocation[0],
      latitude: aor.mapLocation[1],
    },
  })),
]

/** @deprecated Use GEOSPATIAL_COP_BASE_MAP_FEATURES */
export const GEOSPATIAL_COP_MAP_FEATURES = GEOSPATIAL_COP_BASE_MAP_FEATURES

export function getGeospatialCopMapExtent(): {
  xmin: number
  ymin: number
  xmax: number
  ymax: number
} {
  let xmin = Infinity
  let ymin = Infinity
  let xmax = -Infinity
  let ymax = -Infinity

  for (const feature of GEOSPATIAL_COP_BASE_MAP_FEATURES) {
    const points: Array<[number, number]> = []

    if (feature.geometry.type === 'point') {
      points.push([feature.geometry.longitude, feature.geometry.latitude])
    } else if (feature.geometry.type === 'polyline') {
      points.push(...feature.geometry.paths)
    } else {
      for (const ring of feature.geometry.rings) {
        points.push(...ring)
      }
    }

    for (const [longitude, latitude] of points) {
      xmin = Math.min(xmin, longitude)
      ymin = Math.min(ymin, latitude)
      xmax = Math.max(xmax, longitude)
      ymax = Math.max(ymax, latitude)
    }
  }

  const longitudePadding = (xmax - xmin) * 0.08 || 0.5
  const latitudePadding = (ymax - ymin) * 0.08 || 0.5

  return {
    xmin: xmin - longitudePadding,
    ymin: ymin - latitudePadding,
    xmax: xmax + longitudePadding,
    ymax: ymax + latitudePadding,
  }
}
