import { describe, expect, it } from 'vitest'
import { buildIcs215ExportLayout } from '@/features/ics215/export-layout'
import type { Ics215FormState } from '@/features/ics215/types'
import {
  flattenIcs234Tactics,
  normalizeIcs234TacticRef,
  parseIcs234TacticRefKey,
  resolveIcs234TacticLabel,
  ics234TacticRefKey,
} from '@/features/ics215/resolve-ics234-tactic'
import type { Ics234ObjectiveRow } from '@/features/ics234/types'
import { cloneIcs215WorkAssignmentRows } from '@/features/ics215/utils'

const objectives: Ics234ObjectiveRow[] = [
  {
    id: 1,
    name: 'Objective A',
    strategies: [
      {
        id: 10,
        name: 'Strategy X',
        tactics: [
          { id: 100, name: 'Establish perimeter' },
          { id: 101, name: 'Deploy teams' },
        ],
      },
    ],
  },
]

describe('resolve-ics234-tactic', () => {
  it('flattens tactics with breadcrumb labels', () => {
    const options = flattenIcs234Tactics(objectives)
    expect(options).toHaveLength(2)
    expect(options[0]).toMatchObject({
      label: 'Establish perimeter',
      breadcrumb: 'Objective A · Strategy X',
    })
  })

  it('resolves tactic label by ref', () => {
    const ref = { objectiveId: 1, strategyId: 10, tacticId: 100 }
    expect(resolveIcs234TacticLabel(objectives, ref)).toEqual({
      label: 'Establish perimeter',
      stale: false,
    })
  })

  it('marks missing tactics as stale', () => {
    const ref = { objectiveId: 1, strategyId: 10, tacticId: 999 }
    expect(resolveIcs234TacticLabel(objectives, ref)).toEqual({
      label: '(removed tactic)',
      stale: true,
    })
  })

  it('round-trips ref keys', () => {
    const ref = { objectiveId: 1, strategyId: 10, tacticId: 100 }
    expect(parseIcs234TacticRefKey(ics234TacticRefKey(ref))).toEqual(ref)
  })

  it('normalizes valid tactic refs', () => {
    expect(
      normalizeIcs234TacticRef({ objectiveId: 1, strategyId: 10, tacticId: 100 })
    ).toEqual({
      objectiveId: 1,
      strategyId: 10,
      tacticId: 100,
    })
    expect(normalizeIcs234TacticRef(null)).toBeNull()
    expect(normalizeIcs234TacticRef({ bad: true })).toBeNull()
  })
})

describe('ics215 tactic ref persistence', () => {
  it('preserves ics234TacticRef when cloning rows', () => {
    const columns = [{ id: 'col-1', label: 'Personnel' }]
    const rows = cloneIcs215WorkAssignmentRows(
      [
        {
          id: 1,
          assignee: '',
          workAssignment: 'Test',
          ics234TacticRef: { objectiveId: 1, strategyId: 10, tacticId: 100 },
          resourceValues: {},
          overheadPositions: '',
          specialEquipmentSupplies: '',
          reportingLocation: '',
          requestedArrivalTime: '',
          status: '',
        },
      ],
      columns
    )
    expect(rows[0]?.ics234TacticRef).toEqual({
      objectiveId: 1,
      strategyId: 10,
      tacticId: 100,
    })
  })
})

describe('ics215 export excludes tactic', () => {
  it('does not include ics234TacticRef on export rows', () => {
    const form: Ics215FormState = {
      id: 'local-test',
      incidentName: 'Test Incident',
      operationalPeriodDateFrom: '',
      operationalPeriodDateTo: '',
      operationalPeriodTimeFrom: '',
      operationalPeriodTimeTo: '',
      resourceColumns: [{ id: 'col-1', label: 'Personnel' }],
      workAssignments: [
        {
          id: 1,
          assignee: 'position:IC',
          workAssignment: 'Coordinate ops',
          ics234TacticRef: { objectiveId: 1, strategyId: 10, tacticId: 100 },
          resourceValues: {
            'col-1': { required: '1', have: '1', need: '0' },
          },
          overheadPositions: '',
          specialEquipmentSupplies: '',
          reportingLocation: '',
          requestedArrivalTime: '',
          status: '',
        },
      ],
      totalResourcesRequired: '1',
      totalResourcesHaveOnHand: '1',
      totalResourcesNeedToOrder: '0',
      preparedByName: '',
      preparedByPositionTitle: '',
      preparedBySignature: '',
      preparedDateTime: '',
    }

    const layout = buildIcs215ExportLayout(form)
    const table = layout.find((block) => block.kind === 'work-assignments-table')
    expect(table?.kind).toBe('work-assignments-table')
    if (table?.kind !== 'work-assignments-table') return

    const exportRow = table.rows[0]
    expect(exportRow).toBeDefined()
    expect(exportRow).not.toHaveProperty('ics234TacticRef')
    expect(Object.keys(exportRow ?? {})).toEqual([
      'assignee',
      'workAssignment',
      'resourceValues',
      'overheadPositions',
      'specialEquipmentSupplies',
      'reportingLocation',
      'requestedArrivalTime',
    ])
  })
})
