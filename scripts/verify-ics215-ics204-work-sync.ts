import {
  buildIcs204Ics215ImportSnapshot,
  getIcs215WorkRowsForTarget,
  mapIcs215RowsToIcs204WorkAssignments,
} from '../src/features/ics204/create-from-ics215'
import { normalizeWorkAssignmentTargetValue } from '../src/lib/work-assignment-target'
import { createEmptyIcs204Form } from '../src/features/ics204/utils'
import {
  applyIcs215ImportToIcs204Form,
  findLinkedIcs204Forms,
  isIcs204WorkAssignmentsLinkedToIcs215,
  mapIcs204WorkAssignmentsToIcs215Rows,
  mergeAssigneeRowsIntoIcs215Form,
  resolveIcs215WorkSyncTooltipFor204,
  resolveIcs215WorkSyncTooltipFor215,
  syncIcs204WorkAssignmentsToIcs215,
  syncIcs215WorkAssignmentsToLinkedIcs204Forms,
} from '../src/features/ics204/sync-ics215-work-assignments'
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
  ...createDefaultIcs215WorkAssignments(ics215Form.resourceColumns).slice(2),
]

const linked204 = {
  ...createEmptyIcs204Form('fixture-204'),
  assignedUnit: 'Division Alpha',
  ics215Import: buildIcs204Ics215ImportSnapshot(ics215Form, 'Division Alpha'),
  workAssignments: mapIcs215RowsToIcs204WorkAssignments(
    getIcs215WorkRowsForTarget(ics215Form, 'Division Alpha'),
    ics215Form.resourceColumns
  ),
}

assert(isIcs204WorkAssignmentsLinkedToIcs215(linked204, ics215Form), 'linked 204 should be linked')
assert(findLinkedIcs204Forms([linked204], ics215Form).length === 1, 'should find linked 204')

const updated215From204 = syncIcs204WorkAssignmentsToIcs215(
  {
    ...linked204,
    ics215Import: {
      ...linked204.ics215Import!,
      workAssignments: linked204.ics215Import!.workAssignments.map((row) =>
        row.id === 1 ? { ...row, workAssignment: 'Updated from ICS-204.' } : row
      ),
    },
  },
  ics215Form
)
assert(updated215From204 !== null, '204 should sync to 215')
const alphaRows = getIcs215WorkRowsForTarget(updated215From204!, 'Division Alpha')
assert(alphaRows[0]?.workAssignment === 'Updated from ICS-204.', '215 row should update from 204')

const updated215 = mergeAssigneeRowsIntoIcs215Form(
  ics215Form,
  'Medical Group',
  [
    {
      id: 99,
      assignee: 'Medical Group',
      workAssignment: 'Expand triage capacity.',
      resourceValues: createEmptyResourceValues(ics215Form.resourceColumns),
      overheadPositions: '',
      specialEquipmentSupplies: '',
      reportingLocation: 'South Aid Station',
      requestedArrivalTime: '08:30',
      status: 'Medium',
    },
  ],
  ics215Form.resourceColumns
)
const synced204Forms = syncIcs215WorkAssignmentsToLinkedIcs204Forms(updated215, [linked204])
assert(synced204Forms.length === 1, '215 save should sync linked 204')
assert(
  synced204Forms[0].workAssignments[0]?.assignment === 'Secure perimeter at Pier 33.',
  'alpha 204 should remain in sync'
)

const card204 = {
  ...createEmptyIcs204Form('card-204'),
  assignedUnit: 'Medical Group',
  workAssignments: mapIcs215RowsToIcs204WorkAssignments(
    getIcs215WorkRowsForTarget(updated215, 'Medical Group'),
    updated215.resourceColumns
  ),
}
const mapped = mapIcs204WorkAssignmentsToIcs215Rows(
  card204.workAssignments,
  'Medical Group',
  updated215.resourceColumns
)
assert(mapped.rows[0]?.workAssignment.includes('triage'), 'reverse mapper should preserve assignment')

const imported204 = applyIcs215ImportToIcs204Form(card204, updated215)
assert(
  imported204.ics215Import?.assignee === normalizeWorkAssignmentTargetValue('Medical Group'),
  'auto-link should set import snapshot'
)

const tooltip215 = resolveIcs215WorkSyncTooltipFor215(updated215, [linked204, card204], assigneeOptions, {
  [linked204.id]: { 'work-assignments': linked204.workAssignments },
})
assert(tooltip215.linked, '215 tooltip should show linked state')
assert(tooltip215.peerHasUnsavedEdits, '215 tooltip should warn about unsaved 204 draft')

const tooltip204 = resolveIcs215WorkSyncTooltipFor204(linked204, updated215, true, assigneeOptions)
assert(tooltip204.linked, '204 tooltip should show linked state')
assert(tooltip204.peerHasUnsavedEdits, '204 tooltip should warn about unsaved 215 draft')

console.log('verify-ics215-ics204-work-sync: all checks passed')
