import Graphic from '@arcgis/core/Graphic'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type Point from '@arcgis/core/geometry/Point'
import type { ExerciseMselState, MselInject } from './types'
import { MSEL_INJECT_MAP_KIND } from './types'
import {
  buildMselInjectPopupContent,
  getExerciseObjectiveLabel,
} from './msel-utils'

export function buildMselInjectGraphicAttributes(
  inject: MselInject,
  objectiveLabel: string
): Record<string, string | number> {
  return {
    mapKey: `msel-inject-${inject.id}`,
    kind: MSEL_INJECT_MAP_KIND,
    injectId: inject.id,
    title: inject.inject.trim() || `Inject ${inject.id}`,
    scheduledTime: inject.scheduledTime.trim() || 'Not set',
    category: inject.category.trim() || 'Uncategorized',
    objective: objectiveLabel,
    injectText: inject.inject.trim() || 'No inject text',
    expectedAction: inject.expectedAction.trim() || 'No expected action',
  }
}

export function createMselInjectGraphic(
  inject: MselInject,
  objectives: ExerciseMselState['objectives']
): Graphic | null {
  if (!inject.mapLocation) {
    return null
  }

  const [longitude, latitude] = inject.mapLocation
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null
  }

  const objectiveLabel = getExerciseObjectiveLabel(objectives, inject.objectiveId)

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
    attributes: buildMselInjectGraphicAttributes(inject, objectiveLabel),
    popupTemplate: {
      title: inject.inject.trim() || `Inject ${inject.id}`,
      content: buildMselInjectPopupContent(inject, objectiveLabel),
    },
  })
}

export function syncMselInjectGraphics(
  layer: GraphicsLayer,
  injects: MselInject[],
  objectives: ExerciseMselState['objectives']
): globalThis.Map<number, Graphic> {
  layer.removeAll()
  const graphicsByInjectId = new globalThis.Map<number, Graphic>()

  for (const inject of injects) {
    const graphic = createMselInjectGraphic(inject, objectives)
    if (!graphic) {
      continue
    }
    layer.add(graphic)
    graphicsByInjectId.set(inject.id, graphic)
  }

  return graphicsByInjectId
}

export function isMselInjectGraphicHit(attributes: Record<string, unknown> | undefined): boolean {
  return attributes?.kind === MSEL_INJECT_MAP_KIND && typeof attributes.injectId === 'number'
}
