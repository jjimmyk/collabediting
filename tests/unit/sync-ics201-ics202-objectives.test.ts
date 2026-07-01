import { describe, expect, it } from 'vitest'
import {
  syncIcs201ObjectivesOrderFromIcs202,
  syncIcs202ObjectivesFromIcs201,
} from '@/features/ics201/sync-ics202-objectives'
import { normalizeIcs201ObjectiveRows } from '@/features/ics201/utils'
import type { Ics201ObjectiveRow } from '@/features/ics201/types'
import type { Ics202ObjectiveRow } from '@/features/ics202/types'

describe('normalizeIcs201ObjectiveRows', () => {
  it('converts legacy string[] objectives', () => {
    expect(normalizeIcs201ObjectiveRows(['Protect life safety', 'Maintain access'])).toEqual([
      { id: 1, kind: 'O', objective: 'Protect life safety' },
      { id: 2, kind: 'O', objective: 'Maintain access' },
    ])
  })

  it('normalizes structured objective rows', () => {
    expect(
      normalizeIcs201ObjectiveRows([
        { id: 3, kind: 'M', objective: 'Brief elected officials' },
        { id: 4, kind: 'O/M', objective: 'Restore infrastructure' },
      ])
    ).toEqual([
      { id: 3, kind: 'M', objective: 'Brief elected officials' },
      { id: 4, kind: 'O&M', objective: 'Restore infrastructure' },
    ])
  })
})

describe('syncIcs202ObjectivesFromIcs201', () => {
  const ics201Objectives: Ics201ObjectiveRow[] = [
    { id: 1, kind: 'O', objective: 'Protect life safety' },
    { id: 2, kind: 'M', objective: 'Brief elected officials' },
  ]

  it('adds new ICS-201 objectives to ICS-202', () => {
    const result = syncIcs202ObjectivesFromIcs201(ics201Objectives, [])
    expect(result.changed).toBe(true)
    expect(result.objectives).toEqual([
      { id: 1, kind: 'O', objective: 'Protect life safety', ics201SourceObjectiveId: 1 },
      { id: 2, kind: 'M', objective: 'Brief elected officials', ics201SourceObjectiveId: 2 },
    ])
  })

  it('updates linked ICS-202 rows from ICS-201', () => {
    const existing: Ics202ObjectiveRow[] = [
      {
        id: 10,
        kind: 'O',
        objective: 'Old text',
        ics201SourceObjectiveId: 1,
      },
    ]
    const result = syncIcs202ObjectivesFromIcs201(ics201Objectives, existing)
    expect(result.changed).toBe(true)
    expect(result.objectives[0]).toEqual({
      id: 10,
      kind: 'O',
      objective: 'Protect life safety',
      ics201SourceObjectiveId: 1,
    })
    expect(result.objectives[1]).toEqual({
      id: 11,
      kind: 'M',
      objective: 'Brief elected officials',
      ics201SourceObjectiveId: 2,
    })
  })

  it('preserves manual ICS-202-only objectives after linked rows', () => {
    const existing: Ics202ObjectiveRow[] = [
      { id: 5, kind: 'M', objective: 'Manual objective', ics201SourceObjectiveId: null },
    ]
    const result = syncIcs202ObjectivesFromIcs201(ics201Objectives, existing)
    expect(result.objectives.some((row) => row.objective === 'Manual objective')).toBe(true)
    expect(result.objectives[result.objectives.length - 1]?.objective).toBe('Manual objective')
  })

  it('reorders linked ICS-202 rows to match ICS-201 priority', () => {
    const ics201Reordered: Ics201ObjectiveRow[] = [
      { id: 2, kind: 'M', objective: 'Brief elected officials' },
      { id: 1, kind: 'O', objective: 'Protect life safety' },
    ]
    const existing: Ics202ObjectiveRow[] = [
      {
        id: 10,
        kind: 'O',
        objective: 'Protect life safety',
        ics201SourceObjectiveId: 1,
      },
      {
        id: 11,
        kind: 'M',
        objective: 'Brief elected officials',
        ics201SourceObjectiveId: 2,
      },
      { id: 5, kind: 'M', objective: 'Manual objective', ics201SourceObjectiveId: null },
    ]
    const result = syncIcs202ObjectivesFromIcs201(ics201Reordered, existing)
    expect(result.changed).toBe(true)
    expect(result.objectives.map((row) => row.id)).toEqual([11, 10, 5])
  })

  it('unlinks ICS-202 rows when ICS-201 source is removed', () => {
    const existing: Ics202ObjectiveRow[] = [
      {
        id: 10,
        kind: 'O',
        objective: 'Protect life safety',
        ics201SourceObjectiveId: 1,
      },
      {
        id: 11,
        kind: 'M',
        objective: 'Removed source',
        ics201SourceObjectiveId: 99,
      },
    ]
    const result = syncIcs202ObjectivesFromIcs201(ics201Objectives, existing)
    const unlinked = result.objectives.find((row) => row.id === 11)
    expect(unlinked?.ics201SourceObjectiveId).toBeNull()
    expect(unlinked?.objective).toBe('Removed source')
  })

  it('is idempotent when nothing changed', () => {
    const synced = syncIcs202ObjectivesFromIcs201(ics201Objectives, []).objectives
    const result = syncIcs202ObjectivesFromIcs201(ics201Objectives, synced)
    expect(result.changed).toBe(false)
    expect(result.objectives).toEqual(synced)
  })

  it('skips empty ICS-201 objective text', () => {
    const result = syncIcs202ObjectivesFromIcs201(
      [{ id: 1, kind: 'O', objective: '   ' }],
      []
    )
    expect(result.objectives).toEqual([])
    expect(result.changed).toBe(false)
  })
})

