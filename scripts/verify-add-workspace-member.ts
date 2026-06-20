import {
  getSingleResourceRosterMembers,
  mapEffectiveWhenToInviteMode,
  SINGLE_RESOURCE_POSITION_LABEL,
} from '../src/lib/roster-member-assignment'
import { validateMemberOrgChartReportsTo } from '../src/features/roster/workspace-member-org-chart'
import {
  effectiveWhenSummary,
  validateRosterMemberEffectiveWhen,
} from '../src/features/roster/roster-member-effective-when'
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

assert(
  mapEffectiveWhenToInviteMode('now') === 'assign_now',
  'now maps to assign_now'
)
assert(
  mapEffectiveWhenToInviteMode('next_op_advance') === 'schedule_on_op_advance',
  'next_op_advance maps to schedule_on_op_advance'
)

assert(
  validateRosterMemberEffectiveWhen({
    effectiveWhen: 'next_op_advance',
    assignmentKind: 'ics_position',
    icsPositions: ['Incident Commander', 'Staging Area Manager'],
    orgChartReportsTo: '',
    catalog,
    operationalPeriodsEnabled: true,
  }) !== null,
  'next OP ICS requires exactly one position'
)

assert(
  validateRosterMemberEffectiveWhen({
    effectiveWhen: 'next_op_advance',
    assignmentKind: 'ics_position',
    icsPositions: ['Incident Commander'],
    orgChartReportsTo: '',
    catalog,
    operationalPeriodsEnabled: true,
  }) === null,
  'next OP ICS with one position should pass'
)

assert(
  validateRosterMemberEffectiveWhen({
    effectiveWhen: 'next_op_advance',
    assignmentKind: 'single_resource',
    icsPositions: [],
    orgChartReportsTo: 'Incident Commander',
    catalog,
    operationalPeriodsEnabled: true,
  }) === null,
  'next OP single resource with reports-to should pass'
)

assert(
  effectiveWhenSummary({
    effectiveWhen: 'next_op_advance',
    assignmentKind: 'single_resource',
    icsPositions: [],
    orgChartReportsTo: 'Incident Commander',
  }).includes('Incident Commander'),
  'single resource next OP summary mentions reports-to position'
)

console.log('verify-add-workspace-member: all checks passed')
