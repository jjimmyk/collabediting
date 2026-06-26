import type { PositionRosterEntry } from '../src/features/roster/workspace-position-roster'
import { emptyWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'
import { buildWorkAssignmentTargetOptions } from '../src/lib/work-assignment-target-options'
import {
  buildWorkAssignmentTarget,
  normalizeWorkAssignmentTargetKey,
  parseWorkAssignmentTarget,
  resolveWorkAssignmentTargetRecipients,
  workAssignmentTargetsEqual,
} from '../src/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const roster: WorkspaceRosterMember[] = [
  {
    id: 'member-alpha',
    email: 'alpha@example.gov',
    icsPosition: 'Division Alpha',
    icsPositions: ['Division Alpha'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-alpha',
    competencyByPosition: { 'Planning Section Chief': 'GIS Specialist' },
  },
  {
    id: 'member-single',
    email: 'contractor@example.gov',
    icsPosition: '',
    icsPositions: [],
    assignmentKind: 'single_resource',
    orgChartReportsTo: 'Operations Section Chief',
    competencyFunction: 'Logistics Support',
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-single',
  },
]

const catalog = emptyWorkspacePositionCatalog()

const positionEntries: PositionRosterEntry[] = [
  {
    position: 'Division Alpha',
    members: [roster[0]!],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    resourceCategories: [],
    memberSchedulePolicy: {
      allowActiveAssignment: true,
      allowScheduleAssign: true,
      allowScheduleUnassign: true,
    },
    editIcs201: true,
    allowWorkAssignment: true,
    positionType: null,
    customTypeLabel: null,
    positionTypeLabel: null,
    isCustom: true,
    opAdvanceLabel: null,
    isPlanned: false,
  },
  {
    position: 'Planning Section Chief',
    members: [],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    resourceCategories: [],
    memberSchedulePolicy: {
      allowActiveAssignment: true,
      allowScheduleAssign: true,
      allowScheduleUnassign: true,
    },
    editIcs201: true,
    allowWorkAssignment: false,
    positionType: null,
    customTypeLabel: null,
    positionTypeLabel: null,
    isCustom: false,
    opAdvanceLabel: null,
    isPlanned: false,
  },
]

const positionTarget = buildWorkAssignmentTarget({
  type: 'position',
  position: 'Division Alpha',
  roster,
})
assert(positionTarget.value === 'position:Division Alpha', 'position encoding')

const legacy = parseWorkAssignmentTarget('Division Alpha', roster)
assert(legacy.type === 'position', 'legacy plain string parses as position')
assert(
  normalizeWorkAssignmentTargetKey('Division Alpha', roster) ===
    normalizeWorkAssignmentTargetKey('position:Division Alpha', roster),
  'legacy and encoded keys match'
)

const roleTarget = buildWorkAssignmentTarget({
  type: 'position_competency',
  position: 'Planning Section Chief',
  competencyFunction: 'GIS Specialist',
  roster,
})
assert(roleTarget.label.includes('GIS Specialist'), 'position role label includes competency')

const memberTarget = buildWorkAssignmentTarget({
  type: 'member',
  memberId: 'member-alpha',
  position: 'Division Alpha',
  competencyFunction: 'Team Lead',
  roster,
})
assert(memberTarget.value.includes('member-alpha'), 'member encoding includes id')

const singleTarget = buildWorkAssignmentTarget({
  type: 'single_resource',
  memberId: 'member-single',
  roster,
})
assert(singleTarget.type === 'single_resource', 'single resource target')

const options = buildWorkAssignmentTargetOptions({
  roster,
  positionEntries,
  catalog,
  competencyOptions: ['GIS Specialist', 'Team Lead'],
})
assert(options.some((option) => option.targetType === 'position'), 'options include positions')
assert(
  !options.some(
    (option) =>
      option.targetType === 'position_competency' &&
      option.label.includes('Planning Section Chief')
  ),
  'planning position roles should be excluded when allow work assignment is off'
)
assert(
  options.some((option) => option.targetType === 'single_resource'),
  'options include single resources under operations'
)
assert(options.some((option) => option.targetType === 'member'), 'options include members')

const positionRecipients = resolveWorkAssignmentTargetRecipients(
  positionTarget.value,
  roster,
  {}
)
assert(positionRecipients.includes('alpha@example.gov'), 'position recipients include assignee')

const memberRecipients = resolveWorkAssignmentTargetRecipients(
  memberTarget.value,
  roster,
  {}
)
assert(
  memberRecipients.length === 1 && memberRecipients[0] === 'alpha@example.gov',
  'member recipient is specific person'
)

assert(
  workAssignmentTargetsEqual('Division Alpha', 'position:Division Alpha', roster),
  'target equality handles legacy values'
)

console.log('verify-work-assignment-target: all checks passed')
