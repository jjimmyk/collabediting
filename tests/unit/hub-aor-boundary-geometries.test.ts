import { describe, expect, it } from 'vitest'
import {
  hubAorAreaBoundaryId,
  hubAorDistrictBoundaryId,
  hubAorSectorBoundaryId,
  isHubAorBoundaryId,
} from '@/features/hub/aor/aor-boundary-map-keys'
import {
  applyHubAorBoundaryToggle,
  getDescendantHubAorBoundaryIds,
  getHubAorBoundaryCheckState,
  HUB_AOR_BOUNDARY_CATALOG,
} from '@/features/hub/aor/hub-aor-boundary-geometries'
import { centroidBoundingPolygon } from '@/features/hub/aor/hub-aor-boundary-geometries'

describe('hub-aor-boundary-geometries', () => {
  it('builds catalog with areas, districts, and sectors', () => {
    const areas = HUB_AOR_BOUNDARY_CATALOG.filter((entry) => entry.level === 'area')
    const districts = HUB_AOR_BOUNDARY_CATALOG.filter((entry) => entry.level === 'district')
    const sectors = HUB_AOR_BOUNDARY_CATALOG.filter((entry) => entry.level === 'sector')

    expect(areas).toHaveLength(2)
    expect(districts).toHaveLength(10)
    expect(sectors.length).toBeGreaterThan(0)
    expect(new Set(HUB_AOR_BOUNDARY_CATALOG.map((entry) => entry.id)).size).toBe(
      HUB_AOR_BOUNDARY_CATALOG.length
    )
  })

  it('creates closed centroid polygons', () => {
    const rings = centroidBoundingPolygon([-71, 42], 1, 1)
    expect(rings[0][0]).toEqual(rings[0][rings[0].length - 1])
  })

  it('cascades district descendants', () => {
    const districtId = hubAorDistrictBoundaryId(4)
    const descendants = getDescendantHubAorBoundaryIds(districtId)
    expect(descendants.every((entry) => entry.startsWith('hub-aor-sector-'))).toBe(true)
    expect(descendants.length).toBeGreaterThan(0)
  })

  it('applies enable and disable toggles with descendants', () => {
    const areaId = hubAorAreaBoundaryId('atlantic')
    const enabled = applyHubAorBoundaryToggle(new Set(), areaId, true)
    expect(enabled.has(areaId)).toBe(true)
    expect(enabled.size).toBeGreaterThan(2)

    const disabled = applyHubAorBoundaryToggle(enabled, areaId, false)
    expect(disabled.size).toBe(0)
  })

  it('reports indeterminate parent checkbox state', () => {
    const areaId = hubAorAreaBoundaryId('atlantic')
    const districtId = hubAorDistrictBoundaryId(1)
    const enabled = new Set([districtId])

    expect(getHubAorBoundaryCheckState(areaId, enabled)).toBe('indeterminate')
    expect(getHubAorBoundaryCheckState(districtId, enabled)).toBe(true)
  })
})

describe('aor-boundary-map-keys', () => {
  it('validates boundary ids', () => {
    expect(isHubAorBoundaryId(hubAorSectorBoundaryId('sector-boston'))).toBe(true)
    expect(isHubAorBoundaryId('not-a-boundary')).toBe(false)
  })
})
