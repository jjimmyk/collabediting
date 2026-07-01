import { getHubAorBoundaryDefinition, HUB_AOR_BOUNDARY_CATALOG } from '@/features/hub/aor/hub-aor-boundary-geometries'
import type { HubAorBoundaryLevel } from '@/features/hub/aor/hub-aor-boundary-types'
import { GEOSPATIAL_COP_AIS_LAYER } from '@/features/hub/cisa-dashboards/geospatial-cop-dashboard-data'
import { FUSION_CASCADE_LAYER_DEFINITION } from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import { NOAA_GNOME_LAYER_DEFINITION } from '@/features/hub/map-layers/gnome/noaa-gnome-layer-catalog'
import {
  getWeatherLayerDefinition,
  HUB_WEATHER_LAYER_CATALOG,
  WEATHER_LAYER_GROUP_LABELS,
  type WeatherLayerGroup,
} from '@/features/hub/map-layers/weather-layer-catalog'
import type { WeatherLayerStatus } from '@/features/hub/map-layers/useHubWeatherMapLayers'

export type HubMapVisibleItemSource =
  | 'weather'
  | 'aor'
  | 'geospatial-cop'
  | 'gnome'
  | 'fusion-cascade'

export type HubMapVisibleItemKind =
  | 'map-layer'
  | 'aor-area'
  | 'aor-district'
  | 'aor-sector'

export type HubMapVisibleItem = {
  id: string
  label: string
  kind: HubMapVisibleItemKind
  typeLabel: string
  groupLabel?: string
  source: HubMapVisibleItemSource
  status?: WeatherLayerStatus
}

const AOR_LEVEL_ORDER: Record<HubAorBoundaryLevel, number> = {
  area: 0,
  district: 1,
  sector: 2,
}

const WEATHER_GROUP_ORDER: Record<WeatherLayerGroup, number> = {
  radar: 0,
  alerts: 1,
  forecast: 2,
}

function aorKindFromLevel(level: HubAorBoundaryLevel): HubMapVisibleItemKind {
  if (level === 'area') {
    return 'aor-area'
  }

  if (level === 'district') {
    return 'aor-district'
  }

  return 'aor-sector'
}

function aorTypeLabel(level: HubAorBoundaryLevel): string {
  if (level === 'area') {
    return 'AOR · Area'
  }

  if (level === 'district') {
    return 'AOR · District'
  }

  return 'AOR · Sector'
}

function compareVisibleItems(left: HubMapVisibleItem, right: HubMapVisibleItem): number {
  const leftSourceOrder = left.source === 'aor' ? 0 : 1
  const rightSourceOrder = right.source === 'aor' ? 0 : 1
  if (leftSourceOrder !== rightSourceOrder) {
    return leftSourceOrder - rightSourceOrder
  }

  if (left.source === 'aor' && right.source === 'aor') {
    const leftLevel = left.kind.replace('aor-', '') as HubAorBoundaryLevel
    const rightLevel = right.kind.replace('aor-', '') as HubAorBoundaryLevel
    const levelCompare = AOR_LEVEL_ORDER[leftLevel] - AOR_LEVEL_ORDER[rightLevel]
    if (levelCompare !== 0) {
      return levelCompare
    }
  }

  if (left.source === 'weather' && right.source === 'weather') {
    const leftDefinition = getWeatherLayerDefinition(left.id)
    const rightDefinition = getWeatherLayerDefinition(right.id)
    if (leftDefinition && rightDefinition) {
      const groupCompare =
        WEATHER_GROUP_ORDER[leftDefinition.group] - WEATHER_GROUP_ORDER[rightDefinition.group]
      if (groupCompare !== 0) {
        return groupCompare
      }
    }
  }

  return left.label.localeCompare(right.label)
}

export function buildHubMapVisibleItems(
  enabledWeatherLayerIds: Set<string>,
  enabledAorBoundaryIds: Set<string>,
  weatherLayerStatuses: Record<string, WeatherLayerStatus> = {},
  geospatialCopAisLayerEnabled = false,
  noaaGnomeLayerEnabled = false,
  fusionCascadeLayerEnabled = false
): HubMapVisibleItem[] {
  const items: HubMapVisibleItem[] = []

  enabledAorBoundaryIds.forEach((boundaryId) => {
    const definition =
      getHubAorBoundaryDefinition(boundaryId) ??
      HUB_AOR_BOUNDARY_CATALOG.find((entry) => entry.id === boundaryId)
    if (!definition) {
      return
    }

    items.push({
      id: definition.id,
      label: definition.label,
      kind: aorKindFromLevel(definition.level),
      typeLabel: aorTypeLabel(definition.level),
      source: 'aor',
    })
  })

  enabledWeatherLayerIds.forEach((layerId) => {
    const definition =
      getWeatherLayerDefinition(layerId) ??
      HUB_WEATHER_LAYER_CATALOG.find((entry) => entry.id === layerId)
    if (!definition) {
      return
    }

    const status = weatherLayerStatuses[layerId]
    items.push({
      id: definition.id,
      label: definition.label,
      kind: 'map-layer',
      typeLabel: 'Map Layer',
      groupLabel: WEATHER_LAYER_GROUP_LABELS[definition.group],
      source: 'weather',
      status: status === 'idle' ? undefined : status,
    })
  })

  if (geospatialCopAisLayerEnabled) {
    items.push({
      id: GEOSPATIAL_COP_AIS_LAYER.id,
      label: GEOSPATIAL_COP_AIS_LAYER.label,
      kind: 'map-layer',
      typeLabel: 'Map Layer',
      groupLabel: 'National Geospatial COP',
      source: 'geospatial-cop',
    })
  }

  if (noaaGnomeLayerEnabled) {
    items.push({
      id: NOAA_GNOME_LAYER_DEFINITION.id,
      label: NOAA_GNOME_LAYER_DEFINITION.label,
      kind: 'map-layer',
      typeLabel: 'Map Layer',
      groupLabel: 'Oil spill trajectory',
      source: 'gnome',
    })
  }

  if (fusionCascadeLayerEnabled) {
    items.push({
      id: FUSION_CASCADE_LAYER_DEFINITION.id,
      label: FUSION_CASCADE_LAYER_DEFINITION.label,
      kind: 'map-layer',
      typeLabel: 'Map Layer',
      groupLabel: 'Fusion Centers',
      source: 'fusion-cascade',
    })
  }

  return items.sort(compareVisibleItems)
}

export function filterHubMapVisibleItems(
  items: readonly HubMapVisibleItem[],
  query: string
): HubMapVisibleItem[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return [...items]
  }

  return items.filter((item) =>
    [item.label, item.typeLabel, item.groupLabel ?? '']
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  )
}
