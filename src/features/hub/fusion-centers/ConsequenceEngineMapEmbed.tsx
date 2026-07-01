import { useEffect, useRef } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import { FUSION_CASCADE_SCENARIO } from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import { ConsequenceEngineMapSurface } from '@/features/hub/fusion-centers/ConsequenceEngineMapSurface'
import { safeDestroyMapView } from '@/lib/arcgis-load-abort'

type ConsequenceEngineMapEmbedProps = {
  enabled?: boolean
}

export function ConsequenceEngineMapEmbed({ enabled = true }: ConsequenceEngineMapEmbedProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapViewRef = useRef<MapView | null>(null)

  useEffect(() => {
    let cancelled = false
    let attachRaf = 0

    const attach = () => {
      if (cancelled) {
        return
      }
      const container = mapContainerRef.current
      if (!container) {
        attachRaf = requestAnimationFrame(attach)
        return
      }
      if (!mapViewRef.current) {
        const map = new Map({
          basemap: 'dark-gray-vector',
        })
        mapViewRef.current = new MapView({
          container,
          map,
          center: [...FUSION_CASCADE_SCENARIO.hub.coordinates] as [number, number],
          zoom: 8,
          ui: {
            components: ['zoom'],
          },
        })
      }
    }

    attachRaf = requestAnimationFrame(attach)

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
      safeDestroyMapView(mapViewRef.current)
      mapViewRef.current = null
    }
  }, [])

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-md border bg-muted/30">
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        aria-label="Cascading critical infrastructure impacts map"
      />
      {enabled ? (
        <ConsequenceEngineMapSurface
          enabled
          mapViewRef={mapViewRef}
          mapContainerRef={mapContainerRef}
          fitExtentOnAttach
        />
      ) : null}
    </div>
  )
}
