import assert from 'node:assert/strict'
import { buildIcs207ExportContext } from '../src/features/ics207/export-layout'
import { buildIcs207PdfBytesForTest } from '../src/features/ics207/export-download'
import { buildOrgChartLayoutForExport } from '../src/features/roster/build-org-chart-for-export'
import {
  buildProjectedOrgChartExportData,
  projectPositionRosterEntryForExport,
  projectPositionRosterEntriesForExport,
} from '../src/features/roster/org-chart-export-scope'
import { buildWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'
import type { PositionRosterEntry } from '../src/features/roster/workspace-position-roster'
import type { ResourceListItemData } from '../src/features/resources/types'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function buildSampleCatalog() {
  return buildWorkspacePositionCatalog([
    {
      id: 'custom-planned',
      name: 'Future Branch Chief',
      reportsTo: 'Operations Section Chief',
      sortOrder: 1,
      lifecycleStatus: 'planned_create',
    },
    {
      id: 'custom-retiring',
      name: 'Retiring Unit Leader',
      reportsTo: 'Planning Section Chief',
      sortOrder: 2,
      lifecycleStatus: 'retire_on_op_advance',
    },
  ])
}

function buildSampleEntry(position: string, overrides: Partial<PositionRosterEntry> = {}): PositionRosterEntry {
  return {
    position,
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

function buildSampleAsset(assetKey: string, reportsTo: string | null): ResourceListItemData {
  return {
    assetKey,
    id: 1,
    areaKey: 'se',
    name: assetKey,
    assetStatus: 'FMC',
    assetStatusUpdatedAt: '2026-01-01T00:00:00.000Z',
    owner: 'USCG',
    status: 'Assigned',
    type: 'Vessel',
    teamLead: '',
    eta: '',
    location: '',
    notes: '',
    mapLocation: [0, 0],
    currentLocation: '',
    datetimeOrdered: '',
    opcon: '',
    tacon: '',
    pointOfContact: '',
    owningOrganization: '',
    quantity: 1,
    unitType: '',
    unitName: '',
    hullTailNumber: '',
    symbology: '',
    latitude: '',
    longitude: '',
    capabilities: '',
    currentOpPeriod: '',
    nextOpPeriod: '',
    currentOpPeriodAssignment: '',
    nextOpPeriodAssignment: '',
    checkInStatus: '',
    costUnitType: 'per day',
    costPerUnit: 0,
    deploymentKind: 'incident',
    assignedWorkspaceId: 'ws-1',
    assignedWorkspaceKind: 'incident',
    assignedIncidentName: 'Test',
    assignedExerciseName: null,
    orgChartReportsTo: reportsTo,
    orgChartSortOrder: 0,
    ics204DocumentId: null,
    pointOfContactMemberId: null,
    assetCheckInStatus: null,
    competencyFunction: null,
  }
}

const catalog = buildSampleCatalog()
const operationsEntry = buildSampleEntry('Operations Section Chief', {
  members: [buildSampleMember('m1', 'ops@example.com')],
  scheduledAssignees: [buildSampleMember('m2', 'scheduled@example.com')],
})
const retiringEntry = buildSampleEntry('Retiring Unit Leader', {
  members: [buildSampleMember('m3', 'retiring@example.com')],
})
const entries = [operationsEntry, retiringEntry]

const currentProjected = projectPositionRosterEntryForExport(
  operationsEntry,
  catalog,
  'current_op'
)
assert(currentProjected)
assert.equal(currentProjected.members.length, 1)
assert.equal(currentProjected.scheduledAssignees.length, 0)

const nextProjected = projectPositionRosterEntryForExport(operationsEntry, catalog, 'next_op')
assert(nextProjected)
assert.equal(nextProjected.members.length, 2)

const nextEntries = projectPositionRosterEntriesForExport(entries, catalog, 'next_op')
assert(!nextEntries.some((entry) => entry.position === 'Retiring Unit Leader'))
assert(nextEntries.some((entry) => entry.position === 'Operations Section Chief'))

const projected = buildProjectedOrgChartExportData({
  catalog,
  entries,
  assets: [
    buildSampleAsset('asset-current', 'Operations Section Chief'),
    buildSampleAsset('asset-pending', null),
  ].map((asset) =>
    asset.assetKey === 'asset-pending'
      ? { ...asset, pendingOrgChartReportsTo: 'Operations Section Chief' }
      : asset
  ),
  roster: [],
  scope: 'next_op',
})
assert(projected.assetsByKey['asset-pending']?.orgChartReportsTo === 'Operations Section Chief')

const layout = buildOrgChartLayoutForExport(
  projected.catalog,
  projected.assets,
  projected.roster,
  'next_op'
)
assert(layout.rootPosition.length > 0)

const context = buildIcs207ExportContext({
  scope: 'current_op',
  incidentName: 'Test Incident',
  incidentLocation: 'Cape Cod',
  operationalPeriodFrom: '2026-06-23 08:00',
  preparedByName: 'Planner',
  preparedByPositionTitle: 'Planning Section Chief',
})
assert.match(context.operationalPeriodDate, /2026-06-23/)

const pngBytes = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADklEQVQIHWP4//8/AwAI/AL+U4y9xQAAAABJRU5ErkJggg==',
    'base64'
  )
)
const pdfBytes = await buildIcs207PdfBytesForTest(pngBytes, context)
assert(pdfBytes.length > 1000)
assert.match(new TextDecoder('latin1').decode(pdfBytes.slice(0, 8)), /^%PDF-1\./)

console.log('verify-ics207-export: all checks passed')