describe('syncIcs201ObjectivesOrderFromIcs202', () => {
  const ics201Objectives: Ics201ObjectiveRow[] = [
    { id: 1, kind: 'O', objective: 'Protect life safety' },
    { id: 2, kind: 'M', objective: 'Brief elected officials' },
    { id: 3, kind: 'O', objective: 'ICS-201 only objective' },
  ]

  it('reorders linked ICS-201 rows to match ICS-202 priority', () => {
    const ics202Objectives: Ics202ObjectiveRow[] = [
      {
        id: 11,
        kind: 'M',
        objective: 'Brief elected officials',
        ics201SourceObjectiveId: 2,
      },
      {
        id: 10,
        kind: 'O',
        objective: 'Protect life safety',
        ics201SourceObjectiveId: 1,
      },
    ]
    const result = syncIcs201ObjectivesOrderFromIcs202(ics201Objectives, ics202Objectives)
    expect(result.changed).toBe(true)
    expect(result.objectives.map((row) => row.id)).toEqual([2, 1, 3])
  })

  it('keeps ICS-201-only rows after linked rows in prior relative order', () => {
    const ics202Objectives: Ics202ObjectiveRow[] = [
      {
        id: 10,
        kind: 'O',
        objective: 'Protect life safety',
        ics201SourceObjectiveId: 1,
      },
      { id: 5, kind: 'M', objective: 'Manual ICS-202 objective', ics201SourceObjectiveId: null },
    ]
    const result = syncIcs201ObjectivesOrderFromIcs202(ics201Objectives, ics202Objectives)
    expect(result.objectives.map((row) => row.id)).toEqual([1, 2, 3])
  })

  it('is idempotent on round-trip order sync', () => {
    const ics201Reordered: Ics201ObjectiveRow[] = [
      { id: 2, kind: 'M', objective: 'Brief elected officials' },
      { id: 1, kind: 'O', objective: 'Protect life safety' },
    ]
    const synced202 = syncIcs202ObjectivesFromIcs201(ics201Reordered, [
      {
        id: 10,
        kind: 'O',
        objective: 'Protect life safety',
        ics201SourceObjectiveId: 1,
      },
      {
        id: 11,
        kind: 'M',
        objective: 'Brief elected officials',
        ics201SourceObjectiveId: 2,
      },
    ]).objectives
    const roundTrip = syncIcs202ObjectivesFromIcs201(ics201Reordered, synced202)
    expect(roundTrip.changed).toBe(false)
    expect(roundTrip.objectives).toEqual(synced202)
  })
})
