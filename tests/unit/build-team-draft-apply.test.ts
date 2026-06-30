import { describe, expect, it } from 'vitest'
import {
  buildDraftAssignableByPosition,
  buildDraftMemberSchedulesByPosition,
  buildDraftPositionCatalog,
  buildDraftRosterMembers,
} from '../../src/features/roster/build-draft-position-catalog'
import { createBuildTeamRosterDraftFromTemplate } from '../../src/features/roster/roster-draft-state'
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

describe('buildDraftMemberSchedulesByPosition', () => {
  it('maps next_op_advance draft members into scheduled assign columns', () => {
    const draft = createBuildTeamRosterDraftFromTemplate('ics-type-3')
    const scheduledMember = {
      id: 'draft-member-scheduled',
      email: 'scheduled@example.com',
      assignmentKind: 'ics_position' as const,
      icsPositions: ['Safety Officer'],
      orgChartReportsTo: null,
      password: '',
      personSource: 'add_existing' as const,
      existingUserId: 'user-scheduled',
      effectiveWhen: 'next_op_advance' as const,
      competencyFunction: null,
    }
    const draftWithSchedule = {
      ...draft,
      draftMembers: [...draft.draftMembers, scheduledMember],
    }

    expect(buildDraftMemberSchedulesByPosition(draftWithSchedule)).toEqual({
      'Safety Officer': {
        assignMemberIds: ['draft-member-scheduled'],
        unassignMemberIds: [],
      },
    })
  })

  it('omits scheduled positions from active roster projection', () => {
    const draft = createBuildTeamRosterDraftFromTemplate('ics-type-3')
    const scheduledMember = {
      id: 'draft-member-scheduled',
      email: 'scheduled@example.com',
      assignmentKind: 'ics_position' as const,
      icsPositions: ['Safety Officer'],
      orgChartReportsTo: null,
      password: '',
      personSource: 'add_existing' as const,
      existingUserId: 'user-scheduled',
      effectiveWhen: 'next_op_advance' as const,
      competencyFunction: null,
    }
    const draftWithSchedule = {
      ...draft,
      draftMembers: [...draft.draftMembers, scheduledMember],
    }

    const rosterMember = buildDraftRosterMembers(draftWithSchedule).find(
      (member) => member.id === 'draft-member-scheduled'
    )
    expect(rosterMember?.icsPositions).toEqual([])
  })
})

describe('buildDraftAssignableByPosition', () => {
  it('includes unassigned draft roster members for a position', () => {
    const draft = createBuildTeamRosterDraftFromTemplate('ics-type-3')
    const extraMember = {
      id: 'draft-member-extra',
      email: 'extra@example.com',
      assignmentKind: 'ics_position' as const,
      icsPositions: ['Operations Section Chief'],
      orgChartReportsTo: null,
      password: '',
      personSource: 'add_existing' as const,
      existingUserId: 'user-extra',
      effectiveWhen: 'now' as const,
      competencyFunction: null,
    }
    const draftWithExtra = {
      ...draft,
      draftMembers: [...draft.draftMembers, extraMember],
    }
    const catalog = buildDraftPositionCatalog(draftWithExtra)
    const assignable = buildDraftAssignableByPosition(draftWithExtra, catalog)

    expect(assignable['Safety Officer']?.map((member) => member.id)).toContain(
      'draft-member-extra'
    )
  })
})
