import { useEffect, useRef } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import { FusionCascadeDeckSurface } from '@/features/hub/fusion-centers/FusionCascadeDeckSurface'
import { getNotificationCascadeExtent } from '@/features/hub/fusion-centers/fusion-cascade-arc-data'
import type { HubNotificationMapSource } from '@/features/hub/map/hub-notification-map-graphics'
import { safeDestroyMapView } from '@/lib/arcgis-load-abort'

type FusionCascadeMapEmbedProps = {
  enabled?: boolean
  notification: HubNotificationMapSource | null | undefined
  hourIndex: number
}

export function FusionCascadeMapEmbed({
  enabled = true,
  notification,
  hourIndex,
}: FusionCascadeMapEmbedProps) {
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
        const extent = getNotificationCascadeExtent(notification)
        const map = new Map({
          basemap: 'dark-gray-vector',
        })
        mapViewRef.current = new MapView({
          container,
          map,
          center: extent?.center ?? [-95.018, 29.628],
          zoom: extent?.zoom ?? 9,
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
  }, [notification])

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-md border bg-muted/30">
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        aria-label="Cascading critical infrastructure impacts map"
      />
      {enabled ? (
        <FusionCascadeDeckSurface
          enabled
          notification={notification}
          hourIndex={hourIndex}
          mapViewRef={mapViewRef}
          fitExtentOnAttach
        />
      ) : null}
    </div>
  )
}
