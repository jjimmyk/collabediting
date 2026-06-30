import { describe, expect, it } from 'vitest'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  buildIcs203FromNextOpRoster,
  formatIcs203RosterAssignee,
  joinIcs203RosterAssignees,
} from '@/features/ics203/build-ics203-from-roster'
import { createEmptyIcs203Form } from '@/features/ics203/utils'
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

function makeCatalog(
  positions: string[],
  custom: WorkspacePositionCatalog['customPositions'] = []
): WorkspacePositionCatalog {
  return {
    rosterPositionNames: positions,
    orgChartPositionNames: positions,
    allPositionNames: positions,
    standardPositions: positions.filter((position) => !custom.some((row) => row.name === position)),
    customPositions: custom,
    customPositionNames: new Set(custom.map((row) => row.name)),
    positionMetaByName: Object.fromEntries([
      ...positions.map((position) => [
        position,
        {
          name: position,
          source: custom.some((row) => row.name === position) ? ('custom' as const) : ('standard' as const),
          lifecycleStatus: 'active' as const,
          isPlanned: false,
          opAdvanceLabel: null,
          isOnOrgChart: true,
          isArchived: false,
          ...(custom.find((row) => row.name === position)
            ? { reportsTo: custom.find((row) => row.name === position)!.reportsTo }
            : {}),
        },
      ]),
    ]),
  }
}

describe('formatIcs203RosterAssignee', () => {
  it('formats display name and email', () => {
    expect(formatIcs203RosterAssignee(makeMember({ email: 'jane.doe@agency.gov' }))).toBe(
      'Jane Doe (jane.doe@agency.gov)'
    )
  })
})

describe('buildIcs203FromNextOpRoster', () => {
  const emptyForm = createEmptyIcs203Form('test-doc', {
    incidentName: 'Incident Alpha',
    operationalPeriodFrom: '2026-05-14T06:00',
    operationalPeriodTo: '2026-05-14T18:00',
    preparedByName: 'Planner',
    preparedByPositionTitle: 'Planning Section Chief',
  })

  it('maps standard positions with Name (email) format', () => {
    const opsChief = makeMember({
      id: 'ops-chief',
      email: 'ops.chief@example.gov',
      icsPositions: ['Operations Section Chief'],
    })
    const catalog = makeCatalog(['Operations Section Chief'])
    const result = buildIcs203FromNextOpRoster({
      currentForm: emptyForm,
      catalog,
      positionEntries: [makeEntry({ members: [opsChief] })],
      roster: [opsChief],
      assets: [],
    })

    expect(result.form.operationsChief).toBe('Ops Chief (ops.chief@example.gov)')
    expect(result.filledFieldCount).toBeGreaterThan(0)
  })

  it('applies next OP projection for scheduled assignees', () => {
    const scheduledMember = makeMember({
      id: 'scheduled',
      email: 'scheduled@example.gov',
      icsPositions: [],
    })
    const catalog = makeCatalog(['Planning Section Chief'])
    const result = buildIcs203FromNextOpRoster({
      currentForm: emptyForm,
      catalog,
      positionEntries: [
        makeEntry({
          position: 'Planning Section Chief',
          scheduledAssignees: [scheduledMember],
        }),
      ],
      roster: [scheduledMember],
      assets: [],
    })

    expect(result.form.planningChief).toBe('Scheduled (scheduled@example.gov)')
  })

  it('joins multiple incident commanders', () => {
    const icOne = makeMember({
      id: 'ic-1',
      email: 'ic.one@example.gov',
      icsPositions: ['Incident Commander'],
    })
    const icTwo = makeMember({
      id: 'ic-2',
      email: 'ic.two@example.gov',
      icsPositions: ['Incident Commander'],
    })
    const catalog = makeCatalog(['Incident Commander'])
    const result = buildIcs203FromNextOpRoster({
      currentForm: emptyForm,
      catalog,
      positionEntries: [makeEntry({ position: 'Incident Commander', members: [icOne, icTwo] })],
      roster: [icOne, icTwo],
      assets: [],
    })

    expect(result.form.icUcs).toBe(
      joinIcs203RosterAssignees([icOne, icTwo])
    )
  })

  it('builds operations branch and division group rows', () => {
    const branchDirector = makeMember({
      id: 'branch-dir',
      email: 'branch.dir@example.gov',
      icsPositions: ['Branch Alpha'],
    })
    const groupSupervisor = makeMember({
      id: 'group-sup',
      email: 'group.sup@example.gov',
      icsPositions: ['Division 1'],
    })
    const custom = [
      {
        id: 'branch-alpha',
        name: 'Branch Alpha',
        reportsTo: 'Operations Section Chief',
        sortOrder: 1,
        lifecycleStatus: 'active' as const,
      },
      {
        id: 'division-1',
        name: 'Division 1',
        reportsTo: 'Branch Alpha',
        sortOrder: 2,
        lifecycleStatus: 'active' as const,
      },
    ]
    const catalog = makeCatalog(
      ['Operations Section Chief', 'Branch Alpha', 'Division 1'],
      custom
    )
    const result = buildIcs203FromNextOpRoster({
      currentForm: emptyForm,
      catalog,
      positionEntries: [
        makeEntry({ position: 'Operations Section Chief', members: [] }),
        makeEntry({
          position: 'Branch Alpha',
          members: [branchDirector],
          positionType: 'branch',
        }),
        makeEntry({
          position: 'Division 1',
          members: [groupSupervisor],
          positionType: 'group',
        }),
      ],
      roster: [branchDirector, groupSupervisor],
      assets: [],
    })

    expect(result.form.operationsBranches).toHaveLength(1)
    expect(result.form.operationsBranches[0]?.branchDirector).toBe(
      'Branch Dir (branch.dir@example.gov)'
    )
    expect(result.form.operationsBranches[0]?.divisionGroups[0]?.supervisorName).toBe(
      'Group Sup (group.sup@example.gov)'
    )
  })

  it('preserves incident info and prepared-by', () => {
    const catalog = makeCatalog([])
    const result = buildIcs203FromNextOpRoster({
      currentForm: emptyForm,
      catalog,
      positionEntries: [],
      roster: [],
      assets: [],
    })

    expect(result.form.incidentName).toBe('Incident Alpha')
    expect(result.form.operationalPeriodFrom).toBe('2026-05-14T06:00')
    expect(result.form.preparedByName).toBe('Planner')
    expect(result.filledFieldCount).toBe(0)
  })

  it('adds agency representatives for single resources reporting to IC', () => {
    const agencyRep = makeMember({
      id: 'agency-rep',
      email: 'agency.rep@example.gov',
      assignmentKind: 'single_resource',
      icsPosition: '',
      icsPositions: [],
      orgChartReportsTo: 'Incident Commander',
    })
    const catalog = makeCatalog(['Incident Commander'])
    const result = buildIcs203FromNextOpRoster({
      currentForm: emptyForm,
      catalog,
      positionEntries: [makeEntry({ position: 'Incident Commander', members: [] })],
      roster: [agencyRep],
      assets: [],
    })

    expect(result.form.agencyRepresentatives).toHaveLength(1)
    expect(result.form.agencyRepresentatives[0]?.representativeName).toBe(
      'Agency Rep (agency.rep@example.gov)'
    )
  })
})
