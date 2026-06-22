import {
  dedupeOrgSearchResultsAgainstRoster,
  filterMembersBySearchQuery,
  formatMemberPositionSummary,
} from '../src/features/roster/position-member-assign-picker'
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
    icsPosition: 'Incident Commander',
    icsPositions: ['Incident Commander'],
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
    icsPosition: 'Planning Section Chief',
    icsPositions: ['Planning Section Chief', 'Situation Unit Leader'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-beta',
  },
  {
    id: 'member-c',
    email: 'charlie@example.gov',
    icsPosition: 'Operations Section Chief',
    icsPositions: ['Operations Section Chief'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-charlie',
  },
]

const assignableForPlanning = rosterMembersAssignableToPosition(
  roster,
  'Planning Section Chief',
  []
)

assert(
  assignableForPlanning.some((member) => member.id === 'member-a'),
  'member on another position should be assignable to Planning Section Chief'
)
assert(
  !assignableForPlanning.some((member) => member.id === 'member-b'),
  'member already on Planning Section Chief should not be assignable there'
)
assert(
  assignableForPlanning.some((member) => member.id === 'member-c'),
  'member on Operations Section Chief should be assignable to Planning Section Chief'
)

const assignableForSituation = rosterMembersAssignableToPosition(
  roster,
  'Situation Unit Leader',
  []
)

assert(
  !assignableForSituation.some((member) => member.id === 'member-b'),
  'member already on Situation Unit Leader should not be assignable there again'
)
assert(
  assignableForSituation.some((member) => member.id === 'member-a'),
  'member on Incident Commander should be assignable to Situation Unit Leader'
)

const filtered = filterMembersBySearchQuery(roster, 'alpha')
assert(filtered.length === 1 && filtered[0]?.email === 'alpha@example.gov', 'search filter matches email')

const deduped = dedupeOrgSearchResultsAgainstRoster(
  [
    { id: 'user-alpha', email: 'alpha@example.gov', fullName: 'Alpha User' },
    { id: 'user-delta', email: 'delta@example.gov', fullName: 'Delta User' },
  ],
  roster
)

assert(deduped.length === 1 && deduped[0]?.email === 'delta@example.gov', 'org results dedupe against roster')

assert(
  formatMemberPositionSummary(['Planning Section Chief', 'Situation Unit Leader']) ===
    'Planning Section Chief, Situation Unit Leader',
  'multi-position summary joins position names'
)

console.log('verify-multi-position-assignment: all checks passed')
