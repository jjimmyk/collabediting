import {
  getSingleResourceRosterMembers,
  SINGLE_RESOURCE_POSITION_LABEL,
} from '../src/lib/roster-member-assignment'
import { validateMemberOrgChartReportsTo } from '../src/features/roster/workspace-member-org-chart'
import { emptyWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const catalog = emptyWorkspacePositionCatalog()
catalog.allPositionNames.push('Incident Commander', 'Staging Area Manager')
catalog.rosterPositionNames.push('Incident Commander', 'Staging Area Manager')

assert(
  validateMemberOrgChartReportsTo('Incident Commander', catalog) === null,
  'valid reports-to should pass'
)
assert(
  validateMemberOrgChartReportsTo('Unknown Position', catalog) !== null,
  'invalid reports-to should fail'
)

const roster: WorkspaceRosterMember[] = [
  {
    id: '1',
    email: 'alpha@example.gov',
    icsPosition: SINGLE_RESOURCE_POSITION_LABEL,
    icsPositions: [],
    assignmentKind: 'single_resource',
    orgChartReportsTo: 'Incident Commander',
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-1',
  },
  {
    id: '2',
    email: 'beta@example.gov',
    icsPosition: 'Incident Commander',
    icsPositions: ['Incident Commander'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-2',
  },
]

const singleResources = getSingleResourceRosterMembers(roster)
assert(singleResources.length === 1, 'only single-resource members should be selected')
assert(singleResources[0]?.email === 'alpha@example.gov', 'single resource email')

console.log('verify-add-workspace-member: all checks passed')
