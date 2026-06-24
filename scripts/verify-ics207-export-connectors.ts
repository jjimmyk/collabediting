import assert from 'node:assert/strict'
import { buildWideLayoutConnectorLinks } from '../src/features/roster/build-wide-layout-connector-links'
import { buildWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'
import { DEFAULT_ROSTER_DISPLAY_FILTERS } from '../src/features/roster/roster-display-filters'
import { buildOrgChartLayoutForExport } from '../src/features/roster/build-org-chart-for-export'
import {
  icBusConnectLines,
  spineConnectLines,
} from '../src/features/roster/org-chart-connector-draw'
import { ORG_CHART_SPINE_ANCHOR_RATIO } from '../src/features/roster/org-chart-layout-tokens'
import { ORG_CHART_IC_CONNECTOR_ID } from '../src/features/roster/org-chart-node-id'
import type { PositionRosterEntry } from '../src/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function buildSampleMember(id: string, email: string): WorkspaceRosterMember {
  return {
    id,
    userId: null,
    email,
    status: 'active',
    icsPosition: 'Operations Section Chief',
    icsPositions: ['Operations Section Chief'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    checkInStatus: 'not_arrived',
    addedAt: '2026-01-01T00:00:00.000Z',
  }
}

function buildSampleEntry(position: string): PositionRosterEntry {
  return {
    position,
    members: [buildSampleMember(`m-${position}`, `${position}@example.com`)],
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
  }
}

const catalog = buildWorkspacePositionCatalog([])
const entries = [
  buildSampleEntry('Incident Commander'),
  buildSampleEntry('Operations Section Chief'),
  buildSampleEntry('Planning Section Chief'),
]
const entriesByPosition = Object.fromEntries(entries.map((entry) => [entry.position, entry]))
const visiblePositions = new Set(entries.map((entry) => entry.position))
const displayFilters = { ...DEFAULT_ROSTER_DISPLAY_FILTERS }

const layout = buildOrgChartLayoutForExport(catalog, [], [], 'current_op')
const linkContext = {
  entriesByPosition,
  assetsByKey: {},
  rosterById: {},
  visiblePositions,
  displayFilters,
}

const { spineLinks, icBusLinks } = buildWideLayoutConnectorLinks(layout, linkContext)

assert(icBusLinks.length > 0, 'wide layout should produce IC bus links for multi-section org charts')
assert(
  icBusLinks.some((link) => link.commanderId === ORG_CHART_IC_CONNECTOR_ID),
  'IC bus should originate from incident commander connector id'
)
assert(Array.isArray(spineLinks), 'spine links should be returned as an array')

const mockChart = {
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
  dataset: { orgChartZoom: '1' },
} as unknown as HTMLElement

const mockParent = {
  getBoundingClientRect: () => ({
    left: 100,
    top: 40,
    right: 260,
    bottom: 120,
    width: 160,
    height: 80,
    x: 100,
    y: 40,
    toJSON: () => ({}),
  }),
} as unknown as HTMLElement

const mockChild = {
  getBoundingClientRect: () => ({
    left: 220,
    top: 180,
    right: 380,
    bottom: 260,
    width: 160,
    height: 80,
    x: 220,
    y: 180,
    toJSON: () => ({}),
  }),
} as unknown as HTMLElement

const spineLines = spineConnectLines(
  mockChart,
  mockParent,
  [mockChild],
  ORG_CHART_SPINE_ANCHOR_RATIO,
  1
)
assert.equal(spineLines.length, 2, 'spine connector geometry should emit vertical and horizontal segments')

const busLines = icBusConnectLines(mockChart, mockParent, [mockChild, mockChild], undefined, 1)
assert(busLines.length >= 3, 'IC bus geometry should emit trunk, crossbar, and drops')

console.log('verify-ics207-export-connectors: all checks passed')
