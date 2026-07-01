import { describe, expect, it } from 'vitest'
import {
  advancePacketAnimation,
  buildCurvedLinkPath,
  buildScenarioLinkPaths,
  projectScenarioToScreen,
} from '@/features/hub/fusion-centers/consequence-engine-overlay-draw'
import { FUSION_CASCADE_SCENARIO, sectorImpactRadius } from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'

describe('consequence-engine-overlay-draw', () => {
  it('projects scenario coordinates through a mock projector', () => {
    const projectFn = (coord: readonly [number, number]) => ({
      x: coord[0] * 10,
      y: coord[1] * 10,
    })
    const projected = projectScenarioToScreen(FUSION_CASCADE_SCENARIO, projectFn)
    expect(projected).not.toBeNull()
    expect(projected?.hub.x).toBeCloseTo(-951.411)
    expect(projected?.sectors).toHaveLength(4)
  })

  it('builds curved link paths for each sector', () => {
    const projected = projectScenarioToScreen(FUSION_CASCADE_SCENARIO, (coord) => ({
      x: coord[0] * 100,
      y: coord[1] * 100,
    }))
    expect(projected).not.toBeNull()
    if (!projected) {
      return
    }
    const links = buildScenarioLinkPaths(projected)
    expect(links).toHaveLength(4)
    links.forEach((link) => {
      expect(link.pathD.length).toBeGreaterThan(0)
      expect(link.length).toBeGreaterThan(0)
    })
  })

  it('builds a curved path between hub and sector screen points', () => {
    const link = buildCurvedLinkPath({ x: 100, y: 100 }, { x: 300, y: 200 })
    expect(link.pathD).toContain('M')
    expect(link.length).toBeGreaterThan(0)
  })

  it('advances packet animation phase', () => {
    expect(advancePacketAnimation(0)).toBeGreaterThan(0)
    expect(advancePacketAnimation(999)).toBeLessThan(1000)
  })

  it('scales impact radius with score', () => {
    expect(sectorImpactRadius(78)).toBeCloseTo(13.75)
    expect(sectorImpactRadius(31)).toBeCloseTo(7.875)
  })
})
