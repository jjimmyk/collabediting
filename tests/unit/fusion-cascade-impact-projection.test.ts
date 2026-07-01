import { describe, expect, it } from 'vitest'
import {
  formatFusionCascadeHourLabel,
  getFusionCascadeImpactProgress,
  getFusionCascadeImpactProjection,
  impactScoreToArcWidth,
} from '@/features/hub/fusion-centers/fusion-cascade-impact-projection'

describe('fusion-cascade-impact-projection', () => {
  it('formats trajectory hour labels as T+Nh', () => {
    expect(formatFusionCascadeHourLabel(0)).toBe('T+0h')
    expect(formatFusionCascadeHourLabel(6)).toBe('T+6h')
  })

  it('ramps energy sector impact toward the 6-hour milestone', () => {
    expect(getFusionCascadeImpactProgress('PHT-ENRG-003', 0)).toBe(0)
    expect(getFusionCascadeImpactProgress('PHT-ENRG-003', 3)).toBeCloseTo(0.5)
    expect(getFusionCascadeImpactProgress('PHT-ENRG-003', 6)).toBe(1)
  })

  it('returns stronger projections after milestone hours', () => {
    const early = getFusionCascadeImpactProjection('PHT-TRAN-004', 4)
    const late = getFusionCascadeImpactProjection('PHT-TRAN-004', 12)
    expect(late.impactScore).toBeGreaterThan(early.impactScore)
    expect(late.status).toBe('HIGH RISK')
  })

  it('maps impact score to arc width', () => {
    expect(impactScoreToArcWidth(0)).toBe(1)
    expect(impactScoreToArcWidth(78)).toBeGreaterThan(impactScoreToArcWidth(10))
  })
})
