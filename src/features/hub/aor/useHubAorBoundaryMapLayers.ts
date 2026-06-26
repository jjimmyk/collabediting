import { useEffect, useRef, type RefObject } from 'react'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type MapView from '@arcgis/core/views/MapView'
import { buildHubAorBoundaryGraphic } from './build-aor-boundary-graphic'
import { HUB_AOR_BOUNDARY_CATALOG } from './hub-aor-boundary-geometries'

type UseHubAorBoundaryMapLayersOptions = {
  enabled: boolean
  mapViewRef: RefObject<MapView | null>
  enabledBoundaryIds: Set<string>
  boundaryGraphicsRef: RefObject<globalThis.Map<string, Graphic>>
}

const AOR_BOUNDARY_LAYER_INSERT_INDEX = 1

export function useHubAorBoundaryMapLayers(options: UseHubAorBoundaryMapLayersOptions) {
  const layerRef = useRef<GraphicsLayer | null>(null)

  useEffect(() => {
    if (!options.enabled) {
      options.boundaryGraphicsRef.current?.forEach((graphic) => {
        graphic.visible = false
      })
      return
    }

    let cancelled = false
    let attachRaf = 0

    const ensureBoundaryGraphic = (boundaryId: string, shouldShow: boolean) => {
      const definition = HUB_AOR_BOUNDARY_CATALOG.find((entry) => entry.id === boundaryId)
      if (!definition) {
        return
      }

      const view = options.mapViewRef.current
      const map = view?.map ?? null
      if (!map) {
        return
      }

      if (!layerRef.current || !map.layers.includes(layerRef.current)) {
        const layer = new GraphicsLayer({
          id: 'hub-aor-boundaries-layer',
          title: 'AOR Boundaries',
          listMode: 'hide',
        })
        layerRef.current = layer
        map.add(layer, AOR_BOUNDARY_LAYER_INSERT_INDEX)
      }

      const layer = layerRef.current
      if (!layer) {
        return
      }

      let graphic = options.boundaryGraphicsRef.current?.get(boundaryId) ?? null
      const graphicStillOnLayer = graphic ? layer.graphics.includes(graphic) : false

      if (!graphic || !graphicStillOnLayer) {
        if (graphic && !graphicStillOnLayer) {
          options.boundaryGraphicsRef.current?.delete(boundaryId)
        }

        if (!shouldShow) {
          return
        }

        graphic = buildHubAorBoundaryGraphic(definition)
        options.boundaryGraphicsRef.current?.set(boundaryId, graphic)
        layer.add(graphic)
        graphic.visible = true
        return
      }

      graphic.visible = shouldShow
    }

    const syncBoundaries = () => {
      if (cancelled) {
        return
      }

      const view = options.mapViewRef.current
      if (!view?.map) {
        attachRaf = requestAnimationFrame(syncBoundaries)
        return
      }

      HUB_AOR_BOUNDARY_CATALOG.forEach((definition) => {
        ensureBoundaryGraphic(definition.id, options.enabledBoundaryIds.has(definition.id))
      })
    }

    syncBoundaries()

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
    }
  }, [options.enabled, options.enabledBoundaryIds, options.mapViewRef, options.boundaryGraphicsRef])
}
