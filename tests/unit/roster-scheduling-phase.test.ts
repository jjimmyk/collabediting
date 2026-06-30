import { describe, expect, it } from 'vitest'
import {
  assetEffectiveWhenLabels,
  assignmentSectionLabels,
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

describe('assignmentSectionLabels', () => {
  it('uses first-OP Manage modal section titles before operational period 1', () => {
    const labels = assignmentSectionLabels('pre_first_op')
    expect(labels.timelineNow).toBe('Add to roster now')
    expect(labels.timelineNext).toBe('Add to roster on first operational period')
    expect(labels.assignedNowTitle).toBe('On roster now')
    expect(labels.scheduledAssignTitle).toBe('Scheduled for first operational period')
  })

  it('uses current/next OP section titles after operational period 1', () => {
    const labels = assignmentSectionLabels('live_ops')
    expect(labels.timelineNow).toBe('Current OP')
    expect(labels.timelineNext).toBe('Next OP')
    expect(labels.assignedNowTitle).toBe('Assigned now')
    expect(labels.scheduledAssignTitle).toBe('Scheduled assign (next OP)')
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
