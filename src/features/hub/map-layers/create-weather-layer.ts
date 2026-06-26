import MapImageLayer from '@arcgis/core/layers/MapImageLayer'
import ImageryLayer from '@arcgis/core/layers/ImageryLayer'
import type Layer from '@arcgis/core/layers/Layer'
import type { WeatherLayerDefinition } from './weather-layer-catalog'

function buildMapImageSublayers(definition: WeatherLayerDefinition) {
  if (!definition.allSublayerIds || definition.allSublayerIds.length === 0) {
    return undefined
  }

  const visibleIds = new Set(definition.visibleSublayerIds ?? definition.allSublayerIds)

  return definition.allSublayerIds.map((id) => ({
    id,
    visible: visibleIds.has(id),
  }))
}

export function createWeatherLayer(definition: WeatherLayerDefinition): Layer {
  if (definition.layerType === 'imagery') {
    return new ImageryLayer({
      id: definition.id,
      title: definition.label,
      url: definition.url,
      opacity: definition.opacity ?? 0.7,
      visible: false,
    })
  }

  return new MapImageLayer({
    id: definition.id,
    title: definition.label,
    url: definition.url,
    opacity: definition.opacity ?? 0.75,
    visible: false,
    sublayers: buildMapImageSublayers(definition),
  })
}
