import { useCallback, useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import {
  FUSION_CASCADE_SCENARIO,
  statusToTailwindClass,
} from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import { useConsequenceEngineMapOverlay } from '@/features/hub/fusion-centers/useConsequenceEngineMapOverlay'
import type {
  ConsequenceHubMarkerPosition,
  ConsequenceSectorLabelPosition,
} from '@/features/hub/fusion-centers/consequence-engine-types'
import { safeDestroyMapView } from '@/lib/arcgis-load-abort'
import { cn } from '@/lib/utils'

export function ConsequenceEngineMapOverlay() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapViewRef = useRef<MapView | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hubMarker, setHubMarker] = useState<ConsequenceHubMarkerPosition>({
    x: 0,
    y: 0,
    visible: false,
  })
  const [sectorLabels, setSectorLabels] = useState<ConsequenceSectorLabelPosition[]>([])

  const handleHubMarkerChange = useCallback((position: ConsequenceHubMarkerPosition) => {
    setHubMarker(position)
  }, [])

  const handleSectorLabelsChange = useCallback((labels: ConsequenceSectorLabelPosition[]) => {
    setSectorLabels(labels)
  }, [])

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

  useConsequenceEngineMapOverlay({
    enabled: true,
    mapViewRef,
    mapContainerRef,
    svgRef,
    onHubMarkerChange: handleHubMarkerChange,
    onSectorLabelsChange: handleSectorLabelsChange,
  })

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-md border bg-muted/30">
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        aria-label="Cascading critical infrastructure impacts map"
      />
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      {hubMarker.visible ? (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: hubMarker.x,
            top: hubMarker.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-destructive/40" />
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-destructive bg-destructive" />
        </div>
      ) : null}
      {sectorLabels.map((sector) =>
        sector.visible ? (
          <div
            key={sector.id}
            className="pointer-events-none absolute z-10 max-w-[9rem] rounded-md border bg-background/90 px-1.5 py-1 text-[10px] shadow-sm backdrop-blur-sm"
            style={{
              left: sector.x + 10,
              top: sector.y - 12,
              transform: 'translateY(-50%)',
            }}
          >
            <p className="font-semibold leading-tight">{sector.name}</p>
            <p className={cn('font-medium', statusToTailwindClass(sector.status))}>
              {sector.status}
            </p>
            <p className="text-muted-foreground">{sector.countdown}</p>
          </div>
        ) : null
      )}
      {hubMarker.visible ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-background/90 px-2 py-1 text-[10px] shadow-sm backdrop-blur-sm"
          style={{
            left: hubMarker.x,
            top: hubMarker.y + 16,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-semibold">{FUSION_CASCADE_SCENARIO.hub.name}</p>
          <p className={cn('font-medium', statusToTailwindClass(FUSION_CASCADE_SCENARIO.hub.status))}>
            {FUSION_CASCADE_SCENARIO.hub.status}
          </p>
        </div>
      ) : null}
    </div>
  )
}
