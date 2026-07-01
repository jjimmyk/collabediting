import { useCallback, useRef, useState, type RefObject } from 'react'
import type MapView from '@arcgis/core/views/MapView'
import {
  FUSION_CASCADE_SCENARIO,
  statusToTailwindClass,
} from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import { useConsequenceEngineMapOverlay } from '@/features/hub/fusion-centers/useConsequenceEngineMapOverlay'
import type {
  ConsequenceHubMarkerPosition,
  ConsequenceSectorLabelPosition,
} from '@/features/hub/fusion-centers/consequence-engine-types'
import { cn } from '@/lib/utils'

type ConsequenceEngineMapSurfaceProps = {
  enabled: boolean
  mapViewRef: RefObject<MapView | null>
  mapContainerRef: RefObject<HTMLDivElement | null>
  className?: string
  fitExtentOnAttach?: boolean
}

export function ConsequenceEngineMapSurface({
  enabled,
  mapViewRef,
  mapContainerRef,
  className,
  fitExtentOnAttach = true,
}: ConsequenceEngineMapSurfaceProps) {
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

  useConsequenceEngineMapOverlay({
    enabled,
    mapViewRef,
    mapContainerRef,
    svgRef,
    onHubMarkerChange: handleHubMarkerChange,
    onSectorLabelsChange: handleSectorLabelsChange,
    fitExtentOnAttach,
  })

  return (
    <div className={cn('pointer-events-none absolute inset-0', className)}>
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
