import { describe, expect, it } from 'vitest'
import {
  FUSION_CASCADE_SCENARIO,
  getConsequenceMapExtent,
  sectorImpactRadius,
  statusToSvgPaint,
  statusToTailwindClass,
  FUSION_CASCADE_LAYER_DEFINITION,
} from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'

describe('fusion-cascade-scenario-data', () => {
  it('defines hub and four sector nodes with spec coordinates', () => {
    expect(FUSION_CASCADE_SCENARIO.hub).toMatchObject({
      name: 'Port of Houston',
      coordinates: [-95.1411, 29.7438],
      status: 'ENCRYPTED',
    })
    expect(FUSION_CASCADE_SCENARIO.sectors).toHaveLength(4)
    expect(FUSION_CASCADE_SCENARIO.sectors[0]).toMatchObject({
      name: 'Energy Sector',
      coordinates: [-93.9399, 29.9861],
      impactScore: 78,
      countdown: '06:00:00',
      status: 'CRITICAL',
    })
    expect(FUSION_CASCADE_SCENARIO.sectors[1]).toMatchObject({
      name: 'Transportation',
      coordinates: [-95.3698, 29.7604],
      impactScore: 62,
      countdown: '12:00:00',
      status: 'HIGH RISK',
    })
    expect(FUSION_CASCADE_SCENARIO.sectors[2]).toMatchObject({
      name: 'Defense Logistics',
      coordinates: [-94.6835, 29.3013],
      impactScore: 55,
      countdown: '18:00:00',
      status: 'ELEVATED',
    })
    expect(FUSION_CASCADE_SCENARIO.sectors[3]).toMatchObject({
      name: 'Food & Ag',
      coordinates: [-96.3344, 30.628],
      impactScore: 31,
      countdown: '24:00:00',
      status: 'MONITORED',
    })
  })

  it('computes map extent covering all nodes', () => {
    const extent = getConsequenceMapExtent()
    expect(extent.center[0]).toBeGreaterThan(-96.5)
    expect(extent.center[0]).toBeLessThan(-93.5)
    expect(extent.center[1]).toBeGreaterThan(29)
    expect(extent.center[1]).toBeLessThan(31)
    expect(extent.zoom).toBe(8)
  })

  it('maps status to theme-compatible tailwind classes', () => {
    expect(statusToTailwindClass('CRITICAL')).toContain('destructive')
    expect(statusToTailwindClass('MONITORED')).toContain('muted-foreground')
  })

  it('maps status to CSS variable SVG paint', () => {
    expect(statusToSvgPaint('CRITICAL')).toEqual({
      stroke: 'var(--destructive)',
      fill: 'var(--background)',
    })
    expect(statusToSvgPaint('HIGH RISK').stroke).toBe('var(--color-amber-500)')
    expect(statusToSvgPaint('MONITORED').stroke).toBe('var(--muted-foreground)')
  })

  it('defines fusion cascade map layer catalog entry', () => {
    expect(FUSION_CASCADE_LAYER_DEFINITION.id).toBe('fusion-cascade-impacts')
    expect(FUSION_CASCADE_LAYER_DEFINITION.label).toContain('Cascading Impacts')
  })

  it('scales sector radius with impact score', () => {
    expect(sectorImpactRadius(78)).toBeGreaterThan(sectorImpactRadius(31))
  })
})
