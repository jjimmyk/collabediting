import { describe, expect, it } from 'vitest'
import {
  assetEffectiveWhenLabels,
  memberEffectiveWhenLabels,
  resolveRosterSchedulingPhase,
  showsRosterEffectiveWhenUi,
} from '../../src/lib/roster-scheduling-phase'

describe('resolveRosterSchedulingPhase', () => {
  it('returns pre_first_op before any operational period has started', () => {
    expect(resolveRosterSchedulingPhase(0)).toBe('pre_first_op')
  })

  it('returns live_ops after the first operational period has started', () => {
    expect(resolveRosterSchedulingPhase(1)).toBe('live_ops')
    expect(resolveRosterSchedulingPhase(3)).toBe('live_ops')
  })
})

describe('memberEffectiveWhenLabels', () => {
  it('uses first-OP copy before operational period 1', () => {
    const labels = memberEffectiveWhenLabels('pre_first_op')
    expect(labels.nowTitle).toBe('Add to roster now')
    expect(labels.nextOpTitle).toBe('Add to roster on first operational period')
  })

  it('uses current/next period copy after operational period 1', () => {
    const labels = memberEffectiveWhenLabels('live_ops')
    expect(labels.nowTitle).toBe('Now (current period)')
    expect(labels.nextOpTitle).toBe('Next operational period')
  })
})

describe('assetEffectiveWhenLabels', () => {
  it('uses first-OP asset copy before operational period 1', () => {
    const labels = assetEffectiveWhenLabels('pre_first_op')
    expect(labels.nowTitle).toBe('Add to roster now')
    expect(labels.nextOpTitle).toBe('Add to roster on first operational period')
  })
})

describe('showsRosterEffectiveWhenUi', () => {
  it('shows scheduling UI in Build Team when Supabase is enabled', () => {
    expect(
      showsRosterEffectiveWhenUi({
        rosterSchedulingPhase: 'pre_first_op',
        operationalPeriodsEnabled: false,
        isSupabaseEnabled: true,
      })
    ).toBe(true)
  })

  it('hides scheduling UI when Supabase is disabled', () => {
    expect(
      showsRosterEffectiveWhenUi({
        rosterSchedulingPhase: 'pre_first_op',
        operationalPeriodsEnabled: false,
        isSupabaseEnabled: false,
      })
    ).toBe(false)
  })
})
