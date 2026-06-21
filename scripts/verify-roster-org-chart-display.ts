import { buildDynamicOrgChart } from '../src/features/roster/build-dynamic-org-chart'
import {
  ICS_ORG_CHART_POSITIONS,
  ICS_ORG_CHART_SECTION_BRANCHES,
} from '../src/features/roster/ics-org-chart-structure'
import { emptyWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'
import { buildPositionRosterEntries } from '../src/features/roster/workspace-position-roster'
import type { ResourceListItemData } from '../src/features/resources/types'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const catalog = emptyWorkspacePositionCatalog()
catalog.allPositionNames.push('Incident Commander', 'Operations Section Chief')
catalog.rosterPositionNames.push('Incident Commander', 'Operations Section Chief')

const roster: WorkspaceRosterMember[] = [
  {
    id: 'member-pending',
    userId: null,
    email: 'pending@example.com',
    status: 'active',
    icsPosition: '',
    icsPositions: [],
    assignmentKind: 'single_resource',
    orgChartReportsTo: null,
    pendingOrgChartReportsTo: 'Incident Commander',
    checkInStatus: 'not_arrived',
    addedAt: '2026-01-01',
  },
  {
    id: 'member-scheduled',
    userId: null,
    email: 'scheduled@example.com',
    status: 'active',
    icsPosition: 'Operations Section Chief',
    icsPositions: [],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    pendingOrgChartReportsTo: null,
    checkInStatus: 'not_arrived',
    addedAt: '2026-01-01',
  },
]

const assetsByKey: Record<string, ResourceListItemData> = {
  'asset-pending': {
    assetKey: 'asset-pending',
    name: 'Pending Truck',
    type: 'Vehicle',
    assetStatus: 'available',
    assetStatusUpdatedAt: '2026-01-01',
    mapLocation: [0, 0],
    currentLocation: '',
    opcon: '',
    unitType: '',
    unitName: '',
    quantity: 1,
    costPerUnit: 0,
    costUnitType: 'per day',
    assignedWorkspaceId: null,
    orgChartReportsTo: null,
    pendingOrgChartReportsTo: 'Incident Commander',
    orgChartSortOrder: 0,
    pointOfContactMemberId: null,
    assetCheckInStatus: 'not_arrived',
    currentOpPeriodAssignment: '',
    nextOpPeriodAssignment: '',
    checkInStatus: '',
  },
  'asset-scheduled': {
    assetKey: 'asset-scheduled',
    name: 'Scheduled Truck',
    type: 'Vehicle',
    assetStatus: 'available',
    assetStatusUpdatedAt: '2026-01-01',
    mapLocation: [0, 0],
    currentLocation: '',
    opcon: '',
    unitType: '',
    unitName: '',
    quantity: 1,
    costPerUnit: 0,
    costUnitType: 'per day',
    assignedWorkspaceId: null,
    orgChartReportsTo: null,
    pendingOrgChartReportsTo: null,
    orgChartSortOrder: 0,
    pointOfContactMemberId: null,
    assetCheckInStatus: 'not_arrived',
    currentOpPeriodAssignment: '',
    nextOpPeriodAssignment: '',
    checkInStatus: '',
  },
}

const entries = buildPositionRosterEntries(
  roster,
  {},
  {},
  '',
  catalog,
  {
    'Operations Section Chief': {
      assignMemberIds: ['member-scheduled'],
      unassignMemberIds: [],
    },
  },
  {},
  {
    'Operations Section Chief': {
      assignAssetKeys: ['asset-scheduled'],
      unassignAssetKeys: [],
    },
  },
  assetsByKey
)

const icEntry = entries.find((entry) => entry.position === 'Incident Commander')
assert(icEntry, 'Incident Commander entry should exist')
assert(
  icEntry.scheduledOrgChartMembers.length === 1 &&
    icEntry.scheduledOrgChartMembers[0]?.id === 'member-pending',
  'pending org chart member should be on scheduledOrgChartMembers'
)
assert(
  icEntry.scheduledOrgChartAssets.length === 1 &&
    icEntry.scheduledOrgChartAssets[0]?.assetKey === 'asset-pending',
  'pending org chart asset should be on scheduledOrgChartAssets'
)
assert(
  icEntry.scheduledAssignees.length === 0 && icEntry.scheduledAssignAssets.length === 0,
  'ICS position schedules should not include org chart pending rows'
)

const opsEntry = entries.find((entry) => entry.position === 'Operations Section Chief')
assert(opsEntry, 'Operations Section Chief entry should exist')
assert(opsEntry.scheduledAssignees.length === 1, 'ICS scheduled member should remain on scheduledAssignees')
assert(opsEntry.scheduledAssignAssets.length === 1, 'ICS scheduled asset should remain on scheduledAssignAssets')
assert(
  opsEntry.scheduledOrgChartMembers.length === 0 &&
    opsEntry.scheduledOrgChartAssets.length === 0,
  'Operations Section Chief should have no org chart pending rows'
)

const layout = buildDynamicOrgChart(catalog, Object.values(assetsByKey), roster)
const icChildren = layout.rootChildren
assert(
  icChildren.some(
    (child) => child.kind === 'asset' && child.assetKey === 'asset-pending' && child.scheduled
  ),
  'pending asset should appear on org chart with scheduled flag'
)
assert(
  icChildren.some(
    (child) => child.kind === 'single_resource' && child.memberId === 'member-pending' && child.scheduled
  ),
  'pending single resource should appear on org chart with scheduled flag'
)

assert(
  ICS_ORG_CHART_SECTION_BRANCHES.length === 5,
  'org chart should include five section branches'
)
assert(
  ICS_ORG_CHART_POSITIONS.includes('Intel/Investigations Section Chief'),
  'Intel/Investigations Section Chief should be in org chart positions'
)
const intelBranch = ICS_ORG_CHART_SECTION_BRANCHES.find(
  (branch) => branch.label === 'Intel/Investigations Section'
)
assert(intelBranch?.color === 'tan', 'Intel/Investigations section branch should use tan color')

console.log('verify-roster-org-chart-display: all checks passed')
