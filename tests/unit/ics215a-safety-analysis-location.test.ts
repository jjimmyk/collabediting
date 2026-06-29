import { describe, expect, it, vi } from 'vitest'
import {
  buildIcs215aLocationsByPosition,
  createDefaultIcs215aLocation,
  formatIcs215aIncidentAreaLabel,
  formatIcs215aLocationSummary,
  getIcs215aLocationMapFeatures,
  hasIcs215aLocationGeometry,
  migrateIncidentArea,
  parsePolygonCoordinatesText,
} from '@/features/ics215a/location-utils'
import { normalizeIcs215aFormState } from '@/features/ics215a/utils'
import { focusMapFeaturesOnView } from '@/lib/map-feature-focus'

describe('ics215a safety analysis location', () => {
  it('migrates legacy incident area strings to custom areas', () => {
    expect(migrateIncidentArea('North sector')).toEqual({
      kind: 'custom',
      name: 'North sector',
    })
  })

  it('normalizes point coordinates into map features', () => {
    const features = getIcs215aLocationMapFeatures({
      method: 'enter-coordinates',
      latitude: '29.7604',
      longitude: '-95.3698',
    })
    expect(features).toHaveLength(1)
    expect(features[0]?.type).toBe('point')
    if (features[0]?.type === 'point') {
      expect(features[0].coordinates).toEqual([-95.3698, 29.7604])
    }
  })

  it('parses polygon coordinate text into a polygon feature', () => {
    const features = parsePolygonCoordinatesText(
      ['-95.3698, 29.7604', '-95.3600, 29.7604', '-95.3600, 29.7500'].join('\n')
    )
    expect(features).toHaveLength(1)
    expect(features[0]?.type).toBe('polygon')
  })

  it('reports geometry availability for coordinates but not address-only rows', () => {
    expect(
      hasIcs215aLocationGeometry({
        method: 'enter-address',
        address: '123 Main St',
      })
    ).toBe(false)
    expect(
      hasIcs215aLocationGeometry({
        method: 'enter-coordinates',
        latitude: '29.7604',
        longitude: '-95.3698',
      })
    ).toBe(true)
  })

  it('groups roster-linked locations by position', () => {
    const index = buildIcs215aLocationsByPosition([
      {
        id: 1,
        incidentArea: { kind: 'roster-position', position: 'Operations Chief' },
        location: {
          method: 'enter-coordinates',
          latitude: '29.7604',
          longitude: '-95.3698',
        },
        hazardsRisks: '',
        mitigations: '',
        riskLevel: '',
        gainLevel: '',
      },
      {
        id: 2,
        incidentArea: { kind: 'custom', name: 'Staging' },
        location: createDefaultIcs215aLocation(),
        hazardsRisks: '',
        mitigations: '',
        riskLevel: '',
        gainLevel: '',
      },
    ])

    expect(index['Operations Chief']).toHaveLength(1)
    expect(index['Operations Chief']?.[0]?.rowId).toBe(1)
    expect(index.Staging).toBeUndefined()
  })

  it('normalizes legacy form snapshots on load', () => {
    const normalized = normalizeIcs215aFormState({
      id: 'test',
      incidentName: '',
      incidentLocation: '',
      preparedDate: '',
      preparedTime: '',
      operationalPeriodDateFrom: '',
      operationalPeriodDateTo: '',
      operationalPeriodTimeFrom: '',
      operationalPeriodTimeTo: '',
      safetyAnalysisRows: [
        {
          id: 1,
          incidentArea: 'Legacy area' as unknown as never,
          hazardsRisks: '',
          mitigations: '',
          riskLevel: '',
          gainLevel: '',
        },
      ],
      preparedByName: '',
      preparedByPositionTitle: '',
      preparedBySignature: '',
      preparedDateTime: '',
    })

    expect(normalized.safetyAnalysisRows[0]?.incidentArea).toEqual({
      kind: 'custom',
      name: 'Legacy area',
    })
    expect(normalized.safetyAnalysisRows[0]?.location.method).toBe('')
  })

  it('formats incident area and location summaries for export', () => {
    expect(
      formatIcs215aIncidentAreaLabel({
        kind: 'roster-position',
        position: 'Safety Officer',
      })
    ).toBe('Safety Officer')
    expect(
      formatIcs215aLocationSummary({
        method: 'enter-coordinates',
        latitude: '29.7604',
        longitude: '-95.3698',
      })
    ).toContain('29.7604')
  })
})

describe('focusMapFeaturesOnView', () => {
  it('zooms to a single point', async () => {
    const goTo = vi.fn().mockResolvedValue(undefined)
    const when = vi.fn().mockResolvedValue(undefined)
    await focusMapFeaturesOnView(
      { goTo, when },
      [
        {
          id: 'point-1',
          type: 'point',
          coordinates: [-95.3698, 29.7604],
        },
      ]
    )
    expect(when).toHaveBeenCalled()
    expect(goTo).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom: 14,
      }),
      { animate: false }
    )
  })

  it('zooms to polygon extent', async () => {
    const goTo = vi.fn().mockResolvedValue(undefined)
    const when = vi.fn().mockResolvedValue(undefined)
    await focusMapFeaturesOnView(
      { goTo, when },
      [
        {
          id: 'polygon-1',
          type: 'polygon',
          rings: [
            [
              [-95.4, 29.7],
              [-95.3, 29.7],
              [-95.3, 29.8],
            ],
          ],
        },
      ]
    )
    expect(when).toHaveBeenCalled()
    expect(goTo).toHaveBeenCalled()
  })
})
