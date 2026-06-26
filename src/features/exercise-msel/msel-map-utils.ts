import Graphic from '@arcgis/core/Graphic'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type { ExerciseMselState, MselInject, MselMapFeature } from './types'
import { MSEL_INJECT_MAP_KIND } from './types'
import { getInjectMapFeatures } from './msel-geometry-utils'
import {
  buildMselInjectPopupContent,
  getExerciseObjectiveLabel,
} from './msel-utils'

export function buildMselInjectGraphicAttributes(
  inject: MselInject,
  objectiveLabel: string,
  feature: MselMapFeature
): Record<string, string | number> {
  return {
    mapKey: `msel-inject-${inject.id}-${feature.id}`,
    kind: MSEL_INJECT_MAP_KIND,
    injectId: inject.id,
    featureId: feature.id,
    title: inject.inject.trim() || `Inject ${inject.id}`,
    scheduledTime: inject.scheduledTime.trim() || 'Not set',
    category: inject.category.trim() || 'Uncategorized',
    objective: objectiveLabel,
    injectText: inject.inject.trim() || 'No inject text',
    expectedAction: inject.expectedAction.trim() || 'No expected action',
  }
}

export function createMselInjectFeatureGraphic(
  inject: MselInject,
  feature: MselMapFeature,
  objectives: ExerciseMselState['objectives']
): Graphic | null {
  const objectiveLabel = getExerciseObjectiveLabel(objectives, inject.objectiveId)
  const attributes = buildMselInjectGraphicAttributes(inject, objectiveLabel, feature)

  if (feature.type === 'point') {
    const [longitude, latitude] = feature.coordinates
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null
    }

    return new Graphic({
      geometry: {
        type: 'point',
        longitude,
        latitude,
      },
      symbol: {
        type: 'simple-marker',
        color: [168, 85, 247, 0.95],
        size: 12,
        outline: {
          color: [255, 255, 255, 1],
          width: 1.4,
        },
      },
      attributes,
      popupTemplate: {
        title: inject.inject.trim() || `Inject ${inject.id}`,
        content: buildMselInjectPopupContent(inject, objectiveLabel),
      },
    })
  }

  if (!feature.rings[0] || feature.rings[0].length < 3) {
    return null
  }

  return new Graphic({
    geometry: {
      type: 'polygon',
      rings: feature.rings,
    },
    symbol: {
      type: 'simple-fill',
      color: [168, 85, 247, 0.25],
      outline: {
        color: [168, 85, 247, 0.95],
        width: 1.6,
      },
    },
    attributes,
    popupTemplate: {
      title: inject.inject.trim() || `Inject ${inject.id}`,
      content: buildMselInjectPopupContent(inject, objectiveLabel),
    },
  })
}

/** @deprecated Use createMselInjectFeatureGraphic */
export function createMselInjectGraphic(
  inject: MselInject,
  objectives: ExerciseMselState['objectives']
): Graphic | null {
  const features = getInjectMapFeatures(inject)
  const firstFeature = features[0]
  if (!firstFeature) {
    return null
  }
  return createMselInjectFeatureGraphic(inject, firstFeature, objectives)
}

export function syncMselInjectGraphics(
  layer: GraphicsLayer,
  injects: MselInject[],
  objectives: ExerciseMselState['objectives']
): globalThis.Map<string, Graphic> {
  layer.removeAll()
  const graphicsByKey = new globalThis.Map<string, Graphic>()

  for (const inject of injects) {
    for (const feature of getInjectMapFeatures(inject)) {
      const graphic = createMselInjectFeatureGraphic(inject, feature, objectives)
      if (!graphic) {
        continue
      }
      layer.add(graphic)
      graphicsByKey.set(`${inject.id}:${feature.id}`, graphic)
    }
  }

  return graphicsByKey
}

export function isMselInjectGraphicHit(attributes: Record<string, unknown> | undefined): boolean {
  return attributes?.kind === MSEL_INJECT_MAP_KIND && typeof attributes.injectId === 'number'
}
