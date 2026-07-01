import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'

const MAP_DRAW_FIELD_KEY = 'map:draw'
const LAT_LNG_SCALE = 1_000_000

export function encodeIcs201MapPointer(lat: number, lng: number) {
  return {
    anchor: Math.round(lat * LAT_LNG_SCALE),
    head: Math.round(lng * LAT_LNG_SCALE),
  }
}

export function decodeIcs201MapPointer(anchor: number, head: number) {
  return {
    latitude: anchor / LAT_LNG_SCALE,
    longitude: head / LAT_LNG_SCALE,
  }
}

type Ics201MapSketchRemotePointersProps = {
  cursors: Ics201CursorState[]
  layerRef: RefObject<GraphicsLayer | null>
  /** Bumps when the map layer may have become available. */
  refreshKey?: string | number | boolean
}

export function Ics201MapSketchRemotePointers({
  cursors,
  layerRef,
  refreshKey,
}: Ics201MapSketchRemotePointersProps) {
  const graphicsRef = useRef<Graphic[]>([])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return undefined

    graphicsRef.current.forEach((graphic) => {
      layer.remove(graphic)
    })
    graphicsRef.current = []

    const drawCursors = cursors.filter((cursor) => cursor.fieldKey === MAP_DRAW_FIELD_KEY)
    drawCursors.forEach((cursor) => {
      const { latitude, longitude } = decodeIcs201MapPointer(cursor.anchor, cursor.head)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return

      const graphic = new Graphic({
        geometry: new Point({
          longitude,
          latitude,
        }),
        symbol: {
          type: 'simple-marker',
          color: cursor.userColor,
          size: 10,
          outline: {
            color: [255, 255, 255, 1],
            width: 1.5,
          },
        },
        attributes: {
          mapKey: `ics201-remote-pointer-${cursor.userId}`,
          kind: 'ICS-201 Remote Pointer',
          initials: cursor.userInitials,
        },
      })
      layer.add(graphic)
      graphicsRef.current.push(graphic)
    })

    return () => {
      graphicsRef.current.forEach((graphic) => {
        layer.remove(graphic)
      })
      graphicsRef.current = []
    }
  }, [cursors, layerRef, refreshKey])

  return null
}

export { MAP_DRAW_FIELD_KEY }
