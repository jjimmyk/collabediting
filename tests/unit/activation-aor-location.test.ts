import { describe, expect, it } from 'vitest'
import {
  findNearestDistrictName,
  findNearestDistrictNodeId,
  formatActivationAorLabels,
  formatAorLocationGeometrySummary,
  matchAorsFromLocationText,
  parseGeometrySummaryCoordinates,
  resolveActivationAorRegionLabel,
  resolveAorNodeCoordinates,
  resolveAorNodeDistrictName,
  resolveAutoFilledAors,
  resolveWorkspaceCoordinates,
} from '@/lib/activation-aor-location'

describe('activation-aor-location', () => {
  it('resolves hierarchy node coordinates with district fallback', () => {
    expect(resolveAorNodeCoordinates('sector-virginia')).toEqual([-76.3, 36.84])
    expect(resolveAorNodeDistrictName('sector-virginia')).toBe(
      'USCG District 5 — Mid-Atlantic'
    )
  })

  it('resolves district node coordinates directly', () => {
    expect(resolveAorNodeCoordinates('district-4')).toEqual([-84.5, 32.5])
    expect(resolveAorNodeDistrictName('district-4')).toBe('USCG District 7 — Southeast')
  })

  it('formats AOR geometry summaries with lat/lng ordering', () => {
    expect(formatAorLocationGeometrySummary('Sector Virginia', [-76.3, 36.84])).toBe(
      'AOR: Sector Virginia (36.84000, -76.30000)'
    )
  })

  it('matches hierarchy and district node IDs from free text', () => {
    expect(matchAorsFromLocationText('Response staging near Atlanta District 7')).toEqual([
      'district-4',
    ])
    expect(matchAorsFromLocationText('Sector Virginia port operations')).toEqual([
      'sector-virginia',
    ])
  })

  it('finds nearest district node ID and name for gulf coordinates', () => {
    expect(findNearestDistrictNodeId(-97.0, 32.0)).toBe('district-6')
    expect(findNearestDistrictName(-97.0, 32.0)).toBe('USCG District 8 — Gulf')
  })

  it('formats activation AOR labels from node IDs', () => {
    expect(formatActivationAorLabels(['sector-virginia', 'district-4'])).toEqual([
      'Sector Virginia',
      'USCG District 7 — Southeast',
    ])
    expect(resolveActivationAorRegionLabel(['sector-virginia'])).toBe('Sector Virginia')
    expect(resolveActivationAorRegionLabel([])).toBe('Unassigned AOR')
  })

  it('parses geometry summary coordinates', () => {
    expect(parseGeometrySummaryCoordinates('Point selected at 32.00000, -97.00000')).toEqual({
      lat: 32,
      lng: -97,
    })
  })

  it('resolves workspace coordinates for select-aor', () => {
    expect(
      resolveWorkspaceCoordinates({
        locationMethod: 'select-aor',
        geometrySummary: '',
        address: '',
        aorNodeId: 'district-6',
      })
    ).toEqual([-97.5, 32.5])
  })

  it('autofills AOR node IDs from location method inputs', () => {
    expect(
      resolveAutoFilledAors({
        locationMethod: 'select-aor',
        geometrySummary: '',
        address: '',
        aorNodeId: 'sector-virginia',
      })
    ).toEqual(['sector-virginia'])

    expect(
      resolveAutoFilledAors({
        locationMethod: 'draw-point',
        geometrySummary: 'Point selected at 32.00000, -97.00000',
        address: '',
        aorNodeId: null,
      })
    ).toEqual(['district-6'])
  })
})
