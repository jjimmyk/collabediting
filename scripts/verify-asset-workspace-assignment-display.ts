import type { Ics204FormState } from '@/features/ics204/types'
import {
  enrichAssetsWithWorkspaceAssignmentDisplay,
  findIcs204AssignedUnitForAsset,
  resolveAssetWorkspaceAssignmentDisplay,
  UNASSIGNED_WORKSPACE_FIELD,
} from '@/features/resources/asset-workspace-assignment-display'
import type { ResourceListItemData } from '@/features/resources/types'
import { applyAssignmentsToHubAssets } from '@/features/resources/utils'
import { getAllHubAssets } from '@/data/hub-asset-catalog'
import type { AccessibleWorkspace } from '@/lib/workspace-types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const planningWorkspace: AccessibleWorkspace = {
  workspaceId: 'ws-1',
  kind: 'incident',
  legacyId: 1,
  name: 'Test Incident',
  icsPosition: 'Incident Commander',
  icsPositions: ['Incident Commander'],
  region: null,
  summary: null,
  archivedAt: null,
  workspaceFormat: 'uscg-ics',
  incidentComplexity: 'planning-p',
  hasSequentialWorkflow: true,
  sequentialWorkflowType: 'planning-p',
  startedOperationalPeriodCount: 1,
  workingOperationalPeriodNumber: 2,
  metadata: {},
}

const asset: ResourceListItemData = {
  ...getAllHubAssets()[0]!,
  assignedWorkspaceId: 'ws-1',
  assignedWorkspaceKind: 'incident',
  assignedIncidentName: 'Test Incident',
  assignedExerciseName: null,
  deploymentKind: 'incident',
  orgChartReportsTo: null,
  orgChartSortOrder: 0,
  ics204DocumentId: 'ics204-doc-2',
  pointOfContactMemberId: null,
  assetCheckInStatus: 'demobilizing',
  assetKey: 'test-asset',
}

const workingForm: Ics204FormState = {
  id: 'ics204-doc-2',
  assignedUnit: 'Operations Section Chief',
  branch: '',
  division: '',
  group: '',
  stagingArea: '',
  sectionChief: '',
  branchDirector: '',
  divisionGroupSupervisor: '',
  resourcesAssigned: [
    {
      id: 1,
      resourceId: null,
      assetKey: 'test-asset',
      reportingInfoNotes: '',
      has204A: false,
      resourceSnapshot: null,
    },
  ],
  workAssignments: [],
  specialInstructions: '',
  communications: '',
  emergencyCommunications: '',
}

const currentForm: Ics204FormState = {
  ...workingForm,
  id: 'ics204-doc-1',
  assignedUnit: 'Incident Commander',
}

const unassignedDisplay = resolveAssetWorkspaceAssignmentDisplay(asset, undefined, null)
assert(
  unassignedDisplay.currentOpPeriod === UNASSIGNED_WORKSPACE_FIELD,
  'unassigned workspace should blank OP fields'
)

const assignedWithoutContext = resolveAssetWorkspaceAssignmentDisplay(
  asset,
  planningWorkspace,
  null
)
assert(
  assignedWithoutContext.currentOpPeriod === 'Operational Period 1',
  'current OP label should use started count'
)
assert(
  assignedWithoutContext.nextOpPeriod === 'Operational Period 2',
  'next OP label should use working period number'
)
assert(
  assignedWithoutContext.currentOpPeriodAssignment === UNASSIGNED_WORKSPACE_FIELD,
  'ICS204 assignment requires active context'
)
assert(assignedWithoutContext.checkInStatus === 'Demobilizing', 'check-in uses stored asset status')

const activeContext = {
  workspaceId: 'ws-1',
  operationalPeriodsEnabled: true,
  startedOperationalPeriodCount: 1,
  workingOperationalPeriodNumber: 2,
  workingIcs204Forms: [workingForm],
  currentOpIcs204Forms: [currentForm],
  ics204AssigneeOptions: [{ value: 'Operations Section Chief', label: 'Operations Section Chief' }],
}

const assignedWithContext = resolveAssetWorkspaceAssignmentDisplay(
  asset,
  planningWorkspace,
  activeContext
)
assert(
  assignedWithContext.currentOpPeriodAssignment === 'Incident Commander',
  'current OP assignment should come from frozen ICS-204'
)
assert(
  assignedWithContext.nextOpPeriodAssignment === 'Operations Section Chief',
  'next OP assignment should come from working ICS-204'
)

assert(
  findIcs204AssignedUnitForAsset([workingForm], 'test-asset', activeContext.ics204AssigneeOptions) ===
    'Operations Section Chief',
  'findIcs204AssignedUnitForAsset should resolve assigned unit'
)

const enriched = enrichAssetsWithWorkspaceAssignmentDisplay(
  applyAssignmentsToHubAssets(
    getAllHubAssets().slice(0, 1),
    [
      {
        assetKey: getAllHubAssets()[0]!.assetKey,
        workspaceId: 'ws-1',
        checkInStatus: 'checked_in',
      },
    ],
    { 'ws-1': planningWorkspace }
  ),
  { 'ws-1': planningWorkspace },
  activeContext
)
assert(enriched[0]?.checkInStatus === 'Checked-In', 'enriched asset should format check-in label')

console.log('verify-asset-workspace-assignment-display: all checks passed')
