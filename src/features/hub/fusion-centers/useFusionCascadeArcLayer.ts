import { useEffect, useRef, type RefObject } from 'react'
import type { PickingInfo } from '@deck.gl/core'
import { DeckLayer } from '@deck.gl/arcgis'
import { ArcLayer } from '@deck.gl/layers'
import type MapView from '@arcgis/core/views/MapView'
import {
  buildFusionCascadeArcs,
  getNotificationCascadeExtent,
  type FusionCascadeArc,
} from '@/features/hub/fusion-centers/fusion-cascade-arc-data'
import type { HubNotificationMapSource } from '@/features/hub/map/hub-notification-map-graphics'

export const FUSION_CASCADE_DECK_LAYER_ID = 'fusion-cascade-deck-layer'

type UseFusionCascadeArcLayerOptions = {
  enabled: boolean
  notification: HubNotificationMapSource | null | undefined
  hourIndex: number
  mapViewRef: RefObject<MapView | null>
  fitExtentOnAttach?: boolean
  onArcHover?: (arc: FusionCascadeArc | null) => void
}

export function useFusionCascadeArcLayer({
  enabled,
  notification,
  hourIndex,
  mapViewRef,
  fitExtentOnAttach = false,
  onArcHover,
}: UseFusionCascadeArcLayerOptions) {
  const deckLayerRef = useRef<InstanceType<typeof DeckLayer> | null>(null)
  const hasFitRef = useRef(false)
  const onArcHoverRef = useRef(onArcHover)
  onArcHoverRef.current = onArcHover

  useEffect(() => {
    hasFitRef.current = false
  }, [enabled, notification?.id])

  useEffect(() => {
    if (!enabled) {
      onArcHoverRef.current?.(null)
      const view = mapViewRef.current
      const deckLayer = deckLayerRef.current
      if (deckLayer && view?.map && !view.destroyed) {
        view.map.remove(deckLayer)
      }
      deckLayerRef.current = null
      return
    }

    let cancelled = false
    let attachRaf = 0

    const ensureDeckLayer = (view: MapView) => {
      const map = view.map
      if (!map) {
        return null
      }

      if (!deckLayerRef.current) {
        const deckLayer = new DeckLayer({
          id: FUSION_CASCADE_DECK_LAYER_ID,
          title: 'Cascading Impacts Arcs',
          listMode: 'hide',
        })
        deckLayer.deck.onHover = (info: PickingInfo<FusionCascadeArc>) => {
          if (!onArcHoverRef.current) {
            return
          }
          if (info.picked && info.object) {
            onArcHoverRef.current(info.object as FusionCascadeArc)
            return
          }
          onArcHoverRef.current(null)
        }
        map.add(deckLayer)
        deckLayerRef.current = deckLayer
      }

      return deckLayerRef.current
    }

    const syncArcLayer = (view: MapView) => {
      const deckLayer = ensureDeckLayer(view)
      if (!deckLayer) {
        return
      }

      const arcs = buildFusionCascadeArcs(notification, hourIndex)
      deckLayer.deck.layers = [
        new ArcLayer<FusionCascadeArc>({
          id: 'fusion-cascade-arcs',
          data: arcs,
          pickable: true,
          autoHighlight: true,
          getSourcePosition: (arc) => arc.source,
          getTargetPosition: (arc) => arc.target,
          getSourceColor: (arc) => arc.sourceColor,
          getTargetColor: (arc) => arc.targetColor,
          getWidth: (arc) => arc.width,
          getTilt: 0,
          greatCircle: true,
        }),
      ]
    }

    const attach = () => {
      if (cancelled) {
        return
      }

      const view = mapViewRef.current
      if (!view || view.destroyed) {
        attachRaf = requestAnimationFrame(attach)
        return
      }

      void view.when().then(() => {
        if (cancelled || !mapViewRef.current || mapViewRef.current.destroyed) {
          return
        }

        syncArcLayer(view)

        if (fitExtentOnAttach && !hasFitRef.current) {
          const extent = getNotificationCascadeExtent(notification)
          if (extent) {
            hasFitRef.current = true
            void view
              .goTo(
                {
                  center: [...extent.center] as [number, number],
                  zoom: extent.zoom,
                },
                { animate: false }
              )
              .catch(() => {
                // Map may be destroyed mid-flight during unmount.
              })
          }
        }
      })
    }

    attachRaf = requestAnimationFrame(attach)

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
    }
  }, [enabled, fitExtentOnAttach, hourIndex, mapViewRef, notification])

  useEffect(() => {
    return () => {
      onArcHoverRef.current?.(null)
      const view = mapViewRef.current
      const deckLayer = deckLayerRef.current
      if (deckLayer && view?.map && !view.destroyed) {
        view.map.remove(deckLayer)
      }
      deckLayerRef.current = null
    }
  }, [mapViewRef])
}
