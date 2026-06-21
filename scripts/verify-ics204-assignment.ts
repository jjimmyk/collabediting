import {
  buildIcs204AssignedUnitOptions,
  classifyIcs204AssignedUnitOption,
  isIcs204AssignedUnitSelectable,
  resolveIcs204AssignedUnitRecipients,
} from '../src/features/ics204/ics204-assigned-unit-options'
import {
  buildIcs204AssignmentNotificationSummary,
  buildIcs204AssignmentNotificationTitle,
} from '../src/features/ics204/ics204-assignment-notifications'
import type { PositionRosterEntry } from '../src/features/roster/workspace-position-roster'
import type { Ics204FormState } from '../src/features/ics204/types'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function rosterEntry(overrides: Partial<PositionRosterEntry> & Pick<PositionRosterEntry, 'position'>): PositionRosterEntry {
  return {
    members: [],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
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
    ...overrides,
  }
}

function rosterMember(id: string, email: string, positions: string[]): WorkspaceRosterMember {
  return {
    id,
    email,
    icsPosition: positions[0] ?? '',
    icsPositions: positions,
    status: 'active',
    checkInStatus: 'Checked In',
    addedAt: '2026-01-01',
    userId: null,
  }
}

const selectableEntry = rosterEntry({
  position: 'Operations Section Chief',
  members: [rosterMember('m1', 'ops@example.com', ['Operations Section Chief'])],
})

const disabledEntry = rosterEntry({
  position: 'Planning Section Chief',
  members: [rosterMember('m2', 'planning@example.com', ['Planning Section Chief'])],
  scheduledUnassignees: [rosterMember('m2', 'planning@example.com', ['Planning Section Chief'])],
})

const retiringPosition = rosterEntry({
  position: 'Retiring Branch',
  opAdvanceLabel: 'retire_on_op_advance',
  members: [rosterMember('m3', 'retire@example.com', ['Retiring Branch'])],
})

const scheduledOnlyEntry = rosterEntry({
  position: 'Finance Section Chief',
  scheduledAssignees: [rosterMember('m4', 'finance@example.com', [])],
})

const selectableOption = classifyIcs204AssignedUnitOption(selectableEntry)
assert(selectableOption?.disabled !== true, 'Active position should be selectable')

const disabledOption = classifyIcs204AssignedUnitOption(disabledEntry)
assert(disabledOption?.disabled === true, 'All retiring with nobody scheduled should be disabled')
assert(
  disabledOption?.label.endsWith('(Nobody Scheduled for Next OP)'),
  'Disabled option should include Nobody Scheduled suffix'
)

const hiddenOption = classifyIcs204AssignedUnitOption(retiringPosition)
assert(hiddenOption === null, 'Retiring positions should be hidden')

const scheduledOption = classifyIcs204AssignedUnitOption(scheduledOnlyEntry)
assert(scheduledOption?.disabled !== true, 'Scheduled assignee-only positions should be selectable')

const options = buildIcs204AssignedUnitOptions([
  selectableEntry,
  disabledEntry,
  retiringPosition,
  scheduledOnlyEntry,
])
assert(options.length === 3, 'Only non-retiring positions should appear in options')

assert(
  isIcs204AssignedUnitSelectable('Operations Section Chief', options),
  'Active position should be assignable'
)
assert(
  !isIcs204AssignedUnitSelectable('Planning Section Chief', options),
  'Nobody scheduled position should not be assignable'
)

const recipients = resolveIcs204AssignedUnitRecipients(
  'Finance Section Chief',
  [rosterMember('m4', 'finance@example.com', [])],
  { 'Finance Section Chief': { assignMemberIds: ['m4'], unassignMemberIds: [] } }
)
assert(recipients.includes('finance@example.com'), 'Scheduled assignees should receive notifications')

const form: Ics204FormState = {
  id: 'doc-1',
  assignedUnit: 'Operations Section Chief',
  branch: 'Branch 1',
  division: 'Division A',
  group: 'Group 1',
  stagingArea: 'Staging A',
  sectionChief: 'IC',
  branchDirector: 'Branch Director',
  divisionGroupSupervisor: 'Ops Lead',
  resourcesAssigned: [{ id: 1, resourceId: null, assetKey: null, reportingInfoNotes: '', has204A: false, resourceSnapshot: null }],
  workAssignments: [{ id: 1, assignment: 'Secure perimeter', priority: '1', resourceRequirements: [], overheadPositions: '', specialEquipmentSupplies: '', reportingLocation: 'HQ', requestedArrivalTime: '08:00' }],
  specialInstructions: 'Maintain accountability.',
  communications: 'Channel 1',
  emergencyCommunications: 'Med-1',
}

const title = buildIcs204AssignmentNotificationTitle(form)
assert(title.includes('Operations Section Chief'), 'Notification title should include assigned unit')

const summary = buildIcs204AssignmentNotificationSummary(form, {
  workspaceLabel: 'Demo Incident',
  assignedByEmail: 'assigner@example.com',
})
assert(summary.includes('Assigned Unit: Operations Section Chief'), 'Summary should include assigned unit')
assert(summary.includes('Secure perimeter'), 'Summary should include work assignment details')
assert(summary.includes('Resources Assigned: 1'), 'Summary should include resource count')

console.log('verify-ics204-assignment: all checks passed')
