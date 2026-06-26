import { describe, expect, it } from 'vitest'
import {
  buildExerciseMselFromParts,
  buildMselInjectPopupContent,
  defaultExerciseMselState,
  getExerciseObjectiveLabel,
  getInjectMapFeatures,
  normalizeExerciseMselState,
} from '@/features/exercise-msel/msel-utils'
import {
  buildMselInjectGraphicAttributes,
  createMselInjectGraphic,
  isMselInjectGraphicHit,
} from '@/features/exercise-msel/msel-map-utils'
import { MSEL_INJECT_MAP_KIND } from '@/features/exercise-msel/types'

describe('exercise-msel utils', () => {
  it('normalizes malformed exercise MSEL metadata to defaults', () => {
    const normalized = normalizeExerciseMselState(null)
    expect(normalized.objectives.length).toBeGreaterThan(0)
    expect(normalized.injects.length).toBeGreaterThan(0)
    expect('mode' in normalized).toBe(false)
  })

  it('builds exercise MSEL state from wizard parts', () => {
    const state = buildExerciseMselFromParts({
      objectives: [{ id: 2, name: 'Unified command' }],
      injects: [
        {
          id: 3,
          objectiveId: 2,
          scheduledTime: '2026-06-22T10:00',
          category: 'Operations',
          inject: 'Bridge outage reported',
          expectedAction: 'Activate IMT',
          mapLocation: [-97.74, 30.27],
        },
      ],
    })

    expect(state.injects[0].mapLocation).toEqual([-97.74, 30.27])
    expect(getInjectMapFeatures(state.injects[0])).toHaveLength(1)
    expect('mode' in state).toBe(false)
  })

  it('escapes HTML in popup content', () => {
    const html = buildMselInjectPopupContent(
      {
        id: 1,
        objectiveId: 1,
        scheduledTime: '',
        category: '<Ops>',
        inject: '<script>alert(1)</script>',
        expectedAction: 'Respond & coordinate',
      },
      'Objective <A>'
    )

    expect(html).toContain('&lt;Ops&gt;')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('Respond &amp; coordinate')
    expect(html).toContain('Objective &lt;A&gt;')
  })

  it('labels objectives consistently', () => {
    expect(
      getExerciseObjectiveLabel([{ id: 1, name: '  ' }], 1)
    ).toBe('Untitled objective')
    expect(getExerciseObjectiveLabel([], 1)).toBe('Unknown objective')
  })
})

describe('exercise-msel map utils', () => {
  it('creates graphics for point map features', () => {
    const inject = {
      id: 4,
      objectiveId: 1,
      scheduledTime: '10:00',
      category: 'Operations',
      inject: 'Power outage',
      expectedAction: 'Assess grid',
      mapFeatures: [
        {
          id: 'point-1',
          type: 'point' as const,
          coordinates: [-95.36, 29.76] as [number, number],
        },
      ],
      mapLocation: [-95.36, 29.76] as [number, number],
    }
    const attributes = buildMselInjectGraphicAttributes(inject, 'Life safety', inject.mapFeatures![0])

    expect(attributes.kind).toBe(MSEL_INJECT_MAP_KIND)
    expect(attributes.injectId).toBe(4)
    expect(attributes.objective).toBe('Life safety')
  })

  it('skips inject graphics without map coordinates', () => {
    expect(
      createMselInjectGraphic(
        {
          id: 1,
          objectiveId: null,
          scheduledTime: '',
          category: 'Operations',
          inject: '',
          expectedAction: '',
          mapFeatures: [],
          mapLocation: null,
        },
        defaultExerciseMselState().objectives
      )
    ).toBeNull()
  })

  it('detects msel inject graphic hits', () => {
    expect(isMselInjectGraphicHit({ kind: MSEL_INJECT_MAP_KIND, injectId: 9 })).toBe(true)
    expect(isMselInjectGraphicHit({ kind: 'Asset', injectId: 9 })).toBe(false)
  })
})
