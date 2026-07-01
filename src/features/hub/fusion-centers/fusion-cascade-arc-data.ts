import {
  getFusionCascadeArcColors,
} from '@/features/hub/fusion-centers/fusion-cascade-impact-projection'
import type { HubNotificationMapSource } from '@/features/hub/map/hub-notification-map-graphics'

export type GeoCoordinate = [number, number]

export type FusionCascadeArc = {
  id: string
  notificationId: number
  threatIndex: number
  source: GeoCoordinate
  target: GeoCoordinate
  resource: string
  threatId: string
  sourceColor: [number, number, number, number]
  targetColor: [number, number, number, number]
  width: number
}

export type FusionCascadeMapExtent = {
  center: GeoCoordinate
  zoom: number
}

const COORD_EPSILON = 0.0001

export function coordinatesEqual(
  left: GeoCoordinate,
  right: GeoCoordinate,
  epsilon = COORD_EPSILON
): boolean {
  return (
    Math.abs(left[0] - right[0]) < epsilon && Math.abs(left[1] - right[1]) < epsilon
  )
}

export function buildFusionCascadeArcs(
  notification: HubNotificationMapSource | null | undefined,
  hourIndex: number
): FusionCascadeArc[] {
  if (!notification?.regionalThreats?.threats?.length) {
    return []
  }

  const source = notification.location
  return notification.regionalThreats.threats.flatMap((threat, threatIndex) => {
    if (coordinatesEqual(source, threat.location)) {
      return []
    }

    const colors = getFusionCascadeArcColors(threat.id, hourIndex)
    return [
      {
        id: threat.id,
        notificationId: notification.id,
        threatIndex,
        source: [...source] as GeoCoordinate,
        target: [...threat.location] as GeoCoordinate,
        resource: threat.resource,
        threatId: threat.id,
        sourceColor: colors.sourceColor,
        targetColor: colors.targetColor,
        width: colors.width,
      },
    ]
  })
}

export function getNotificationCascadeExtent(
  notification: HubNotificationMapSource | null | undefined
): FusionCascadeMapExtent | null {
  if (!notification) {
    return null
  }

  const coordinates: GeoCoordinate[] = [notification.location]
  for (const threat of notification.regionalThreats?.threats ?? []) {
    coordinates.push(threat.location)
  }

  const longitudes = coordinates.map(([lng]) => lng)
  const latitudes = coordinates.map(([, lat]) => lat)
  return {
    center: [
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    ],
    zoom: 9,
  }
}
