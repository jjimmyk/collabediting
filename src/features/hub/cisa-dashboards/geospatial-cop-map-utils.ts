import Graphic from '@arcgis/core/Graphic'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type { AisVessel, AisVesselStatus } from '@/features/hub/cisa-dashboards/geospatial-cop-ais-vessels'
import { GEOSPATIAL_COP_AIS_VESSELS } from '@/features/hub/cisa-dashboards/geospatial-cop-ais-vessels'
import {
  GEOSPATIAL_COP_AIS_MAP_KIND,
  GEOSPATIAL_COP_BASE_MAP_FEATURES,
  GEOSPATIAL_COP_MAP_KIND,
  type GeospatialCopMapFeature,
} from '@/features/hub/cisa-dashboards/geospatial-cop-map-data'

function buildPopupContent(feature: GeospatialCopMapFeature): string {
  const lines = [
    `<b>Layer:</b> ${feature.layerCategory}`,
    `<b>Region:</b> ${feature.region}`,
    `<b>Status:</b> ${feature.status}`,
    `<b>Updated:</b> ${feature.updated}`,
  ]

  if (feature.incidentId) {
    lines.push(`<b>Incident:</b> ${feature.incidentId}`)
  }

  return lines.join('<br/>')
}

function buildAttributes(feature: GeospatialCopMapFeature): Record<string, string> {
  return {
    mapKey: feature.mapKey,
    kind: GEOSPATIAL_COP_MAP_KIND,
    geospatialCopFeatureId: feature.id,
    title: feature.label,
    layerCategory: feature.layerCategory,
    region: feature.region,
    status: feature.status,
    updated: feature.updated,
    incidentId: feature.incidentId ?? '',
  }
}

function symbolForFeature(feature: GeospatialCopMapFeature) {
  if (feature.geometry.type === 'point') {
    const isPrimaryIncident = feature.id === 'port-houston-outage'
    const isImpactAsset = feature.layerCategory.startsWith('Impacted asset')
    const isImpactedAor = feature.layerCategory.startsWith('Impacted AOR')
    return {
      type: 'simple-marker' as const,
      color: isPrimaryIncident
        ? ([220, 38, 38, 0.95] as [number, number, number, number])
        : isImpactAsset
          ? ([234, 88, 12, 0.95] as [number, number, number, number])
          : isImpactedAor
            ? ([147, 51, 234, 0.95] as [number, number, number, number])
            : ([37, 99, 235, 0.95] as [number, number, number, number]),
      size: isPrimaryIncident ? 14 : isImpactedAor ? 11 : 10,
      outline: {
        color: [255, 255, 255, 1] as [number, number, number, number],
        width: 1.5,
      },
    }
  }

  if (feature.geometry.type === 'polyline') {
    return {
      type: 'simple-line' as const,
      color: [14, 116, 144, 0.95] as [number, number, number, number],
      width: 3,
    }
  }

  const isPortBoundary = feature.id === 'port-houston-footprint'
  return {
    type: 'simple-fill' as const,
    color: isPortBoundary
      ? ([220, 38, 38, 0.12] as [number, number, number, number])
      : ([6, 182, 212, 0.2] as [number, number, number, number]),
    outline: {
      color: isPortBoundary
        ? ([220, 38, 38, 0.95] as [number, number, number, number])
        : ([6, 182, 212, 0.95] as [number, number, number, number]),
      width: isPortBoundary ? 2.4 : 1.8,
    },
  }
}

function aisStatusColor(status: AisVesselStatus): [number, number, number, number] {
  if (status === 'Affected') {
    return [220, 38, 38, 0.95]
  }
  if (status === 'Delayed') {
    return [234, 179, 8, 0.95]
  }
  return [34, 197, 94, 0.95]
}

export function createGeospatialCopGraphic(feature: GeospatialCopMapFeature): Graphic {
  const geometry =
    feature.geometry.type === 'point'
      ? {
          type: 'point' as const,
          longitude: feature.geometry.longitude,
          latitude: feature.geometry.latitude,
        }
      : feature.geometry.type === 'polyline'
        ? {
            type: 'polyline' as const,
            paths: [feature.geometry.paths],
          }
        : {
            type: 'polygon' as const,
            rings: feature.geometry.rings,
          }

  return new Graphic({
    geometry,
    symbol: symbolForFeature(feature),
    attributes: buildAttributes(feature),
    popupTemplate: {
      title: '{title}',
      content: buildPopupContent(feature),
    },
  })
}

export function createAisVesselGraphic(vessel: AisVessel): Graphic {
  return new Graphic({
    geometry: {
      type: 'point',
      longitude: vessel.longitude,
      latitude: vessel.latitude,
    },
    symbol: {
      type: 'simple-marker',
      style: 'triangle',
      color: aisStatusColor(vessel.status),
      size: 9,
      angle: vessel.heading,
      outline: {
        color: [255, 255, 255, 1],
        width: 1,
      },
    },
    attributes: {
      mapKey: vessel.mapKey,
      kind: GEOSPATIAL_COP_AIS_MAP_KIND,
      title: vessel.name,
      mmsi: vessel.mmsi,
      vesselType: vessel.vesselType,
      status: vessel.status,
      speedKnots: String(vessel.speedKnots),
      heading: String(vessel.heading),
    },
    popupTemplate: {
      title: '{title}',
      content:
        '<b>MMSI:</b> {mmsi}<br/><b>Type:</b> {vesselType}<br/><b>Status:</b> {status}<br/><b>Speed:</b> {speedKnots} kn<br/><b>Heading:</b> {heading}°',
    },
  })
}

export function syncGeospatialCopBaseGraphics(
  layer: GraphicsLayer
): globalThis.Map<string, Graphic> {
  layer.removeAll()
  const graphicsByKey = new globalThis.Map<string, Graphic>()

  for (const feature of GEOSPATIAL_COP_BASE_MAP_FEATURES) {
    const graphic = createGeospatialCopGraphic(feature)
    layer.add(graphic)
    graphicsByKey.set(feature.mapKey, graphic)
  }

  return graphicsByKey
}

export function syncGeospatialCopAisGraphics(
  layer: GraphicsLayer,
  vessels: AisVessel[] = GEOSPATIAL_COP_AIS_VESSELS
): globalThis.Map<string, Graphic> {
  layer.removeAll()
  const graphicsByKey = new globalThis.Map<string, Graphic>()

  for (const vessel of vessels) {
    const graphic = createAisVesselGraphic(vessel)
    layer.add(graphic)
    graphicsByKey.set(vessel.mapKey, graphic)
  }

  return graphicsByKey
}

/** @deprecated Use syncGeospatialCopBaseGraphics */
export function syncGeospatialCopGraphics(layer: GraphicsLayer): globalThis.Map<string, Graphic> {
  return syncGeospatialCopBaseGraphics(layer)
}

export function isGeospatialCopGraphicHit(
  attributes: Record<string, unknown> | undefined
): boolean {
  return (
    attributes?.kind === GEOSPATIAL_COP_MAP_KIND || attributes?.kind === GEOSPATIAL_COP_AIS_MAP_KIND
  )
}
