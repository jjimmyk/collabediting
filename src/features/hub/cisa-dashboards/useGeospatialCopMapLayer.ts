import { useEffect, useRef, type RefObject } from 'react'
import type Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type MapView from '@arcgis/core/views/MapView'
import {
  syncGeospatialCopAisGraphics,
  syncGeospatialCopBaseGraphics,
} from '@/features/hub/cisa-dashboards/geospatial-cop-map-utils'

type UseGeospatialCopMapLayerOptions = {
  enabled: boolean
  aisLayerEnabled: boolean
  mapViewRef: RefObject<MapView | null>
  graphicsRef: RefObject<globalThis.Map<string, Graphic>>
}

const GEOSPATIAL_COP_BASE_LAYER_INSERT_INDEX = 2
const GEOSPATIAL_COP_AIS_LAYER_INSERT_INDEX = 3

export function useGeospatialCopMapLayer(options: UseGeospatialCopMapLayerOptions) {
  const baseLayerRef = useRef<GraphicsLayer | null>(null)
  const aisLayerRef = useRef<GraphicsLayer | null>(null)
  const hasZoomedRef = useRef(false)

  useEffect(() => {
    hasZoomedRef.current = false
  }, [options.enabled])

  useEffect(() => {
    if (!options.enabled) {
      options.graphicsRef.current?.clear()
      baseLayerRef.current?.removeAll()
      aisLayerRef.current?.removeAll()
      if (baseLayerRef.current) {
        baseLayerRef.current.visible = false
      }
      if (aisLayerRef.current) {
        aisLayerRef.current.visible = false
      }
      return
    }

    let cancelled = false
    let attachRaf = 0

    const ensureLayer = (
      layerRef: RefObject<GraphicsLayer | null>,
      layerId: string,
      title: string,
      insertIndex: number
    ) => {
      const view = options.mapViewRef.current
      const map = view?.map ?? null
      if (!map) {
        return null
      }

      if (!layerRef.current || !map.layers.includes(layerRef.current)) {
        const layer = new GraphicsLayer({
          id: layerId,
          title,
          listMode: 'hide',
        })
        layerRef.current = layer
        map.add(layer, insertIndex)
      }

      return layerRef.current
    }

    const attach = () => {
      if (cancelled) {
        return
      }

      const view = options.mapViewRef.current
      if (!view?.map) {
        attachRaf = requestAnimationFrame(attach)
        return
      }

      const baseLayer = ensureLayer(
        baseLayerRef,
        'geospatial-cop-base-layer',
        'National Geospatial COP',
        GEOSPATIAL_COP_BASE_LAYER_INSERT_INDEX
      )
      const aisLayer = ensureLayer(
        aisLayerRef,
        'geospatial-cop-ais-layer',
        'AIS Vessel Tracks',
        GEOSPATIAL_COP_AIS_LAYER_INSERT_INDEX
      )

      if (!baseLayer || !aisLayer) {
        return
      }

      baseLayer.visible = true
      const baseGraphics = syncGeospatialCopBaseGraphics(baseLayer)

      options.graphicsRef.current?.clear()
      baseGraphics.forEach((graphic, mapKey) => {
        options.graphicsRef.current?.set(mapKey, graphic)
      })

      if (options.aisLayerEnabled) {
        aisLayer.visible = true
        const aisGraphics = syncGeospatialCopAisGraphics(aisLayer)
        aisGraphics.forEach((graphic, mapKey) => {
          options.graphicsRef.current?.set(mapKey, graphic)
        })
      } else {
        aisLayer.removeAll()
        aisLayer.visible = false
      }

      if (!hasZoomedRef.current) {
        hasZoomedRef.current = true
        const graphics = baseLayer.graphics.toArray()
        if (graphics.length > 0) {
          void view.goTo(graphics, { animate: false }).catch(() => {
            // Ignore goTo interruption.
          })
        }
      }
    }

    attach()

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
    }
  }, [
    options.aisLayerEnabled,
    options.enabled,
    options.graphicsRef,
    options.mapViewRef,
  ])

  useEffect(() => {
    return () => {
      options.graphicsRef.current?.clear()
      const view = options.mapViewRef.current
      const map = view?.map
      if (baseLayerRef.current && map?.layers.includes(baseLayerRef.current)) {
        map.remove(baseLayerRef.current)
      }
      if (aisLayerRef.current && map?.layers.includes(aisLayerRef.current)) {
        map.remove(aisLayerRef.current)
      }
      baseLayerRef.current = null
      aisLayerRef.current = null
    }
  }, [options.graphicsRef, options.mapViewRef])
}
