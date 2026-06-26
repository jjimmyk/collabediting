export type WeatherLayerGroup = 'radar' | 'alerts' | 'forecast'

export type WeatherLayerDefinition = {
  id: string
  label: string
  description: string
  group: WeatherLayerGroup
  layerType: 'map-image' | 'imagery'
  url: string
  /** When set, only these MapServer sublayer ids are visible. Others are hidden. */
  visibleSublayerIds?: number[]
  /** All sublayer ids on the service (needed when using visibleSublayerIds). */
  allSublayerIds?: number[]
  opacity?: number
}

export const HUB_WEATHER_LAYER_STORAGE_KEY = 'hub-weather-map-layers'

export const WEATHER_LAYER_GROUP_LABELS: Record<WeatherLayerGroup, string> = {
  radar: 'Radar',
  alerts: 'Alerts',
  forecast: 'Forecast',
}

const NOAA_RADAR_URL =
  'https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity/MapServer'

const NOAA_WWA_URL =
  'https://mapservices.weather.noaa.gov/eventdriven/rest/services/WWA/watch_warn_adv/MapServer'

const NOAA_WPC_ERO_URL =
  'https://mapservices.weather.noaa.gov/vector/rest/services/hazards/wpc_precip_hazards/MapServer'

export const HUB_WEATHER_LAYER_CATALOG: readonly WeatherLayerDefinition[] = [
  {
    id: 'radar-base-reflectivity',
    label: 'Base Reflectivity',
    description: 'Composite CONUS WSR-88D radar (~10 min refresh).',
    group: 'radar',
    layerType: 'map-image',
    url: NOAA_RADAR_URL,
    opacity: 0.75,
  },
  {
    id: 'wwa-warnings',
    label: 'Warnings',
    description: 'Active NWS warnings (life or property threat).',
    group: 'alerts',
    layerType: 'map-image',
    url: NOAA_WWA_URL,
    allSublayerIds: [0, 1],
    visibleSublayerIds: [0],
    opacity: 0.85,
  },
  {
    id: 'wwa-watches',
    label: 'Watches',
    description: 'Active NWS watches (elevated hazard risk).',
    group: 'alerts',
    layerType: 'map-image',
    url: NOAA_WWA_URL,
    allSublayerIds: [0, 1],
    visibleSublayerIds: [1],
    opacity: 0.85,
  },
  {
    id: 'wpc-ero-day1',
    label: 'Excessive Rainfall — Day 1',
    description: 'WPC flash-flood risk outlook for the next 24 hours.',
    group: 'forecast',
    layerType: 'map-image',
    url: NOAA_WPC_ERO_URL,
    allSublayerIds: [0, 1, 2, 3, 4],
    visibleSublayerIds: [0],
    opacity: 0.8,
  },
  {
    id: 'wpc-ero-day2',
    label: 'Excessive Rainfall — Day 2',
    description: 'WPC flash-flood risk outlook for day 2.',
    group: 'forecast',
    layerType: 'map-image',
    url: NOAA_WPC_ERO_URL,
    allSublayerIds: [0, 1, 2, 3, 4],
    visibleSublayerIds: [1],
    opacity: 0.8,
  },
  {
    id: 'wpc-ero-day3',
    label: 'Excessive Rainfall — Day 3',
    description: 'WPC flash-flood risk outlook for day 3.',
    group: 'forecast',
    layerType: 'map-image',
    url: NOAA_WPC_ERO_URL,
    allSublayerIds: [0, 1, 2, 3, 4],
    visibleSublayerIds: [2],
    opacity: 0.8,
  },
] as const

const catalogIds = new Set(HUB_WEATHER_LAYER_CATALOG.map((entry) => entry.id))

export function getWeatherLayerDefinition(id: string): WeatherLayerDefinition | undefined {
  return HUB_WEATHER_LAYER_CATALOG.find((entry) => entry.id === id)
}

export function isWeatherLayerId(id: string): boolean {
  return catalogIds.has(id)
}

export function loadEnabledWeatherLayerIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set()
  }

  try {
    const raw = window.localStorage.getItem(HUB_WEATHER_LAYER_STORAGE_KEY)
    if (!raw) {
      return new Set()
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return new Set()
    }

    return new Set(parsed.filter((entry): entry is string => typeof entry === 'string' && isWeatherLayerId(entry)))
  } catch {
    return new Set()
  }
}

export function saveEnabledWeatherLayerIds(ids: Set<string>) {
  if (typeof window === 'undefined') {
    return
  }

  const validIds = [...ids].filter(isWeatherLayerId)
  window.localStorage.setItem(HUB_WEATHER_LAYER_STORAGE_KEY, JSON.stringify(validIds))
}

export function groupWeatherLayersByCategory(
  catalog: readonly WeatherLayerDefinition[] = HUB_WEATHER_LAYER_CATALOG
): Array<{ group: WeatherLayerGroup; label: string; layers: WeatherLayerDefinition[] }> {
  const groups: WeatherLayerGroup[] = ['radar', 'alerts', 'forecast']

  return groups.map((group) => ({
    group,
    label: WEATHER_LAYER_GROUP_LABELS[group],
    layers: catalog.filter((entry) => entry.group === group),
  }))
}
