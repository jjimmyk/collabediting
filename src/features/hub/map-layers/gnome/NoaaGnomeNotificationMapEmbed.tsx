import { useEffect, useRef } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
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
      <div className="space-y-2 rounded-md border bg-muted/20 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="noaa-gnome-notification-hour-slider" className="text-xs font-medium">
            Trajectory hour
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {formatNoaaGnomeHourLabel(hourIndex)}
          </span>
        </div>
        <Slider
          id="noaa-gnome-notification-hour-slider"
          min={0}
          max={NOAA_GNOME_STEP_COUNT - 1}
          step={1}
          value={[hourIndex]}
          onValueChange={(value) => {
            const next = value[0]
            if (typeof next === 'number') {
              onHourIndexChange(next)
            }
          }}
          aria-label="NOAA GNOME trajectory hour"
        />
        <p className="text-[11px] text-muted-foreground">
          Wind: {formatWindForcing(forcing)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Current: {formatCurrentForcing(forcing)}
        </p>
        <p className="text-[11px] text-muted-foreground">Particles this hour: {particleCount}</p>
      </div>
      <div
        ref={mapContainerRef}
        className="h-64 w-full overflow-hidden rounded-md border bg-muted/30"
        aria-label="NOAA GNOME oil spill trajectory map"
      />
    </div>
  )
}
