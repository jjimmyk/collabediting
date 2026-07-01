import { useEffect, useRef, useState, type RefObject } from 'react'
import type MapView from '@arcgis/core/views/MapView'
import { FusionCascadeImpactModal } from '@/features/hub/fusion-centers/FusionCascadeImpactModal'
import type { FusionCascadeArc } from '@/features/hub/fusion-centers/fusion-cascade-arc-data'
import { useFusionCascadeArcLayer } from '@/features/hub/fusion-centers/useFusionCascadeArcLayer'
import type { HubNotificationMapSource } from '@/features/hub/map/hub-notification-map-graphics'
import { cn } from '@/lib/utils'

type FusionCascadeDeckSurfaceProps = {
  enabled: boolean
  notification: HubNotificationMapSource | null | undefined
  hourIndex: number
  mapViewRef: RefObject<MapView | null>
  className?: string
  fitExtentOnAttach?: boolean
}

export function FusionCascadeDeckSurface({
  enabled,
  notification,
  hourIndex,
  mapViewRef,
  className,
  fitExtentOnAttach = false,
}: FusionCascadeDeckSurfaceProps) {
  const [hoveredArc, setHoveredArc] = useState<FusionCascadeArc | null>(null)
  const hoverClearTimerRef = useRef<number | null>(null)

  const handleArcHover = (arc: FusionCascadeArc | null) => {
    if (hoverClearTimerRef.current !== null) {
      window.clearTimeout(hoverClearTimerRef.current)
      hoverClearTimerRef.current = null
    }

    if (arc) {
      setHoveredArc(arc)
      return
    }

    hoverClearTimerRef.current = window.setTimeout(() => {
      setHoveredArc(null)
      hoverClearTimerRef.current = null
    }, 120)
  }

  useEffect(() => {
    return () => {
      if (hoverClearTimerRef.current !== null) {
        window.clearTimeout(hoverClearTimerRef.current)
      }
    }
  }, [])

  useFusionCascadeArcLayer({
    enabled,
    notification,
    hourIndex,
    mapViewRef,
    fitExtentOnAttach,
    onArcHover: handleArcHover,
  })

  return (
    <>
      <div className={cn('pointer-events-none absolute inset-0', className)} aria-hidden="true" />
      <FusionCascadeImpactModal
        open={hoveredArc !== null}
        arc={hoveredArc}
        hourIndex={hourIndex}
        onClose={() => setHoveredArc(null)}
      />
    </>
  )
}
