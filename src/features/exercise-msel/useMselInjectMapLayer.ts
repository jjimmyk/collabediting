import { useEffect, useRef, type RefObject } from 'react'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import type MapView from '@arcgis/core/views/MapView'
import type Point from '@arcgis/core/geometry/Point'
import type { ExerciseMselState, MselInject } from './types'
import { isMselInjectGraphicHit, syncMselInjectGraphics } from './msel-map-utils'

type UseMselInjectMapLayerOptions = {
  enabled: boolean
  mapViewRef: RefObject<MapView | null>
  injects: MselInject[]
  objectives: ExerciseMselState['objectives']
  activePlacementInjectId: number | null
  onPlaceInject: (injectId: number, location: [number, number]) => void
  onSelectInjectFromMap: (injectId: number) => void
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
    if (!view || !placementLayer || !options.enabled) {
      return
    }

    if (options.activePlacementInjectId == null) {
      sketchRef.current?.cancel()
      placementLayer.removeAll()
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
    })

    sketch.on('create', (event) => {
      if (event.state !== 'complete' || !event.graphic?.geometry) {
        return
      }

      const geometry = event.graphic.geometry
      if (geometry.type !== 'point') {
        return
      }

      const latitude = geometry.latitude
      const longitude = geometry.longitude
      if (latitude == null || longitude == null) {
        return
      }

      const injectId = optionsRef.current.activePlacementInjectId
      if (injectId == null) {
        return
      }

      optionsRef.current.onPlaceInject(injectId, [longitude, latitude])
      placementLayer.removeAll()
      sketch.cancel()
    })

    sketch.create('point')
    sketchRef.current = sketch

    return () => {
      sketch.destroy()
      if (sketchRef.current === sketch) {
        sketchRef.current = null
      }
    }
  }, [options.activePlacementInjectId, options.enabled, options.mapViewRef])

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
