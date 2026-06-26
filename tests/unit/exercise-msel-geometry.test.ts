import { describe, expect, it } from 'vitest'
import { normalizeMselCategory, MSEL_INJECT_CATEGORIES } from '@/features/exercise-msel/constants'
import {
  getInjectMapFeatures,
  getMapFeaturesExtent,
  hasInjectMapGeometry,
  migrateMapLocationToFeatures,
  normalizeInjectMapFeatures,
} from '@/features/exercise-msel/msel-geometry-utils'
import type { MselInject } from '@/features/exercise-msel/types'

describe('msel geometry utils', () => {
  it('migrates legacy mapLocation to mapFeatures', () => {
    const inject: MselInject = {
      id: 1,
      objectiveId: 1,
      scheduledTime: '',
      category: 'Operations',
      inject: 'Test',
      expectedAction: 'Act',
      mapLocation: [-97.74, 30.27],
    }

    const normalized = normalizeInjectMapFeatures(inject)
    expect(normalized.mapFeatures).toHaveLength(1)
    expect(normalized.mapFeatures?.[0]?.type).toBe('point')
    expect(normalized.mapLocation).toEqual([-97.74, 30.27])
    expect(hasInjectMapGeometry(normalized)).toBe(true)
  })

  it('computes extent across points and polygons', () => {
    const features = [
      ...migrateMapLocationToFeatures([-97, 30]),
      {
        id: 'poly-1',
        type: 'polygon' as const,
        rings: [
          [
            [-98, 29],
            [-96, 29],
            [-96, 31],
            [-98, 31],
            [-98, 29],
          ],
        ],
      },
    ]

    const extent = getMapFeaturesExtent(features)
    expect(extent).toEqual({
      xmin: -98,
      ymin: 29,
      xmax: -96,
      ymax: 31,
    })
    expect(getInjectMapFeatures({ mapFeatures: features }).length).toBe(2)
  })
})

describe('msel category constants', () => {
  it('normalizes known and unknown categories', () => {
    expect(normalizeMselCategory('operations')).toBe('Operations')
    expect(normalizeMselCategory('Custom Category')).toBe('Custom Category')
    expect(MSEL_INJECT_CATEGORIES).toContain('Medical')
  })
})
