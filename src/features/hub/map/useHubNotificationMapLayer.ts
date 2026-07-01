import { useEffect, type RefObject } from 'react'
import type Graphic from '@arcgis/core/Graphic'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type MapView from '@arcgis/core/views/MapView'
import {
  syncHubNotificationMapGraphics,
  type HubNotificationMapSource,
} from '@/features/hub/map/hub-notification-map-graphics'
import { syncHubMapGraphicsLayer } from '@/features/hub/map/sync-hub-map-graphics-layer'

type UseHubNotificationMapLayerOptions = {
  enabled: boolean
  mapViewRef: RefObject<MapView | null>
  mapGraphicsLayerRef: RefObject<GraphicsLayer | null>
  graphicsRef: RefObject<globalThis.Map<string, Graphic>>
  notifications: HubNotificationMapSource[]
}

export function useHubNotificationMapLayer(options: UseHubNotificationMapLayerOptions) {
  useEffect(() => {
    if (!options.enabled) {
      options.graphicsRef.current?.clear()
      if (options.mapGraphicsLayerRef.current) {
        options.mapGraphicsLayerRef.current.removeAll()
      }
      return
    }

    let cancelled = false
    let attachRaf = 0

    const sync = () => {
      if (cancelled) {
        return
      }

      const view = options.mapViewRef.current
      if (!view?.map) {
        attachRaf = requestAnimationFrame(sync)
        return
      }

      const graphicsByKey = syncHubNotificationMapGraphics(options.notifications)
      const graphics = [...graphicsByKey.values()]

      options.mapGraphicsLayerRef.current = syncHubMapGraphicsLayer(
        view,
        options.mapGraphicsLayerRef.current,
        graphics
      )

      options.graphicsRef.current?.clear()
      graphicsByKey.forEach((graphic, mapKey) => {
        options.graphicsRef.current?.set(mapKey, graphic)
      })
    }

    sync()

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
    }
  }, [
    options.enabled,
    options.graphicsRef,
    options.mapGraphicsLayerRef,
    options.mapViewRef,
    options.notifications,
  ])
}
