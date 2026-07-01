import { useEffect, useRef } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import { useNoaaGnomeMapLayer } from '@/features/hub/map-layers/gnome/useNoaaGnomeMapLayer'
import {
  formatCurrentForcing,
  formatNoaaGnomeHourLabel,
  formatWindForcing,
  getNoaaGnomeHourlyForcing,
  getNoaaGnomeParticlesForHour,
  NOAA_GNOME_MAP_EXTENT,
  NOAA_GNOME_STEP_COUNT,
} from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'
import { TrajectoryHourControl } from '@/features/hub/map-layers/shared/TrajectoryHourControl'
import { safeDestroyMapView } from '@/lib/arcgis-load-abort'

type NoaaGnomeNotificationMapEmbedProps = {
  hourIndex: number
  onHourIndexChange: (hourIndex: number) => void
}

export function NoaaGnomeNotificationMapEmbed({
  hourIndex,
  onHourIndexChange,
}: NoaaGnomeNotificationMapEmbedProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapViewRef = useRef<MapView | null>(null)
  const forcing = getNoaaGnomeHourlyForcing(hourIndex)
  const particleCount = getNoaaGnomeParticlesForHour(hourIndex).length

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
          basemap: 'streets-navigation-vector',
        })
        mapViewRef.current = new MapView({
          container,
          map,
          center: NOAA_GNOME_MAP_EXTENT.center,
          scale: NOAA_GNOME_MAP_EXTENT.scale,
          ui: {
            components: ['zoom'],
          },
        })
        return
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

  useNoaaGnomeMapLayer({
    enabled: true,
    hourIndex,
    mapViewRef,
    layerInsertStartIndex: 0,
  })

  return (
    <div className="mt-4 space-y-2 border-t pt-3">
      <p className="font-medium">Oil Spill Trajectory Model (NOAA GNOME)</p>
      <TrajectoryHourControl
        id="noaa-gnome-notification-hour-slider"
        hourIndex={hourIndex}
        onHourIndexChange={onHourIndexChange}
        stepCount={NOAA_GNOME_STEP_COUNT}
        formatLabel={formatNoaaGnomeHourLabel}
        ariaLabel="NOAA GNOME trajectory hour"
      >
        <p className="text-[11px] text-muted-foreground">Wind: {formatWindForcing(forcing)}</p>
        <p className="text-[11px] text-muted-foreground">
          Current: {formatCurrentForcing(forcing)}
        </p>
        <p className="text-[11px] text-muted-foreground">Particles this hour: {particleCount}</p>
      </TrajectoryHourControl>
      <div
        ref={mapContainerRef}
        className="h-64 w-full overflow-hidden rounded-md border bg-muted/30"
        aria-label="NOAA GNOME oil spill trajectory map"
      />
    </div>
  )
}
