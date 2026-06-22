import { isPositionAssignSelectionValid } from '../src/features/roster/PositionMemberAssignList'
import { rosterMembersAssignableToPosition } from '../src/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const roster: WorkspaceRosterMember[] = [
  {
    id: 'member-a',
    email: 'alpha@example.gov',
    icsPosition: 'Planning Section Chief',
    icsPositions: ['Planning Section Chief'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-alpha',
  },
  {
    id: 'member-b',
    email: 'beta@example.gov',
    icsPosition: 'Incident Commander',
    icsPositions: ['Incident Commander'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-beta',
  },
]

const assignableForIc = rosterMembersAssignableToPosition(roster, 'Incident Commander', [])

assert(
  assignableForIc.some((member) => member.id === 'member-a'),
  'roster member on another position should appear in assign-to-IC list'
)
assert(
  !assignableForIc.some((member) => member.id === 'member-b'),
  'member already on Incident Commander should not appear in assignable list'
)

assert(
  isPositionAssignSelectionValid({
    rosterMemberId: 'member-a',
    userId: 'user-alpha',
    email: 'alpha@example.gov',
  }),
  'roster member selection is valid'
)
assert(
  isPositionAssignSelectionValid({
    rosterMemberId: null,
    userId: 'user-delta',
    email: 'delta@example.gov',
  }),
  'org member selection is valid'
)
assert(!isPositionAssignSelectionValid(null), 'null selection is invalid')

console.log('verify-position-assign-dialog: all checks passed')
