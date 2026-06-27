import { describe, expect, it } from 'vitest'
import type { Ics202ObjectiveRow } from '@/features/ics202/types'
import type { Ics234ObjectiveRow } from '@/features/ics234/types'
import {
  formatIcs202SourceLabel,
  isIcs202ObjectiveEligibleForIcs234,
  syncIcs234ObjectivesFromIcs202,
} from '@/features/ics234/sync-ics202-objectives'

describe('sync-ics202-objectives', () => {
  it('identifies eligible ICS-202 objective kinds', () => {
    expect(isIcs202ObjectiveEligibleForIcs234('O')).toBe(true)
    expect(isIcs202ObjectiveEligibleForIcs234('O&M')).toBe(true)
    expect(isIcs202ObjectiveEligibleForIcs234('M')).toBe(false)
    expect(isIcs202ObjectiveEligibleForIcs234('')).toBe(false)
  })

  it('creates linked ICS-234 objectives for operational ICS-202 rows', () => {
    const ics202Objectives: Ics202ObjectiveRow[] = [
      { id: 1, kind: 'O', objective: 'Stabilize incident perimeter' },
      { id: 2, kind: 'M', objective: 'Brief elected officials' },
      { id: 3, kind: 'O&M', objective: 'Restore critical infrastructure' },
    ]

    const { objectives, changed } = syncIcs234ObjectivesFromIcs202(ics202Objectives, [])

    expect(changed).toBe(true)
    expect(objectives).toHaveLength(2)
    expect(objectives[0]).toMatchObject({
      name: 'Stabilize incident perimeter',
      ics202SourceObjectiveId: 1,
      ics202SourceKind: 'O',
      strategies: [],
    })
    expect(objectives[1]).toMatchObject({
      name: 'Restore critical infrastructure',
      ics202SourceObjectiveId: 3,
      ics202SourceKind: 'O&M',
    })
  })

  it('updates linked objective names while preserving strategies', () => {
    const ics202Objectives: Ics202ObjectiveRow[] = [
      { id: 1, kind: 'O', objective: 'Updated objective text' },
    ]
    const ics234Objectives: Ics234ObjectiveRow[] = [
      {
        id: 10,
        name: 'Old text',
        ics202SourceObjectiveId: 1,
        ics202SourceKind: 'O',
        strategies: [
          {
            id: 20,
            name: 'Strategy A',
            tactics: [{ id: 30, name: 'Tactic A' }],
          },
        ],
      },
    ]

    const { objectives, changed } = syncIcs234ObjectivesFromIcs202(
      ics202Objectives,
      ics234Objectives
    )

    expect(changed).toBe(true)
    expect(objectives[0]?.name).toBe('Updated objective text')
    expect(objectives[0]?.strategies).toEqual(ics234Objectives[0]?.strategies)
  })

  it('converts linked objectives to manual when ICS-202 source is no longer eligible', () => {
    const ics202Objectives: Ics202ObjectiveRow[] = [
      { id: 1, kind: 'M', objective: 'Now managerial only' },
    ]
    const ics234Objectives: Ics234ObjectiveRow[] = [
      {
        id: 10,
        name: 'Previously operational',
        ics202SourceObjectiveId: 1,
        ics202SourceKind: 'O',
        strategies: [{ id: 20, name: 'Keep me', tactics: [] }],
      },
    ]

    const { objectives, changed } = syncIcs234ObjectivesFromIcs202(
      ics202Objectives,
      ics234Objectives
    )

    expect(changed).toBe(true)
    expect(objectives).toHaveLength(1)
    expect(objectives[0]).toMatchObject({
      id: 10,
      name: 'Previously operational',
      ics202SourceObjectiveId: null,
      ics202SourceKind: null,
      strategies: [{ id: 20, name: 'Keep me', tactics: [] }],
    })
  })

  it('leaves manual ICS-234 objectives untouched', () => {
    const manual: Ics234ObjectiveRow[] = [
      {
        id: 99,
        name: 'Manual objective',
        strategies: [],
        ics202SourceObjectiveId: null,
        ics202SourceKind: null,
      },
    ]

    const { objectives, changed } = syncIcs234ObjectivesFromIcs202(
      [{ id: 1, kind: 'O', objective: 'Synced objective' }],
      manual
    )

    expect(changed).toBe(true)
    expect(objectives.find((row) => row.id === 99)).toMatchObject({
      name: 'Manual objective',
      ics202SourceObjectiveId: null,
    })
    expect(objectives.find((row) => row.ics202SourceObjectiveId === 1)?.name).toBe(
      'Synced objective'
    )
  })

  it('formats ICS-202 source labels', () => {
    expect(formatIcs202SourceLabel('O')).toBe('Operational')
    expect(formatIcs202SourceLabel('O&M')).toBe('Operational & Managerial')
  })
})
