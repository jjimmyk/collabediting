import { describe, expect, it } from 'vitest'
import { buildIcs234MatrixTableRows } from '@/features/ics234/build-ics234-matrix-table-rows'
import type { Ics234ObjectiveRow } from '@/features/ics234/types'

function makeObjective(
  id: number,
  strategies: Ics234ObjectiveRow['strategies'] = []
): Ics234ObjectiveRow {
  return { id, name: `Objective ${id}`, strategies }
}

describe('buildIcs234MatrixTableRows', () => {
  it('returns one row for an objective with no strategies', () => {
    const rows = buildIcs234MatrixTableRows([makeObjective(1)])

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      showObjective: true,
      objectiveRowSpan: 1,
      showStrategy: false,
      strategy: null,
      tactic: null,
    })
  })

  it('returns one row for a strategy with no tactics', () => {
    const rows = buildIcs234MatrixTableRows([
      makeObjective(1, [{ id: 10, name: 'Strategy A', tactics: [] }]),
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      showObjective: true,
      objectiveRowSpan: 1,
      showStrategy: true,
      strategyRowSpan: 1,
      strategy: { id: 10 },
      tactic: null,
    })
  })

  it('spans strategy cells across multiple tactics', () => {
    const rows = buildIcs234MatrixTableRows([
      makeObjective(1, [
        {
          id: 10,
          name: 'Strategy A',
          tactics: [
            { id: 100, name: 'Tactic 1' },
            { id: 101, name: 'Tactic 2' },
          ],
        },
      ]),
    ])

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      showObjective: true,
      objectiveRowSpan: 2,
      showStrategy: true,
      strategyRowSpan: 2,
      tactic: { id: 100 },
    })
    expect(rows[1]).toMatchObject({
      showObjective: false,
      showStrategy: false,
      tactic: { id: 101 },
    })
  })

  it('builds independent row groups for multiple objectives and strategies', () => {
    const rows = buildIcs234MatrixTableRows([
      makeObjective(1, [
        {
          id: 10,
          name: 'Strategy A',
          tactics: [{ id: 100, name: 'Tactic 1' }, { id: 101, name: 'Tactic 2' }],
        },
        {
          id: 11,
          name: 'Strategy B',
          tactics: [{ id: 110, name: 'Tactic 3' }],
        },
      ]),
      makeObjective(2),
    ])

    expect(rows).toHaveLength(4)

    expect(rows[0]).toMatchObject({
      objective: { id: 1 },
      showObjective: true,
      objectiveRowSpan: 3,
      showStrategy: true,
      strategyRowSpan: 2,
    })
    expect(rows[1]).toMatchObject({
      objective: { id: 1 },
      showObjective: false,
      showStrategy: false,
    })
    expect(rows[2]).toMatchObject({
      objective: { id: 1 },
      showObjective: false,
      showStrategy: true,
      strategyRowSpan: 1,
      strategy: { id: 11 },
    })
    expect(rows[3]).toMatchObject({
      objective: { id: 2 },
      showObjective: true,
      objectiveRowSpan: 1,
      showStrategy: false,
      strategy: null,
    })
  })
})
