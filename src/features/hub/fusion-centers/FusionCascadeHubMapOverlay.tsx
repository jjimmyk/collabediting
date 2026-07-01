import type { RefObject } from 'react'
import type MapView from '@arcgis/core/views/MapView'
import { ConsequenceEngineMapSurface } from '@/features/hub/fusion-centers/ConsequenceEngineMapSurface'

type FusionCascadeHubMapOverlayProps = {
  mapViewRef: RefObject<MapView | null>
  mapContainerRef: RefObject<HTMLDivElement | null>
}

export function FusionCascadeHubMapOverlay({
  mapViewRef,
  mapContainerRef,
}: FusionCascadeHubMapOverlayProps) {
  return (
    <ConsequenceEngineMapSurface
      enabled
      mapViewRef={mapViewRef}
      mapContainerRef={mapContainerRef}
      className="z-[5]"
      fitExtentOnAttach={false}
    />
  )
}
