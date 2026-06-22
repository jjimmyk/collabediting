import {
  isSelectableOrgMember,
  orgMemberStatusLabel,
} from '../src/features/roster/position-member-assign-picker'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(
  isSelectableOrgMember({ id: 'user-1', canAdd: true }),
  'active org member with account should be selectable'
)
assert(
  !isSelectableOrgMember({ id: 'user-1', canAdd: false, alreadyOnRoster: true }),
  'member already on roster should not be selectable'
)
assert(
  !isSelectableOrgMember({ id: null, canAdd: false }),
  'member without account should not be selectable'
)
assert(
  orgMemberStatusLabel({ id: 'user-1', alreadyOnRoster: true }) === 'Already on roster',
  'already-on-roster label'
)
assert(
  orgMemberStatusLabel({ id: null, canAdd: false }) === 'No sign-in account yet',
  'missing account label'
)

console.log('verify-org-member-search: all checks passed')
