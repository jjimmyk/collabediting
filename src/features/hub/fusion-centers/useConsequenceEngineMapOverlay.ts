import { useEffect, useRef, type RefObject } from 'react'
import Point from '@arcgis/core/geometry/Point'
import type MapView from '@arcgis/core/views/MapView'
import {
  advancePacketAnimation,
  drawConsequenceOverlay,
  projectScenarioToScreen,
  updatePacketPositions,
} from '@/features/hub/fusion-centers/consequence-engine-overlay-draw'
import {
  FUSION_CASCADE_SCENARIO,
  getConsequenceMapExtent,
} from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import type {
  ConsequenceHubMarkerPosition,
  ConsequenceSectorLabelPosition,
  GeoCoordinate,
} from '@/features/hub/fusion-centers/consequence-engine-types'

type UseConsequenceEngineMapOverlayOptions = {
  enabled: boolean
  mapViewRef: RefObject<MapView | null>
  mapContainerRef: RefObject<HTMLDivElement | null>
  svgRef: RefObject<SVGSVGElement | null>
  onHubMarkerChange: (position: ConsequenceHubMarkerPosition) => void
  onSectorLabelsChange: (labels: ConsequenceSectorLabelPosition[]) => void
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useConsequenceEngineMapOverlay({
  enabled,
  mapViewRef,
  mapContainerRef,
  svgRef,
  onHubMarkerChange,
  onSectorLabelsChange,
}: UseConsequenceEngineMapOverlayOptions) {
  const animationPhaseRef = useRef(0)
  const rafRef = useRef(0)
  const handlesRef = useRef<unknown[]>([])
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false
    const reduceMotion = prefersReducedMotion()

    const projectGeoToScreen = (coord: GeoCoordinate) => {
      const view = mapViewRef.current
      if (!view || view.destroyed) {
        return null
      }
      const screenPoint = view.toScreen(
        new Point({
          longitude: coord[0],
          latitude: coord[1],
        })
      )
      if (!screenPoint || !Number.isFinite(screenPoint.x) || !Number.isFinite(screenPoint.y)) {
        return null
      }
      return { x: screenPoint.x, y: screenPoint.y }
    }

    const updateOverlay = () => {
      const svg = svgRef.current
      if (!svg) {
        return
      }
      const projected = projectScenarioToScreen(FUSION_CASCADE_SCENARIO, projectGeoToScreen)
      if (!projected) {
        onHubMarkerChange({ x: 0, y: 0, visible: false })
        onSectorLabelsChange([])
        svg.innerHTML = ''
        return
      }

      const result = drawConsequenceOverlay(svg, projected, {
        animate: !reduceMotion,
        animationPhase: animationPhaseRef.current,
      })
      onHubMarkerChange(result.hubMarker)
      onSectorLabelsChange(
        result.sectorLabels.map((label) => {
          const sector = projected.sectors.find((entry) => entry.id === label.id)
          if (!sector) {
            return null
          }
          return {
            ...sector,
            visible: label.visible,
          }
        }).filter((label): label is ConsequenceSectorLabelPosition => label !== null)
      )
    }

    const fitExtent = async () => {
      const view = mapViewRef.current
      if (!view || view.destroyed) {
        return
      }
      const extent = getConsequenceMapExtent()
      try {
        await view.goTo(
          {
            center: [...extent.center] as [number, number],
            zoom: extent.zoom,
          },
          { animate: false }
        )
      } catch {
        // Map may be destroyed mid-flight during unmount.
      }
    }

    const bindViewSync = (view: MapView) => {
      handlesRef.current.forEach((handle) => {
        if (handle && typeof handle === 'object' && 'remove' in handle) {
          ;(handle as { remove: () => void }).remove()
        }
      })
      handlesRef.current = []

      handlesRef.current.push(
        view.watch('size', () => {
          updateOverlay()
        })
      )
      handlesRef.current.push(
        view.watch('stationary', (isStationary) => {
          if (isStationary) {
            updateOverlay()
          }
        })
      )
      handlesRef.current.push(
        view.on('pointer-move', () => {
          if (!view.stationary) {
            updateOverlay()
          }
        })
      )
      handlesRef.current.push(
        view.on('pointer-down', () => {
          updateOverlay()
        })
      )
    }

    const startAnimationLoop = () => {
      if (reduceMotion) {
        return
      }
      const tick = () => {
        if (cancelled) {
          return
        }
        animationPhaseRef.current = advancePacketAnimation(animationPhaseRef.current)
        const svg = svgRef.current
        if (svg) {
          const packetsGroup = svg.querySelector('.consequence-packets')
          if (packetsGroup instanceof SVGGElement) {
            const circles = packetsGroup.querySelectorAll('circle')
            circles.forEach((circle, index) => {
              const offset = Number(circle.dataset.offset ?? 0)
              circle.dataset.offset = String(offset + 1.5 + index * 0.2)
            })
            updatePacketPositions(packetsGroup)
          }
          const linksGroup = svg.querySelector('.consequence-links')
          if (linksGroup) {
            linksGroup.querySelectorAll('path').forEach((path) => {
              path.setAttribute(
                'stroke-dashoffset',
                String(-animationPhaseRef.current % 20)
              )
            })
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const attachWhenReady = () => {
      const view = mapViewRef.current
      if (!view || view.destroyed || cancelled) {
        return
      }
      void view.when().then(() => {
        if (cancelled) {
          return
        }
        bindViewSync(view)
        void fitExtent().then(() => {
          if (!cancelled) {
            updateOverlay()
            startAnimationLoop()
          }
        })
      })
    }

    attachWhenReady()

    const container = mapContainerRef.current
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateOverlay()
      })
      resizeObserverRef.current.observe(container)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      handlesRef.current.forEach((handle) => {
        if (handle && typeof handle === 'object' && 'remove' in handle) {
          ;(handle as { remove: () => void }).remove()
        }
      })
      handlesRef.current = []
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      const svg = svgRef.current
      if (svg) {
        svg.innerHTML = ''
      }
      onHubMarkerChange({ x: 0, y: 0, visible: false })
      onSectorLabelsChange([])
    }
  }, [
    enabled,
    mapContainerRef,
    mapViewRef,
    onHubMarkerChange,
    onSectorLabelsChange,
    svgRef,
  ])
}
