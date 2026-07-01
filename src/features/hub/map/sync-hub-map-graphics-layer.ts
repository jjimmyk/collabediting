import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type MapView from '@arcgis/core/views/MapView'

export function syncHubMapGraphicsLayer(
  view: MapView | null,
  currentLayer: GraphicsLayer | null,
  graphics: Graphic[]
): GraphicsLayer {
  const map = view?.map ?? null
  if (map && currentLayer && map.layers.includes(currentLayer)) {
    const replacementLayer = new GraphicsLayer()
    if (graphics.length > 0) {
      replacementLayer.addMany(graphics)
    }
    const layerIndex = map.layers.indexOf(currentLayer)
    map.remove(currentLayer)
    map.add(replacementLayer, layerIndex >= 0 ? layerIndex : undefined)
    return replacementLayer
  }

  const layer = currentLayer ?? new GraphicsLayer()
  layer.removeAll()
  if (graphics.length > 0) {
    layer.addMany(graphics)
  }
  return layer
}
