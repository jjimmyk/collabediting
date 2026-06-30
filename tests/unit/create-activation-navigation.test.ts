import { describe, expect, it } from 'vitest'
import {
  CREATE_EXERCISE_ACTIVATION_STEP,
  CREATE_INCIDENT_ACTIVATION_STEP,
  getActivationStepIndex,
  isActivationStep,
  isBuildTeamActivationStep,
} from '@/lib/create-activation-navigation'

describe('create-activation-navigation', () => {
  it('defines incident step indices with ICS-201 after initial report', () => {
    expect(CREATE_INCIDENT_ACTIVATION_STEP).toEqual({
      nameLocation: 0,
      initialReport: 1,
      ics201: 2,
      buildTeam: 3,
      scheduleMeetings: 4,
      notifications: 5,
    })
  })

  it('defines exercise step indices with ICS-201 after initial exercise report', () => {
    expect(CREATE_EXERCISE_ACTIVATION_STEP).toEqual({
      nameLocation: 0,
      objectives: 1,
      initialReport: 2,
      ics201: 3,
      buildTeam: 4,
      scheduleMeetings: 5,
      notifications: 6,
      msel: 7,
    })
  })

  it('identifies build team step after ICS-201', () => {
    expect(isBuildTeamActivationStep('incident', 3)).toBe(true)
    expect(isBuildTeamActivationStep('incident', 2)).toBe(false)
    expect(isBuildTeamActivationStep('exercise', 4)).toBe(true)
    expect(isBuildTeamActivationStep('exercise', 3)).toBe(false)
  })

  it('resolves activation step keys by kind', () => {
    expect(getActivationStepIndex('incident', 'ics201')).toBe(2)
    expect(getActivationStepIndex('exercise', 'ics201')).toBe(3)
    expect(isActivationStep('incident', 2, 'ics201')).toBe(true)
    expect(isActivationStep('exercise', 7, 'msel')).toBe(true)
  })
})
