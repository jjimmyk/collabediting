import { useEffect, useRef, useState, type RefObject } from 'react'
import type Layer from '@arcgis/core/layers/Layer'
import type MapView from '@arcgis/core/views/MapView'
import { createWeatherLayer } from './create-weather-layer'
import { HUB_WEATHER_LAYER_CATALOG } from './weather-layer-catalog'

export type WeatherLayerStatus = 'idle' | 'loading' | 'ready' | 'error'

type UseHubWeatherMapLayersOptions = {
  enabled: boolean
  mapViewRef: RefObject<MapView | null>
  enabledLayerIds: Set<string>
}

const WEATHER_LAYER_INSERT_INDEX = 0

export function useHubWeatherMapLayers(options: UseHubWeatherMapLayersOptions) {
  const weatherLayersRef = useRef(new globalThis.Map<string, Layer>())
  const [layerStatuses, setLayerStatuses] = useState<Record<string, WeatherLayerStatus>>({})

  useEffect(() => {
    if (!options.enabled) {
      weatherLayersRef.current.forEach((layer) => {
        layer.visible = false
      })
      return
    }

    let cancelled = false
    let attachRaf = 0

    const setStatus = (layerId: string, status: WeatherLayerStatus) => {
      if (cancelled) {
        return
      }

      setLayerStatuses((previous) => {
        if (previous[layerId] === status) {
          return previous
        }

        return { ...previous, [layerId]: status }
      })
    }

    const ensureLayerOnMap = async (layerId: string, shouldShow: boolean) => {
      const definition = HUB_WEATHER_LAYER_CATALOG.find((entry) => entry.id === layerId)
      if (!definition) {
        return
      }

      const view = options.mapViewRef.current
      const map = view?.map ?? null
      if (!map) {
        return
      }

      let layer = weatherLayersRef.current.get(layerId) ?? null
      const layerStillOnMap = layer ? map.layers.includes(layer) : false

      if (!layer || !layerStillOnMap) {
        if (layer && !layerStillOnMap) {
          weatherLayersRef.current.delete(layerId)
        }

        if (!shouldShow) {
          return
        }

        layer = createWeatherLayer(definition)
        weatherLayersRef.current.set(layerId, layer)
        map.add(layer, WEATHER_LAYER_INSERT_INDEX)
        setStatus(layerId, 'loading')

        try {
          await layer.load()
          if (cancelled) {
            return
          }

          layer.visible = true
          setStatus(layerId, 'ready')
        } catch {
          if (cancelled) {
            return
          }

          layer.visible = false
          setStatus(layerId, 'error')
        }

        return
      }

      if (shouldShow) {
        if (layer.loadStatus === 'loaded') {
          layer.visible = true
          setStatus(layerId, 'ready')
          return
        }

        if (layer.loadStatus === 'failed') {
          setStatus(layerId, 'error')
          layer.visible = false
          return
        }

        setStatus(layerId, 'loading')
        try {
          await layer.load()
          if (cancelled) {
            return
          }

          layer.visible = true
          setStatus(layerId, 'ready')
        } catch {
          if (cancelled) {
            return
          }

          layer.visible = false
          setStatus(layerId, 'error')
        }
        return
      }

      layer.visible = false
      setStatus(layerId, 'idle')
    }

    const syncLayers = async () => {
      if (cancelled) {
        return
      }

      const view = options.mapViewRef.current
      if (!view?.map) {
        attachRaf = requestAnimationFrame(syncLayers)
        return
      }

      await Promise.all(
        HUB_WEATHER_LAYER_CATALOG.map((definition) =>
          ensureLayerOnMap(definition.id, options.enabledLayerIds.has(definition.id))
        )
      )
    }

    void syncLayers()

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
    }
  }, [options.enabled, options.enabledLayerIds, options.mapViewRef])

  return { layerStatuses }
}
