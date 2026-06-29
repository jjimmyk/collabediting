import type MapView from '@arcgis/core/views/MapView'
import { getMapFeaturesExtent } from '@/features/exercise-msel/msel-geometry-utils'
import type { MselMapFeature } from '@/features/exercise-msel/types'

type MapViewLike = Pick<MapView, 'goTo' | 'padding'>

export type FocusMapFeaturesOptions = {
  padding?: MapView['padding']
  animate?: boolean
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
    if (features.length === 1 && features[0]?.type === 'point') {
      const [longitude, latitude] = features[0].coordinates
      await view.goTo({ center: [longitude, latitude], zoom: 12 }, { animate })
      return
    }

    const extent = getMapFeaturesExtent(features)
    if (!extent) {
      return
    }

    const span = Math.max(extent.xmax - extent.xmin, extent.ymax - extent.ymin)
    const zoom = span > 5 ? 6 : span > 1 ? 8 : span > 0.2 ? 10 : 12
    await view.goTo(
      {
        center: [(extent.xmin + extent.xmax) / 2, (extent.ymin + extent.ymax) / 2],
        zoom,
      },
      { animate }
    )
  } catch {
    // Ignore interrupted goTo calls.
  }
}
