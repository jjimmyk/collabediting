import { useEffect, useRef, type RefObject } from 'react'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import type MapView from '@arcgis/core/views/MapView'
import type Point from '@arcgis/core/geometry/Point'
import type Geometry from '@arcgis/core/geometry/Geometry'
import type Polygon from '@arcgis/core/geometry/Polygon'
import { createMselMapFeatureId } from './msel-geometry-utils'
import type { ExerciseMselState, MselInject, MselMapFeature, MselMapPlacementMode } from './types'
import { isMselInjectGraphicHit, syncMselInjectGraphics } from './msel-map-utils'

type UseMselInjectMapLayerOptions = {
  enabled: boolean
  mapViewRef: RefObject<MapView | null>
  injects: MselInject[]
  objectives: ExerciseMselState['objectives']
  activePlacementInjectId: number | null
  activePlacementMode: MselMapPlacementMode | null
  onAddMapFeature: (injectId: number, feature: MselMapFeature) => void
  onSelectInjectFromMap: (injectId: number) => void
}

function geometryToMapFeature(geometry: Geometry): MselMapFeature | null {
  if (geometry.type === 'point') {
    const point = geometry as Point
    const latitude = point.latitude
    const longitude = point.longitude
    if (latitude == null || longitude == null) {
      return null
    }
    return {
      id: createMselMapFeatureId(),
      type: 'point',
      coordinates: [longitude, latitude],
    }
  }

  if (geometry.type === 'polygon') {
    const polygon = geometry as Polygon
    const rings = polygon.rings
      ?.map((ring) =>
        ring
          .filter((pair) => pair.length >= 2)
          .map((pair) => [pair[0], pair[1]] as [number, number])
      )
      .filter((ring) => ring.length >= 3)

    if (!rings || rings.length === 0) {
      return null
    }

    return {
      id: createMselMapFeatureId(),
      type: 'polygon',
      rings,
    }
  }

  return null
}

export function useMselInjectMapLayer(options: UseMselInjectMapLayerOptions) {
  const layerRef = useRef<GraphicsLayer | null>(null)
  const placementLayerRef = useRef<GraphicsLayer | null>(null)
  const sketchRef = useRef<SketchViewModel | null>(null)
  const clickHandleRef = useRef<{ remove(): void } | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!options.enabled) {
      if (sketchRef.current) {
        sketchRef.current.destroy()
        sketchRef.current = null
      }
      if (layerRef.current) {
        layerRef.current.removeAll()
      }
      if (placementLayerRef.current) {
        placementLayerRef.current.removeAll()
      }
      return
    }

    let cancelled = false
    let attachRaf = 0

    const attach = () => {
      if (cancelled) {
        return
      }

      const view = options.mapViewRef.current
      if (!view) {
        attachRaf = requestAnimationFrame(attach)
        return
      }

      const map = view.map
      if (!map) {
        attachRaf = requestAnimationFrame(attach)
        return
      }

      if (!layerRef.current) {
        const layer = new GraphicsLayer({
          id: 'msel-inject-layer',
          title: 'MSEL Injects',
          listMode: 'hide',
        })
        layerRef.current = layer
        map.add(layer)
      }

      if (!placementLayerRef.current) {
        const placementLayer = new GraphicsLayer({
          id: 'msel-inject-placement-layer',
          title: 'MSEL Inject Placement',
          listMode: 'hide',
        })
        placementLayerRef.current = placementLayer
        map.add(placementLayer)
      }

      syncMselInjectGraphics(layerRef.current, options.injects, options.objectives)

      if (clickHandleRef.current) {
        clickHandleRef.current.remove()
      }

      clickHandleRef.current = view.on('click', (event) => {
        void view.hitTest(event).then((response) => {
          for (const result of response.results) {
            if (result.type !== 'graphic') {
              continue
            }
            const graphic = result.graphic
            const attributes = graphic.attributes as Record<string, unknown> | undefined
            if (!attributes || !isMselInjectGraphicHit(attributes)) {
              continue
            }
            event.stopPropagation()
            optionsRef.current.onSelectInjectFromMap(attributes.injectId as number)
            void view.openPopup({
              features: [graphic],
              location: graphic.geometry as Point,
            })
            return
          }
        })
      })
    }

    attach()

    return () => {
      cancelled = true
      cancelAnimationFrame(attachRaf)
      clickHandleRef.current?.remove()
      clickHandleRef.current = null
    }
  }, [options.enabled, options.mapViewRef, options.injects, options.objectives])

  useEffect(() => {
    const view = options.mapViewRef.current
    const placementLayer = placementLayerRef.current
    const injectId = options.activePlacementInjectId
    const placementMode = options.activePlacementMode

    if (!view || !placementLayer || !options.enabled || injectId == null || placementMode == null) {
      sketchRef.current?.cancel()
      placementLayer?.removeAll()
      return
    }

    if (sketchRef.current) {
      sketchRef.current.destroy()
      sketchRef.current = null
    }

    placementLayer.removeAll()

    const sketch = new SketchViewModel({
      view,
      layer: placementLayer,
      updateOnGraphicClick: false,
      polygonSymbol: {
        type: 'simple-fill',
        color: [168, 85, 247, 0.25],
        outline: {
          color: [168, 85, 247, 0.95],
          width: 1.6,
        },
      },
    })

    sketch.on('create', (event) => {
      if (event.state !== 'complete' || !event.graphic?.geometry) {
        return
      }

      const feature = geometryToMapFeature(event.graphic.geometry)
      const activeInjectId = optionsRef.current.activePlacementInjectId
      if (!feature || activeInjectId == null) {
        return
      }

      optionsRef.current.onAddMapFeature(activeInjectId, feature)
      placementLayer.removeAll()
      sketch.cancel()
    })

    sketch.create(placementMode)
    sketchRef.current = sketch

    return () => {
      sketch.destroy()
      if (sketchRef.current === sketch) {
        sketchRef.current = null
      }
    }
  }, [
    options.activePlacementInjectId,
    options.activePlacementMode,
    options.enabled,
    options.mapViewRef,
  ])

  useEffect(() => {
    return () => {
      sketchRef.current?.destroy()
      sketchRef.current = null
      const view = options.mapViewRef.current
      const map = view?.map
      if (layerRef.current && map) {
        map.remove(layerRef.current)
      }
      if (placementLayerRef.current && map) {
        map.remove(placementLayerRef.current)
      }
      layerRef.current = null
      placementLayerRef.current = null
    }
  }, [options.mapViewRef])
}
