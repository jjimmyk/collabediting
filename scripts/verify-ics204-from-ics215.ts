import {
  buildIcs204PartialFromIcs215,
  canCreateIcs204FromIcs215,
  getIcs215WorkRowsForTarget,
  isIcs215WorkAssignmentRowPopulated,
  listIcs215AssigneesWithWork,
  mapIcs215RowsToIcs204WorkAssignments,
  syncIcs204WorkAssignmentsFromIcs215Import,
} from '../src/features/ics204/create-from-ics215'
import { normalizeWorkAssignmentTargetValue } from '../src/lib/work-assignment-target'
import { createEmptyIcs204Form } from '../src/features/ics204/utils'
import type { Ics204AssignedUnitOption } from '../src/features/ics204/ics204-assigned-unit-options'
import {
  createDefaultIcs215WorkAssignments,
  createEmptyIcs215Form,
  createEmptyResourceValues,
} from '../src/features/ics215/utils'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const assigneeOptions: Ics204AssignedUnitOption[] = [
  { value: 'position:Division Alpha', label: 'Division Alpha' },
  { value: 'position:Medical Group', label: 'Medical Group' },
  {
    value: 'position:Evacuation Group',
    label: 'Evacuation Group (Nobody Scheduled for Next OP)',
    disabled: true,
  },
]

const ics215Form = createEmptyIcs215Form('fixture-215')
ics215Form.resourceColumns = [
  { id: 'helicopter', label: 'Helicopter' },
  { id: 'small-boat', label: 'Small Boat' },
]
ics215Form.workAssignments = [
  {
    id: 1,
    assignee: 'Division Alpha',
    workAssignment: 'Secure perimeter at Pier 33.',
    resourceValues: {
      helicopter: { required: '2', have: '1', need: '1' },
      'small-boat': { required: '', have: '', need: '' },
    },
    overheadPositions: 'Safety Officer',
    specialEquipmentSupplies: 'Radios',
    reportingLocation: 'Staging Alpha',
    requestedArrivalTime: '08:00',
    status: 'High',
  },
  {
    id: 2,
    assignee: 'Division Alpha',
    workAssignment: 'Conduct shoreline assessment.',
    resourceValues: createEmptyResourceValues(ics215Form.resourceColumns),
    overheadPositions: '',
    specialEquipmentSupplies: '',
    reportingLocation: 'Pier 33',
    requestedArrivalTime: '09:00',
    status: 'Medium',
  },
  {
    id: 3,
    assignee: 'Medical Group',
    workAssignment: 'Stand up aid station.',
    resourceValues: {
      helicopter: { required: '0', have: '0', need: '0' },
      'small-boat': { required: '1', have: '0', need: '1' },
    },
    overheadPositions: 'Medical Unit Leader',
    specialEquipmentSupplies: 'Triage kits',
    reportingLocation: 'South Aid Station',
    requestedArrivalTime: '07:30',
    status: 'High',
  },
  ...createDefaultIcs215WorkAssignments(ics215Form.resourceColumns).slice(3),
]

assert(isIcs215WorkAssignmentRowPopulated(ics215Form.workAssignments[0]), 'row should be populated')
assert(
  getIcs215WorkRowsForTarget(ics215Form, 'Division Alpha').length === 2,
  'Division Alpha should have two rows'
)

const options = listIcs215AssigneesWithWork(ics215Form, assigneeOptions, [])
assert(options.length === 2, 'should list two eligible assignees')
assert(options.every((option) => !option.disabled), 'none should be disabled yet')

const partial = buildIcs204PartialFromIcs215(ics215Form, 'Division Alpha')
assert(
  partial.assignedUnit === normalizeWorkAssignmentTargetValue('Division Alpha'),
  'assigned unit should match encoded target'
)
assert(partial.ics215Import?.workAssignments.length === 2, 'import snapshot should have two rows')
assert(partial.workAssignments?.length === 2, '204 work assignments should have two rows')
assert(
  partial.workAssignments?.[0].resourceRequirements?.length === 1,
  'first row should map one resource requirement'
)
assert(partial.workAssignments?.[0].assignment === 'Secure perimeter at Pier 33.', 'assignment maps')
assert(partial.workAssignments?.[0].priority === 'High', 'status maps to priority')

const synced = syncIcs204WorkAssignmentsFromIcs215Import({
  ...createEmptyIcs204Form('fixture-204'),
  ...partial,
})
assert(
  synced.workAssignments.length === partial.workAssignments?.length,
  'sync should preserve assignment count'
)

const existing = [
  {
    ...createEmptyIcs204Form('existing'),
    assignedUnit: normalizeWorkAssignmentTargetValue('Division Alpha'),
  },
]
const blocked = listIcs215AssigneesWithWork(ics215Form, assigneeOptions, existing)
const divisionAlpha = blocked.find((option) => option.label === 'Division Alpha')
assert(divisionAlpha?.disabled === true, 'existing 204 should block duplicate assignee')
assert(
  canCreateIcs204FromIcs215(ics215Form, assigneeOptions, existing),
  'Medical Group should still be creatable'
)
assert(!canCreateIcs204FromIcs215(null, assigneeOptions, []), 'null 215 should not be creatable')

const remapped = mapIcs215RowsToIcs204WorkAssignments(
  partial.ics215Import!.workAssignments,
  partial.ics215Import!.resourceColumns
)
assert(remapped[1].assignment === 'Conduct shoreline assessment.', 'second row maps')

console.log('verify-ics204-from-ics215: all checks passed')
