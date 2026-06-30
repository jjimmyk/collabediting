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
}

const NOAA_GNOME_SLICK_LAYER_INSERT_INDEX = 4
const NOAA_GNOME_PARTICLE_LAYER_INSERT_INDEX = 5
const NOAA_GNOME_FORCING_LAYER_INSERT_INDEX = 6
const NOAA_GNOME_RELEASE_LAYER_INSERT_INDEX = 7

export function useNoaaGnomeMapLayer(options: UseNoaaGnomeMapLayerOptions) {
  const slickLayerRef = useRef<GraphicsLayer | null>(null)
  const particleLayerRef = useRef<GraphicsLayer | null>(null)
  const forcingLayerRef = useRef<GraphicsLayer | null>(null)
  const releaseLayerRef = useRef<GraphicsLayer | null>(null)
  const hasZoomedRef = useRef(false)

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
      insertIndex: number
    ) => {
      if (!layerRef.current || !map.layers.includes(layerRef.current)) {
        layerRef.current = new GraphicsLayer({
          id,
          title,
          listMode: 'hide',
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
        NOAA_GNOME_SLICK_LAYER_INSERT_INDEX
      )
      const particleLayer = ensureLayer(
        map,
        particleLayerRef,
        NOAA_GNOME_PARTICLE_LAYER_ID,
        'NOAA GNOME particles',
        NOAA_GNOME_PARTICLE_LAYER_INSERT_INDEX
      )
      const forcingLayer = ensureLayer(
        map,
        forcingLayerRef,
        NOAA_GNOME_FORCING_LAYER_ID,
        'NOAA GNOME forcing',
        NOAA_GNOME_FORCING_LAYER_INSERT_INDEX
      )
      const releaseLayer = ensureLayer(
        map,
        releaseLayerRef,
        NOAA_GNOME_RELEASE_LAYER_ID,
        'NOAA GNOME release point',
        NOAA_GNOME_RELEASE_LAYER_INSERT_INDEX
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
  }, [options.enabled, options.hourIndex, options.mapViewRef])
}
