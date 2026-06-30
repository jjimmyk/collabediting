import { describe, expect, it } from 'vitest'
import {
  buildTeamCustomPositionLifecycleStatus,
  buildTeamMemberScheduleOnOpAdvance,
} from '../../api/roster-plan-shared'
import {
  dedupeOrgSearchResultsAgainstDraftMembers,
  isSelectableOrgMember,
} from '../../src/features/roster/position-member-assign-picker'

describe('buildTeamMemberScheduleOnOpAdvance', () => {
  it('maps next_op_advance to scheduleOnOpAdvance', () => {
    expect(buildTeamMemberScheduleOnOpAdvance({ effectiveWhen: 'next_op_advance' })).toBe(true)
    expect(buildTeamMemberScheduleOnOpAdvance({ effectiveWhen: 'now' })).toBe(false)
  })
})

describe('buildTeamCustomPositionLifecycleStatus', () => {
  it('marks first-OP custom positions as planned_create', () => {
    expect(buildTeamCustomPositionLifecycleStatus({ createOnFirstOpPeriod: true })).toBe(
      'planned_create'
    )
    expect(buildTeamCustomPositionLifecycleStatus({ createOnFirstOpPeriod: false })).toBe('active')
  })
})

describe('isSelectableOrgMember pre_workspace mode', () => {
  it('ignores alreadyOnRoster in pre_workspace mode', () => {
    expect(
      isSelectableOrgMember(
        { id: 'user-1', alreadyOnRoster: true, canAdd: true },
        'pre_workspace'
      )
    ).toBe(true)
  })

  it('still requires a sign-in account', () => {
    expect(
      isSelectableOrgMember({ id: null, alreadyOnRoster: false, canAdd: true }, 'pre_workspace')
    ).toBe(false)
  })
})

describe('dedupeOrgSearchResultsAgainstDraftMembers', () => {
  it('excludes draft members and position assignments from org search', () => {
    const results = dedupeOrgSearchResultsAgainstDraftMembers(
      [
        {
          id: 'user-1',
          email: 'alpha@example.com',
          fullName: 'Alpha',
          qualifications: [],
        },
        {
          id: 'user-2',
          email: 'beta@example.com',
          fullName: 'Beta',
          qualifications: [],
        },
      ],
      [
        {
          email: 'alpha@example.com',
          existingUserId: 'user-1',
          icsPositions: ['Operations Section Chief'],
          assignmentKind: 'ics_position',
        },
      ],
      'Operations Section Chief'
    )

    expect(results.map((result) => result.email)).toEqual(['beta@example.com'])
  })
})
