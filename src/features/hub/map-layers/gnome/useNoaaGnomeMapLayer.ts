import { useEffect, useRef, type RefObject } from 'react'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Map from '@arcgis/core/Map'
import type MapView from '@arcgis/core/views/MapView'
import {
  getNoaaGnomeTimeExtentForHour,
  NOAA_GNOME_MAP_EXTENT,
} from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'
import {
  buildNoaaGnomeParticleGraphics,
  buildNoaaGnomeReleaseGraphic,
  loadNoaaGnomeParticleLayerSource,
  NOAA_GNOME_PARTICLE_FIELDS,
  NOAA_GNOME_PARTICLE_LAYER_ID,
  NOAA_GNOME_RELEASE_LAYER_ID,
} from '@/features/hub/map-layers/gnome/noaa-gnome-map-utils'

type UseNoaaGnomeMapLayerOptions = {
  enabled: boolean
  hourIndex: number
  mapViewRef: RefObject<MapView | null>
}

const NOAA_GNOME_PARTICLE_LAYER_INSERT_INDEX = 4
const NOAA_GNOME_RELEASE_LAYER_INSERT_INDEX = 5

function buildHourDefinitionExpression(hourIndex: number): string {
  const { start, end } = getNoaaGnomeTimeExtentForHour(hourIndex)
  return `time_stamp >= ${start.getTime()} AND time_stamp < ${end.getTime()}`
}

export function useNoaaGnomeMapLayer(options: UseNoaaGnomeMapLayerOptions) {
  const particleLayerRef = useRef<FeatureLayer | null>(null)
  const releaseLayerRef = useRef<GraphicsLayer | null>(null)
  const hasZoomedRef = useRef(false)
  const particlesLoadedRef = useRef(false)

  useEffect(() => {
    hasZoomedRef.current = false
    particlesLoadedRef.current = false
  }, [options.enabled])

  useEffect(() => {
    if (!options.enabled) {
      if (particleLayerRef.current) {
        particleLayerRef.current.visible = false
        particleLayerRef.current.definitionExpression = '1=0'
      }
      if (releaseLayerRef.current) {
        releaseLayerRef.current.visible = false
        releaseLayerRef.current.removeAll()
      }
      return
    }

    let cancelled = false
    let attachRaf = 0

    const ensureParticleLayer = (map: Map) => {
      if (!particleLayerRef.current || !map.layers.includes(particleLayerRef.current)) {
        particleLayerRef.current = new FeatureLayer({
          id: NOAA_GNOME_PARTICLE_LAYER_ID,
          title: 'NOAA GNOME',
          listMode: 'hide',
          geometryType: 'point',
          spatialReference: { wkid: 4326 },
          objectIdField: 'ObjectID',
          fields: NOAA_GNOME_PARTICLE_FIELDS,
          source: [],
          timeInfo: {
            startField: 'time_stamp',
            endField: 'time_stamp',
          },
          popupTemplate: {
            title: 'Oil particle · {particle_id}',
            content:
              '<b>Time:</b> {time_stamp}<br/><b>Mass:</b> {mass_g} g<br/><b>Depth:</b> {depth_m} m<br/><b>Status:</b> {status}<br/><b>Mover:</b> {mover_id}',
          },
        })
        map.add(particleLayerRef.current, NOAA_GNOME_PARTICLE_LAYER_INSERT_INDEX)
      }

      return particleLayerRef.current
    }

    const ensureReleaseLayer = (map: Map) => {
      if (!releaseLayerRef.current || !map.layers.includes(releaseLayerRef.current)) {
        releaseLayerRef.current = new GraphicsLayer({
          id: NOAA_GNOME_RELEASE_LAYER_ID,
          title: 'NOAA GNOME release point',
          listMode: 'hide',
        })
        map.add(releaseLayerRef.current, NOAA_GNOME_RELEASE_LAYER_INSERT_INDEX)
      }

      return releaseLayerRef.current
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

      const particleLayer = ensureParticleLayer(map)
      const releaseLayer = ensureReleaseLayer(map)

      particleLayer.visible = true
      particleLayer.definitionExpression = buildHourDefinitionExpression(options.hourIndex)
      releaseLayer.visible = true
      releaseLayer.removeAll()
      releaseLayer.add(buildNoaaGnomeReleaseGraphic())

      if (!particlesLoadedRef.current) {
        particlesLoadedRef.current = true
        void loadNoaaGnomeParticleLayerSource(particleLayer, buildNoaaGnomeParticleGraphics()).catch(
          () => {
            particlesLoadedRef.current = false
          }
        )
      }

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

  useEffect(() => {
    if (!options.enabled || !particleLayerRef.current) {
      return
    }

    particleLayerRef.current.definitionExpression = buildHourDefinitionExpression(options.hourIndex)
  }, [options.enabled, options.hourIndex])
}
