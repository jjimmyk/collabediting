import { describe, expect, it } from 'vitest'
import { removeSingleHubAorBoundaryId } from '@/features/hub/aor/hub-aor-boundary-geometries'
import { hubAorDistrictBoundaryId, hubAorSectorBoundaryId } from '@/features/hub/aor/aor-boundary-map-keys'
import {
  buildHubMapVisibleItems,
  filterHubMapVisibleItems,
} from '@/features/hub/map/hub-map-visible-items'

describe('hub-map-visible-items', () => {
  it('builds visible items from weather and aor ids', () => {
    const items = buildHubMapVisibleItems(
      new Set(['radar-base-reflectivity']),
      new Set([hubAorDistrictBoundaryId(4)])
    )

    expect(items).toHaveLength(2)
    expect(items.some((item) => item.kind === 'map-layer' && item.typeLabel === 'Map Layer')).toBe(
      true
    )
    expect(items.some((item) => item.kind === 'aor-district')).toBe(true)
  })

  it('sorts aor items before weather items', () => {
    const items = buildHubMapVisibleItems(
      new Set(['radar-base-reflectivity']),
      new Set([hubAorDistrictBoundaryId(1)])
    )

    expect(items[0]?.source).toBe('aor')
    expect(items[1]?.source).toBe('weather')
  })

  it('filters items by label and type', () => {
    const items = buildHubMapVisibleItems(
      new Set(['radar-base-reflectivity', 'wwa-warnings']),
      new Set([hubAorDistrictBoundaryId(4), hubAorSectorBoundaryId('sector-miami')])
    )

    const filtered = filterHubMapVisibleItems(items, 'radar')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.label).toContain('Reflectivity')
  })

  it('includes geospatial cop ais layer when enabled', () => {
    const items = buildHubMapVisibleItems(new Set(), new Set(), {}, true)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: 'ais-vessel-tracks',
      label: 'AIS',
      kind: 'map-layer',
      typeLabel: 'Map Layer',
      source: 'geospatial-cop',
    })
  })

  it('removes a single aor boundary without cascading', () => {
    const districtId = hubAorDistrictBoundaryId(4)
    const sectorId = hubAorSectorBoundaryId('sector-miami')
    const next = removeSingleHubAorBoundaryId(new Set([districtId, sectorId]), sectorId)

    expect(next.has(sectorId)).toBe(false)
    expect(next.has(districtId)).toBe(true)
  })
})
