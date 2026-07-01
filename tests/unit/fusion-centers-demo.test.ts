import { describe, expect, it } from 'vitest'
import {
  FUSION_CENTERS_SCENARIO_NARRATIVE,
  FUSION_PRIMARY_NOTIFICATION,
  getPrimaryNotificationSeed,
  USCG_PRIMARY_NOTIFICATION,
} from '@/data/fusion-centers-demo'

describe('fusion-centers-demo', () => {
  it('returns Garyville content for USCG mode', () => {
    const seed = getPrimaryNotificationSeed(false)
    expect(seed.title).toContain('Garyville')
    expect(seed.title).toBe(USCG_PRIMARY_NOTIFICATION.title)
  })

  it('returns Port of Houston cyber content for fusion mode', () => {
    const seed = getPrimaryNotificationSeed(true)
    expect(seed.title).toContain('Barbours Cut Terminal')
    expect(seed.summary).toContain('APT41')
    expect(seed.summary).toBe(FUSION_CENTERS_SCENARIO_NARRATIVE)
    expect(seed.regionalThreats?.responseChecklist.length).toBeGreaterThanOrEqual(4)
  })

  it('includes cascade timeline in fusion impact text', () => {
    expect(FUSION_PRIMARY_NOTIFICATION.impact).toContain('Energy sector at risk within 6 hours')
    expect(FUSION_PRIMARY_NOTIFICATION.impact).toContain('Food supply 24 hours')
  })
})
