import { describe, expect, it } from 'vitest'
import {
  isSelectableOrgMember,
  orgMemberStatusLabel,
} from '../../src/features/roster/position-member-assign-picker'

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
