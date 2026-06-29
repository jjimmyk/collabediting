import Extent from '@arcgis/core/geometry/Extent'
import Point from '@arcgis/core/geometry/Point'
import type MapView from '@arcgis/core/views/MapView'
import { getMapFeaturesExtent } from '@/features/exercise-msel/msel-geometry-utils'
import type { MselMapFeature } from '@/features/exercise-msel/types'

type MapViewLike = Pick<MapView, 'goTo' | 'padding' | 'when'>

export type FocusMapFeaturesOptions = {
  padding?: MapView['padding']
  animate?: boolean
}

export async function waitForMapView(
  getView: () => MapView | null | undefined,
  options: { attempts?: number; delayMs?: number } = {}
): Promise<MapView | null> {
  const attempts = options.attempts ?? 40
  const delayMs = options.delayMs ?? 50

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const view = getView()
    if (view) {
      try {
        await view.when()
        return view
      } catch {
        return null
      }
    }
    await new Promise((resolve) => window.setTimeout(resolve, delayMs))
  }

  return null
}

function expandExtent(extent: NonNullable<ReturnType<typeof getMapFeaturesExtent>>) {
  const spanLng = Math.max(extent.xmax - extent.xmin, 0.002)
  const spanLat = Math.max(extent.ymax - extent.ymin, 0.002)
  const padLng = spanLng * 0.15
  const padLat = spanLat * 0.15

  return new Extent({
    xmin: extent.xmin - padLng,
    ymin: extent.ymin - padLat,
    xmax: extent.xmax + padLng,
    ymax: extent.ymax + padLat,
    spatialReference: { wkid: 4326 },
  })
}

export async function focusMapFeaturesOnView(
  view: MapViewLike | null | undefined,
  features: MselMapFeature[],
  options: FocusMapFeaturesOptions = {}
): Promise<void> {
  if (!view || features.length === 0) {
    return
  }

  const animate = options.animate ?? false
  if (options.padding !== undefined) {
    view.padding = options.padding
  }

  try {
    await view.when()

    if (features.length === 1 && features[0]?.type === 'point') {
      const [longitude, latitude] = features[0].coordinates
      await view.goTo(
        {
          center: new Point({ longitude, latitude }),
          zoom: 14,
        },
        { animate }
      )
      return
    }

    const extent = getMapFeaturesExtent(features)
    if (!extent) {
      return
    }

    await view.goTo(expandExtent(extent), { animate })
  } catch {
    // Ignore interrupted goTo calls.
  }
}
