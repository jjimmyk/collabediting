import { describe, expect, it } from 'vitest'
import {
  isSelectableOrgMember,
  orgMemberStatusLabel,
} from '../../src/features/roster/position-member-assign-picker'
import { assignExistingMembersEmptyMessage } from '../../src/features/roster/position-roster-messages'
import type { PositionRosterEntry } from '../../src/features/roster/workspace-position-roster'

describe('orgMemberStatusLabel pre_workspace mode', () => {
  it('does not show already on roster in pre_workspace mode', () => {
    expect(
      orgMemberStatusLabel(
        { id: 'user-1', alreadyOnRoster: true, canAdd: true },
        'pre_workspace'
      )
    ).toBeNull()
  })
})

describe('isSelectableOrgMember add_to_roster mode', () => {
  it('blocks members already on roster in live add flow', () => {
    expect(
      isSelectableOrgMember(
        { id: 'user-1', alreadyOnRoster: true, canAdd: true },
        'add_to_roster'
      )
    ).toBe(false)
  })
})

describe('assignExistingMembersEmptyMessage', () => {
  const emptyEntry = {
    position: 'Safety Officer',
    members: [],
    assets: [],
    isPlanned: false,
  } as PositionRosterEntry

  it('prefers org search guidance when org search is enabled', () => {
    expect(
      assignExistingMembersEmptyMessage(emptyEntry, 0, {
        rosterSchedulingPhase: 'pre_first_op',
        orgSearchEnabled: true,
      })
    ).toBe('Use Existing Person above to add someone from your organization.')
  })

  it('falls back to roster-only empty copy when org search is unavailable', () => {
    expect(assignExistingMembersEmptyMessage(emptyEntry, 0)).toBe(
      'No roster members available to assign.'
    )
  })
})
