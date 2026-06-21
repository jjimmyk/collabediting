import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildDynamicOrgChart } from '../src/features/roster/build-dynamic-org-chart'
import {
  ICS_ORG_CHART_COMMAND_STAFF_POSITIONS,
  ICS_ORG_CHART_POSITIONS,
  ICS_ORG_CHART_ROOT_POSITION,
  ICS_ORG_CHART_SECTION_BRANCHES,
  type OrgChartNode,
} from '../src/features/roster/ics-org-chart-structure'
import {
  positionCanBeRemovedFromRoster,
  positionRemovalBlockedReason,
} from '../src/features/roster/position-roster-removal'
import {
  summarizeActiveDisplayFilters,
  DEFAULT_ROSTER_DISPLAY_FILTERS,
  resolveVisibleRosterPositions,
} from '../src/features/roster/roster-display-filters'
import {
  ORG_CHART_ASSET_CARD_MAX_WIDTH,
  ORG_CHART_CANVAS_MIN_WIDTH,
  orgChartSectionColumnClassName,
  LOGISTICS_SECTION_LABEL,
} from '../src/features/roster/org-chart-layout-tokens'
import {
  buildWorkspacePositionCatalog,
  emptyWorkspacePositionCatalog,
} from '../src/features/roster/workspace-positions'
import { buildPositionRosterEntries, type PositionRosterEntry } from '../src/features/roster/workspace-position-roster'
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
assert(
  !ICS_ORG_CHART_POSITIONS.includes('Display Unit Leader'),
  'Display Unit Leader should be removed from org chart positions'
)
assert(
  ICS_ORG_CHART_POSITIONS.includes('Finance Section Chief'),
  'Finance Section Chief should be in org chart positions'
)
assert(
  ICS_ORG_CHART_POSITIONS.includes('Legal Officer'),
  'Legal Officer should be in org chart positions'
)
assert(
  ICS_ORG_CHART_POSITIONS.includes('Staging Area Manager'),
  'Staging Area Manager should be in org chart positions'
)

const planningBranch = ICS_ORG_CHART_SECTION_BRANCHES.find(
  (branch) => branch.label === 'Planning Section'
)
const planningChief = planningBranch?.children.find((child) => child.kind === 'position')
assert(
  planningChief?.kind === 'position' &&
    planningChief.children?.some((child) => child.kind === 'stack'),
  'Planning Section Chief should nest unit leaders in a stack'
)

const filterEntries: PositionRosterEntry[] = [
  {
    position: 'Incident Commander',
    members: [{ id: 'm1' } as WorkspaceRosterMember],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    memberSchedulePolicy: { allowScheduleAssign: true, allowScheduleUnassign: true },
    editIcs201: true,
    allowWorkAssignment: true,
  },
  {
    position: 'Operations Section Chief',
    members: [],
    scheduledAssignees: [{ id: 'm2' } as WorkspaceRosterMember],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    memberSchedulePolicy: { allowScheduleAssign: true, allowScheduleUnassign: true },
    editIcs201: true,
    allowWorkAssignment: true,
  },
]

assert(
  resolveVisibleRosterPositions(filterEntries, DEFAULT_ROSTER_DISPLAY_FILTERS).size === 2,
  'default display filters should show all positions'
)
assert(
  resolveVisibleRosterPositions(filterEntries, {
    ...DEFAULT_ROSTER_DISPLAY_FILTERS,
    showPositionsWithCurrentAssignees: false,
    showPositionsWithoutCurrentAssignees: true,
    showPositionsWithScheduledAssignees: true,
    showPositionsWithoutScheduledAssignees: false,
  }).has('Operations Section Chief'),
  'scheduled-only positions should remain visible when scheduled filter allows them'
)
assert(
  !resolveVisibleRosterPositions(filterEntries, {
    ...DEFAULT_ROSTER_DISPLAY_FILTERS,
    showPositionsWithCurrentAssignees: false,
    showPositionsWithoutCurrentAssignees: true,
    showPositionsWithScheduledAssignees: false,
    showPositionsWithoutScheduledAssignees: false,
  }).has('Operations Section Chief'),
  'positions should hide when both scheduled toggles are off'
)

function findPositionNode(
  nodes: OrgChartNode[],
  position: string
): Extract<OrgChartNode, { kind: 'position' }> | null {
  for (const node of nodes) {
    if (node.kind === 'position') {
      if (node.position === position) {
        return node
      }
      if (node.children) {
        const found = findPositionNode(node.children, position)
        if (found) return found
      }
      continue
    }
    if (node.kind === 'group' || node.kind === 'stack' || node.kind === 'fork') {
      const found = findPositionNode(node.children, position)
      if (found) return found
    }
  }
  return null
}

function collectOrgChartNodes(nodes: OrgChartNode[]): OrgChartNode[] {
  const collected: OrgChartNode[] = []
  for (const node of nodes) {
    collected.push(node)
    if (node.kind === 'position' && node.children) {
      collected.push(...collectOrgChartNodes(node.children))
    } else if (node.kind === 'group' || node.kind === 'stack' || node.kind === 'fork') {
      collected.push(...collectOrgChartNodes(node.children))
    }
  }
  return collected
}

