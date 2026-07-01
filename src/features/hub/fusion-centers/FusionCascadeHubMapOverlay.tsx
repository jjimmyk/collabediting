import type { RefObject } from 'react'
import type MapView from '@arcgis/core/views/MapView'
import { FusionCascadeDeckSurface } from '@/features/hub/fusion-centers/FusionCascadeDeckSurface'
import type { HubNotificationMapSource } from '@/features/hub/map/hub-notification-map-graphics'

type FusionCascadeHubMapOverlayProps = {
  mapViewRef: RefObject<MapView | null>
  notification: HubNotificationMapSource | null | undefined
  hourIndex: number
}

export function FusionCascadeHubMapOverlay({
  mapViewRef,
  notification,
  hourIndex,
}: FusionCascadeHubMapOverlayProps) {
  return (
    <FusionCascadeDeckSurface
      enabled
      notification={notification}
      hourIndex={hourIndex}
      mapViewRef={mapViewRef}
      className="z-[5]"
      fitExtentOnAttach={false}
    />
  )
}
