import { buildIcs204Ics215ImportSnapshot } from '../src/features/ics204/create-from-ics215'
import { createEmptyIcs204Form } from '../src/features/ics204/utils'
import {
  collectHaveRefsForAssignee,
  syncIcs215HaveResourcesToLinkedIcs204Forms,
  unlinkHaveRefFromIcs215Form,
} from '../src/features/ics204/sync-ics215-have-resources'
import { applyHaveRosterLink } from '../src/features/ics215/ics215-have-asset-link'
import { createEmptyIcs215Form } from '../src/features/ics215/utils'
import type { WorkAssignmentTargetOption } from '../src/lib/work-assignment-target-options'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const assignee = 'position:Division Alpha'
const heloRef = 'org_chart_asset:helo-1'
const boatRef = 'org_chart_asset:boat-1'

const haveLinkTargetOptions: WorkAssignmentTargetOption[] = [
  {
    value: heloRef,
    label: 'MH-65 Dolphin',
    group: 'Assets',
    targetType: 'org_chart_asset',
  },
  {
    value: boatRef,
    label: 'Small Boat',
    group: 'Assets',
    targetType: 'org_chart_asset',
  },
]

const syncContext = {
  roster: [],
  assetsByKey: {},
  haveLinkTargetOptions,
}

const ics215Form = createEmptyIcs215Form('verify-215')
ics215Form.resourceColumns = [{ id: 'helicopter', label: 'Helicopter' }]
ics215Form.workAssignments = [
  {
    id: 1,
    assignee,
    workAssignment: 'Secure perimeter',
    resourceValues: {
      helicopter: applyHaveRosterLink(
        { required: '2', have: '2', need: '0' },
        [heloRef, boatRef],
        haveLinkTargetOptions
      ),
    },
    overheadPositions: '',
    specialEquipmentSupplies: '',
    reportingLocation: '',
    requestedArrivalTime: '',
    status: 'High',
  },
]

const linked204 = {
  ...createEmptyIcs204Form('verify-204'),
  assignedUnit: assignee,
  ics215Import: buildIcs204Ics215ImportSnapshot(ics215Form, assignee),
}

const synced = syncIcs215HaveResourcesToLinkedIcs204Forms(
  ics215Form,
  [linked204],
  syncContext
)
assert(synced.length === 1, 'expected one linked ICS-204 to sync')
assert(synced[0].resourcesAssigned.length === 2, 'expected two synced resource rows')
assert(
  synced[0].resourcesAssigned.every((row) => row.rosterHaveRef),
  'expected all synced rows to carry rosterHaveRef'
)

const unlinked215 = unlinkHaveRefFromIcs215Form(ics215Form, assignee, heloRef, syncContext)
assert(
  collectHaveRefsForAssignee(unlinked215, assignee).length === 1,
  'expected one Have ref after unlink'
)

console.log('verify-ics215-ics204-have-resources-sync: all checks passed')