const colorCatalog = buildWorkspacePositionCatalog([
  {
    id: 'custom-division-alpha',
    name: 'division alpha',
    reportsTo: 'Operations Section Chief',
    sortOrder: 0,
    lifecycleStatus: 'active',
  },
])

const colorLayout = buildDynamicOrgChart(colorCatalog, [
  {
    assetKey: 'asset-under-custom',
    name: 'a test item',
    type: 'Equipment',
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
    orgChartReportsTo: 'division alpha',
    pendingOrgChartReportsTo: null,
    orgChartSortOrder: 0,
    pointOfContactMemberId: null,
    assetCheckInStatus: 'not_arrived',
    currentOpPeriodAssignment: '',
    nextOpPeriodAssignment: '',
    checkInStatus: '',
  },
])

const opsBranch = colorLayout.sectionBranches.find(
  (branch) => branch.label === 'Operations Section'
)
const opsChief =
  opsBranch?.children.find((child) => child.kind === 'position') ?? null
assert(opsChief?.kind === 'position', 'Operations Section Chief should exist in color layout')

const customPositionNode = findPositionNode(opsChief.children ?? [], 'division alpha')
assert(customPositionNode, 'custom position should attach under Operations Section Chief')
assert(
  customPositionNode.color !== 'neutral',
  'custom positions should inherit section color at render time, not hardcode neutral'
)

const allColorNodes = collectOrgChartNodes([
  ...colorLayout.rootChildren,
  ...colorLayout.commandStaffBranch.children,
  ...colorLayout.sectionBranches.flatMap((branch) => branch.children),
])
const placedAssetNode = allColorNodes.find(
  (node) => node.kind === 'asset' && node.assetKey === 'asset-under-custom'
)
assert(placedAssetNode?.kind === 'asset', 'org chart asset should attach under custom position')
assert(
  placedAssetNode.color !== 'neutral',
  'org chart assets should inherit parent section color at render time, not hardcode neutral'
)

assert(
  ORG_CHART_ASSET_CARD_MAX_WIDTH.includes('36rem'),
  'org chart asset cards should use 4x width (36rem max)'
)
assert(
  ORG_CHART_CANVAS_MIN_WIDTH.includes('84rem'),
  'org chart canvas should enforce horizontal scroll min width'
)
assert(
  orgChartSectionColumnClassName(LOGISTICS_SECTION_LABEL).includes('28rem'),
  'Logistics section column should be wider than standard sections'
)
assert(
  orgChartSectionColumnClassName('Planning Section').includes('14rem'),
  'standard section columns should have readable min width'
)

assert(
  ICS_ORG_CHART_COMMAND_STAFF_POSITIONS.join(',') ===
    'Public Information Officer,Safety Officer,Liaison Officer,Legal Officer',
  'command staff positions should be ordered PIO, Safety, Liaison, Legal'
)
assert(
  ICS_ORG_CHART_ROOT_POSITION === 'Incident Commander',
  'org chart root position should be Incident Commander'
)

const emptyPositionEntry: PositionRosterEntry = {
  position: 'Staging Area Manager',
  members: [],
  scheduledAssignees: [],
  scheduledUnassignees: [],
  scheduledOrgChartMembers: [],
  assets: [],
  scheduledAssignAssets: [],
  scheduledUnassignAssets: [],
  scheduledOrgChartAssets: [],
  memberSchedulePolicy: { allowScheduleAssign: true, allowScheduleUnassign: true },
  editIcs201: true,
  allowWorkAssignment: true,
}
assert(
  positionCanBeRemovedFromRoster(emptyPositionEntry, catalog, roster, Object.values(assetsByKey)),
  'empty positions without dependencies should be removable'
)
assert(
  !positionCanBeRemovedFromRoster(icEntry, catalog, roster, Object.values(assetsByKey)),
  'Incident Commander should not be removable'
)
assert(
  positionRemovalBlockedReason(icEntry, catalog, roster, Object.values(assetsByKey))?.includes(
    'Incident Commander'
  ),
  'Incident Commander removal should explain why it is blocked'
)
assert(
  !positionCanBeRemovedFromRoster(opsEntry, catalog, roster, Object.values(assetsByKey)),
  'positions with scheduled assignees should not be removable'
)

const defaultFilterSummary = summarizeActiveDisplayFilters(DEFAULT_ROSTER_DISPLAY_FILTERS)
assert(defaultFilterSummary.isDefault, 'default display filters should report isDefault')
assert(defaultFilterSummary.activeCount === 6, 'default display filters should have 6 active toggles')
assert(
  defaultFilterSummary.inactiveLabels.length === 0,
  'default display filters should have no inactive labels'
)
const customFilterSummary = summarizeActiveDisplayFilters({
  ...DEFAULT_ROSTER_DISPLAY_FILTERS,
  showPositionsWithCurrentAssignees: false,
})
assert(!customFilterSummary.isDefault, 'partial display filters should not be default')
assert(
  customFilterSummary.inactiveLabels.includes('Positions with current assignees'),
  'inactive display filter labels should include turned-off toggles'
)

const connectorSource = readFileSync(
  join(process.cwd(), 'src/features/roster/OrgChartConnectors.tsx'),
  'utf8'
)
assert(
  connectorSource.includes('-translate-y-1/2') && connectorSource.includes('-mt-px'),
  'org chart connectors should overlap horizontal and vertical junctions'
)

console.log('verify-roster-org-chart-display: all checks passed')
