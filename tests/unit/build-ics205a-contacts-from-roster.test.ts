import { describe, expect, it } from 'vitest'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import { buildIcs205aContactsFromNextOpRoster } from '@/features/ics205a/build-ics205a-contacts-from-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

const basePolicy = {
  allowActiveAssignment: true,
  allowScheduleAssign: true,
  allowScheduleUnassign: true,
}

function makeMember(overrides: Partial<WorkspaceRosterMember>): WorkspaceRosterMember {
  return {
    id: 'member-1',
    email: 'alpha@example.gov',
    icsPosition: 'Operations Section Chief',
    icsPositions: ['Operations Section Chief'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    status: 'active',
    checkInStatus: 'not_arrived',
    addedAt: 'now',
    userId: 'user-1',
    ...overrides,
  }
}

function makeEntry(overrides: Partial<PositionRosterEntry>): PositionRosterEntry {
  return {
    position: 'Operations Section Chief',
    members: [],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    resourceCategories: [],
    memberSchedulePolicy: basePolicy,
    editIcs201: true,
    allowWorkAssignment: true,
    positionType: null,
    customTypeLabel: null,
    positionTypeLabel: null,
    ...overrides,
  }
}

function makeCatalog(positions: string[]): WorkspacePositionCatalog {
  return {
    rosterPositionNames: positions,
    orgChartPositionNames: positions,
    allPositionNames: positions,
    standardPositions: positions,
    customPositions: [],
    positionMetaByName: Object.fromEntries(
      positions.map((position) => [
        position,
        {
          lifecycleStatus: 'active' as const,
          isPlanned: false,
          opAdvanceLabel: null,
          isOnOrgChart: true,
        },
      ])
    ),
  }
}

function makeAsset(
  overrides: Partial<ResourceListItemData> & Pick<ResourceListItemData, 'assetKey' | 'name'>
): ResourceListItemData {
  return {
    id: 1,
    areaKey: 'atlantic',
    assetStatus: 'FMC',
    assetStatusUpdatedAt: 'now',
    owner: 'USCG',
    status: 'Available',
    type: 'Engine',
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
    assignedWorkspaceId: null,
    assignedWorkspaceKind: null,
    assignedIncidentName: null,
    assignedExerciseName: null,
    orgChartReportsTo: null,
    orgChartSortOrder: 0,
    ics204DocumentId: null,
    pointOfContactMemberId: null,
    assetCheckInStatus: null,
    competencyFunction: null,
    ...overrides,
  }
}

describe('buildIcs205aContactsFromNextOpRoster', () => {
  it('includes scheduled assignees as member rows after next OP projection', () => {
    const scheduledMember = makeMember({
      id: 'member-scheduled',
      email: 'scheduled@example.gov',
      icsPositions: [],
    })
    const catalog = makeCatalog(['Operations Section Chief'])
    const rows = buildIcs205aContactsFromNextOpRoster({
      catalog,
      positionEntries: [
        makeEntry({
          scheduledAssignees: [scheduledMember],
        }),
      ],
      roster: [scheduledMember],
      assets: [],
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.assignedPosition).toBe('position:Operations Section Chief')
    expect(rows[0]?.name).toContain('member-scheduled')
    expect(rows[0]?.name).toContain('Operations Section Chief')
  })

  it('creates separate rows for a member and position asset at the same position', () => {
    const member = makeMember({
      id: 'member-active',
      email: 'active@example.gov',
    })
    const catalog = makeCatalog(['Operations Section Chief'])
    const rows = buildIcs205aContactsFromNextOpRoster({
      catalog,
      positionEntries: [
        makeEntry({
          members: [member],
          assets: [
            {
              assetKey: 'asset-active',
              name: 'Engine 1',
              type: 'Engine',
              pointOfContactMemberId: null,
              pointOfContactEmail: null,
              competencyFunction: null,
            },
          ],
        }),
      ],
      roster: [member],
      assets: [
        makeAsset({
          assetKey: 'asset-active',
          name: 'Engine 1',
        }),
      ],
    })

    expect(rows).toHaveLength(2)
    expect(rows.every((row) => row.assignedPosition === 'position:Operations Section Chief')).toBe(
      true
    )
    expect(rows.some((row) => row.name.includes('member-active'))).toBe(true)
    expect(rows.some((row) => row.name.includes('asset-active'))).toBe(true)
  })

  it('adds a position-only row when a next OP position has no assignees', () => {
    const catalog = makeCatalog(['Staging Area Manager'])
    const rows = buildIcs205aContactsFromNextOpRoster({
      catalog,
      positionEntries: [makeEntry({ position: 'Staging Area Manager' })],
      roster: [],
      assets: [],
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.assignedPosition).toBe('position:Staging Area Manager')
    expect(rows[0]?.name).toBe('')
  })

  it('adds single-resource people on the org chart for next OP', () => {
    const singleResource = makeMember({
      id: 'single-1',
      email: 'single@example.gov',
      assignmentKind: 'single_resource',
      icsPosition: '',
      icsPositions: [],
      orgChartReportsTo: 'Operations Section Chief',
    })
    const catalog = makeCatalog(['Operations Section Chief'])
    const rows = buildIcs205aContactsFromNextOpRoster({
      catalog,
      positionEntries: [makeEntry({ members: [] })],
      roster: [singleResource],
      assets: [],
    })

    expect(rows.some((row) => row.assignedPosition === 'single_resource:single-1')).toBe(true)
    expect(rows.find((row) => row.assignedPosition === 'single_resource:single-1')?.name).toBe(
      'single_resource:single-1'
    )
  })

  it('adds org-chart assets that are not attached to a position', () => {
    const catalog = makeCatalog(['Operations Section Chief'])
    const rows = buildIcs205aContactsFromNextOpRoster({
      catalog,
      positionEntries: [makeEntry()],
      roster: [],
      assets: [
        makeAsset({
          assetKey: 'org-chart-asset',
          name: 'Mobile Command',
          orgChartReportsTo: 'Operations Section Chief',
        }),
      ],
    })

    expect(rows.some((row) => row.assignedPosition === 'org_chart_asset:org-chart-asset')).toBe(true)
  })

  it('does not duplicate position-attached assets as org-chart rows', () => {
    const catalog = makeCatalog(['Operations Section Chief'])
    const rows = buildIcs205aContactsFromNextOpRoster({
      catalog,
      positionEntries: [
        makeEntry({
          assets: [
            {
              assetKey: 'asset-active',
              name: 'Engine 1',
              type: 'Engine',
              pointOfContactMemberId: null,
              pointOfContactEmail: null,
              competencyFunction: null,
            },
          ],
        }),
      ],
      roster: [],
      assets: [
        makeAsset({
          assetKey: 'asset-active',
          name: 'Engine 1',
          orgChartReportsTo: 'Operations Section Chief',
        }),
      ],
    })

    expect(rows.filter((row) => row.name.includes('asset-active'))).toHaveLength(1)
    expect(rows.some((row) => row.assignedPosition.startsWith('org_chart_asset:'))).toBe(false)
  })
})
