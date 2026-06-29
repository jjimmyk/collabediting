import { describe, expect, it } from 'vitest'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import {
  buildIcs205aAssignedPositionOptions,
  buildIcs205aContactNameOptions,
  encodeCustomIcs205aName,
  mergeLegacyIcs205aContactNameOption,
  parseCustomIcs205aName,
  resolveDefaultNameForAssignedPosition,
} from '@/features/ics205a/ics205a-contact-row-options'
import { normalizeIcs205aFormState } from '@/features/ics205a/utils'
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

describe('ics205a contact row options', () => {
  it('includes active and scheduled positions plus single resources in assigned-position options', () => {
    const activeMember = makeMember({
      id: 'member-active',
      email: 'active@example.gov',
      icsPositions: ['Operations Section Chief'],
    })
    const scheduledMember = makeMember({
      id: 'member-scheduled',
      email: 'scheduled@example.gov',
      icsPositions: [],
    })
    const singleResource = makeMember({
      id: 'single-1',
      email: 'single@example.gov',
      assignmentKind: 'single_resource',
      icsPosition: '',
      icsPositions: [],
      orgChartReportsTo: 'Operations Section Chief',
    })

    const entries = [
      makeEntry({
        position: 'Operations Section Chief',
        members: [activeMember],
        scheduledAssignees: [scheduledMember],
      }),
      makeEntry({
        position: 'Staging Area Manager',
        scheduledAssignees: [scheduledMember],
      }),
    ]

    const roster = [activeMember, scheduledMember, singleResource]
    const catalog = makeCatalog(['Operations Section Chief', 'Staging Area Manager'])

    const options = buildIcs205aAssignedPositionOptions({
      roster,
      positionEntries: entries,
      catalog,
      assetsByKey: {},
    })

    expect(options.some((option) => option.value === 'position:Operations Section Chief')).toBe(
      true
    )
    expect(options.some((option) => option.value === 'position:Staging Area Manager')).toBe(true)
    expect(options.some((option) => option.group.includes('scheduled next OP'))).toBe(true)
    expect(options.some((option) => option.value === 'single_resource:single-1')).toBe(true)
  })

  it('lists active and scheduled members and assets for a selected position', () => {
    const activeMember = makeMember({
      id: 'member-active',
      email: 'active@example.gov',
      icsPositions: ['Operations Section Chief'],
    })
    const scheduledMember = makeMember({
      id: 'member-scheduled',
      email: 'scheduled@example.gov',
      icsPositions: [],
    })
    const entry = makeEntry({
      members: [activeMember],
      scheduledAssignees: [scheduledMember],
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
      scheduledAssignAssets: [
        {
          assetKey: 'asset-scheduled',
          name: 'Engine 2',
          type: 'Engine',
          pointOfContactMemberId: null,
          pointOfContactEmail: null,
          competencyFunction: null,
        },
      ],
    })

    const input = {
      roster: [activeMember, scheduledMember],
      positionEntries: [entry],
      assetsByKey: {},
    }

    const options = buildIcs205aContactNameOptions(input, 'position:Operations Section Chief')

    expect(options.some((option) => option.value.includes('member-active'))).toBe(true)
    expect(options.some((option) => option.value.includes('member-scheduled'))).toBe(true)
    expect(options.some((option) => option.value.includes('asset-active'))).toBe(true)
    expect(options.some((option) => option.value.includes('asset-scheduled'))).toBe(true)
  })

  it('auto-resolves a default name for single-resource assigned positions', () => {
    const singleResource = makeMember({
      id: 'single-1',
      email: 'single@example.gov',
      assignmentKind: 'single_resource',
      icsPosition: '',
      icsPositions: [],
      orgChartReportsTo: 'Operations Section Chief',
    })

    const input = {
      roster: [singleResource],
      positionEntries: [makeEntry({})],
      assetsByKey: {},
    }

    const defaultName = resolveDefaultNameForAssignedPosition('single_resource:single-1', input)
    const nameOptions = buildIcs205aContactNameOptions(input, 'single_resource:single-1')

    expect(defaultName).toBe('single_resource:single-1')
    expect(nameOptions).toHaveLength(1)
    expect(nameOptions[0]?.value).toBe('single_resource:single-1')
  })

  it('preserves legacy free-text name values', () => {
    const merged = mergeLegacyIcs205aContactNameOption([], 'Legacy Contact Name', [])
    expect(merged).toHaveLength(1)
    expect(merged[0]?.value).toBe('Legacy Contact Name')
    expect(merged[0]?.label).toContain('legacy')
  })

  it('preserves spaces in custom names while typing', () => {
    expect(encodeCustomIcs205aName('Bob Smith')).toBe('custom:Bob Smith')
    expect(parseCustomIcs205aName('custom:Bob Smith')).toBe('Bob Smith')
    expect(encodeCustomIcs205aName('Bob ')).toBe('custom:Bob ')
  })

  it('migrates legacy contactMethods into other on normalize', () => {
    const normalized = normalizeIcs205aFormState({
      id: 'doc-1',
      incidentName: 'Test',
      operationalPeriodDateFrom: '',
      operationalPeriodDateTo: '',
      operationalPeriodTimeFrom: '',
      operationalPeriodTimeTo: '',
      contactRows: [
        {
          id: 1,
          assignedPosition: 'Incident Commander',
          name: 'Jane Doe',
          cellPhone: '',
          radioFrequency: '',
          other: '',
          contactMethods: 'Radio: Command Net 1 · Cell: (555) 010-0101',
        },
      ],
      preparedByName: '',
      preparedByPositionTitle: '',
      preparedBySignature: '',
      preparedByDateTime: '',
    })

    expect(normalized.contactRows[0]?.other).toBe(
      'Radio: Command Net 1 · Cell: (555) 010-0101'
    )
    expect(normalized.contactRows[0]?.cellPhone).toBe('')
    expect(normalized.contactRows[0]?.radioFrequency).toBe('')
  })
})
