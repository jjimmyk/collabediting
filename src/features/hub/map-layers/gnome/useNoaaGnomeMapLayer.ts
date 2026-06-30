import { useEffect, useRef, type RefObject } from 'react'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Map from '@arcgis/core/Map'
import type MapView from '@arcgis/core/views/MapView'
import { NOAA_GNOME_MAP_EXTENT } from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'
import {
  NOAA_GNOME_FORCING_LAYER_ID,
  NOAA_GNOME_PARTICLE_LAYER_ID,
  NOAA_GNOME_RELEASE_LAYER_ID,
  NOAA_GNOME_SLICK_LAYER_ID,
  syncNoaaGnomeGraphicsForHour,
  syncNoaaGnomeReleaseGraphic,
} from '@/features/hub/map-layers/gnome/noaa-gnome-map-utils'

type UseNoaaGnomeMapLayerOptions = {
  enabled: boolean
  hourIndex: number
  mapViewRef: RefObject<MapView | null>
  layerInsertStartIndex?: number
}

export function useNoaaGnomeMapLayer(options: UseNoaaGnomeMapLayerOptions) {
  const slickLayerRef = useRef<GraphicsLayer | null>(null)
  const particleLayerRef = useRef<GraphicsLayer | null>(null)
  const forcingLayerRef = useRef<GraphicsLayer | null>(null)
  const releaseLayerRef = useRef<GraphicsLayer | null>(null)
  const hasZoomedRef = useRef(false)
  const layerInsertStartIndex = options.layerInsertStartIndex ?? 4

  useEffect(() => {
    hasZoomedRef.current = false
  }, [options.enabled])

  useEffect(() => {
    if (!options.enabled) {
      for (const layerRef of [slickLayerRef, particleLayerRef, forcingLayerRef, releaseLayerRef]) {
        if (layerRef.current) {
          layerRef.current.visible = false
          layerRef.current.removeAll()
        }
      }
      return
    }

    let cancelled = false
    let attachRaf = 0

    const ensureLayer = (
      map: Map,
      layerRef: RefObject<GraphicsLayer | null>,
      id: string,
      title: string,
      insertIndex: number,
      blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
    ) => {
      if (!layerRef.current || !map.layers.includes(layerRef.current)) {
        layerRef.current = new GraphicsLayer({
          id,
          title,
          listMode: 'hide',
          blendMode,
        })
        map.add(layerRef.current, insertIndex)
      }

      return layerRef.current
    }

    const attach = () => {
      if (cancelled) {
        return
      }

      const view = options.mapViewRef.current
      const map = view?.map ?? null
      if (!view || !map) {
        attachRaf = requestAnimationFrame(attach)
        return
      }

      const slickLayer = ensureLayer(
        map,
        slickLayerRef,
        NOAA_GNOME_SLICK_LAYER_ID,
        'NOAA GNOME surface slick',
        layerInsertStartIndex,
        'multiply'
      )
      const particleLayer = ensureLayer(
        map,
        particleLayerRef,
        NOAA_GNOME_PARTICLE_LAYER_ID,
        'NOAA GNOME particles',
        layerInsertStartIndex + 1,
        'multiply'
      )
      const forcingLayer = ensureLayer(
        map,
        forcingLayerRef,
        NOAA_GNOME_FORCING_LAYER_ID,
        'NOAA GNOME forcing',
        layerInsertStartIndex + 2
      )
      const releaseLayer = ensureLayer(
        map,
        releaseLayerRef,
        NOAA_GNOME_RELEASE_LAYER_ID,
        'NOAA GNOME release point',
        layerInsertStartIndex + 3
      )

      slickLayer.visible = true
      particleLayer.visible = true
      forcingLayer.visible = true
      releaseLayer.visible = true

      syncNoaaGnomeGraphicsForHour(particleLayer, slickLayer, forcingLayer, options.hourIndex)
      syncNoaaGnomeReleaseGraphic(releaseLayer)

      if (!hasZoomedRef.current) {
        hasZoomedRef.current = true
        void view
          .goTo(
            {
              center: NOAA_GNOME_MAP_EXTENT.center,
              scale: NOAA_GNOME_MAP_EXTENT.scale,
            },
            { animate: false }
          )
          .catch(() => {
            // Ignore goTo interruption.
          })
      }
    }

    attachRaf = requestAnimationFrame(attach)

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
    }
  }, [options.enabled, options.hourIndex, options.mapViewRef, layerInsertStartIndex])
}
