import type { Ics201ObjectiveRow } from '@/features/ics201/types'
import type { Ics202ObjectiveRow } from '@/features/ics202/types'
import { normalizeIcs201ObjectiveKind } from '@/features/ics201/utils'
import { normalizeIcs202ObjectiveKind } from '@/features/ics202/utils'

function nextIcs202ObjectiveId(rows: Ics202ObjectiveRow[]): number {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.id)) + 1
}

function normalizeIcs201SourceObjectiveId(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function unlinkIcs202Objective(objective: Ics202ObjectiveRow): Ics202ObjectiveRow {
  return {
    ...objective,
    ics201SourceObjectiveId: null,
  }
}

function linkIcs202Objective(
  objective: Ics202ObjectiveRow,
  source: Ics201ObjectiveRow
): Ics202ObjectiveRow {
  return {
    ...objective,
    kind: normalizeIcs202ObjectiveKind(source.kind),
    objective: source.objective.trim(),
    ics201SourceObjectiveId: source.id,
  }
}

function ics202ObjectivesSnapshot(objectives: Ics202ObjectiveRow[]): string {
  return JSON.stringify(
    objectives.map((objective) => ({
      id: objective.id,
      kind: objective.kind,
      objective: objective.objective,
      ics201SourceObjectiveId: objective.ics201SourceObjectiveId ?? null,
    }))
  )
}

function ics201ObjectivesSnapshot(objectives: Ics201ObjectiveRow[]): string {
  return JSON.stringify(
    objectives.map((objective) => ({
      id: objective.id,
      kind: objective.kind,
      objective: objective.objective,
    }))
  )
}

function syncIcs202ObjectivesContentFromIcs201(
  ics201Objectives: Ics201ObjectiveRow[],
  ics202Objectives: Ics202ObjectiveRow[]
): Ics202ObjectiveRow[] {
  const sourceById = new Map<number, Ics201ObjectiveRow>()
  for (const row of ics201Objectives) {
    if (row.objective.trim()) {
      sourceById.set(row.id, {
        ...row,
        kind: normalizeIcs201ObjectiveKind(row.kind),
      })
    }
  }

  const contentSynced: Ics202ObjectiveRow[] = []
  const linkedSourceIds = new Set<number>()
  const linkedBySourceId = new Map<number, Ics202ObjectiveRow>()

  for (const objective of ics202Objectives) {
    const sourceId = normalizeIcs201SourceObjectiveId(objective.ics201SourceObjectiveId)
    if (sourceId == null) {
      contentSynced.push(objective)
      continue
    }

    const source = sourceById.get(sourceId)
    if (!source) {
      contentSynced.push(unlinkIcs202Objective(objective))
      continue
    }

    linkedSourceIds.add(sourceId)
    const linked = linkIcs202Objective(objective, source)
    linkedBySourceId.set(sourceId, linked)
    contentSynced.push(linked)
  }

  for (const [sourceId, source] of sourceById) {
    if (linkedSourceIds.has(sourceId)) {
      continue
    }
    const created: Ics202ObjectiveRow = {
      id: nextIcs202ObjectiveId(contentSynced),
      kind: normalizeIcs202ObjectiveKind(source.kind),
      objective: source.objective.trim(),
      ics201SourceObjectiveId: source.id,
    }
    linkedBySourceId.set(sourceId, created)
    contentSynced.push(created)
  }

  return contentSynced
}

function orderIcs202ObjectivesFromIcs201(
  ics201Objectives: Ics201ObjectiveRow[],
  contentSynced: Ics202ObjectiveRow[]
): Ics202ObjectiveRow[] {
  const sourceById = new Map<number, Ics201ObjectiveRow>()
  for (const row of ics201Objectives) {
    if (row.objective.trim()) {
      sourceById.set(row.id, row)
    }
  }

  const linkedBySourceId = new Map<number, Ics202ObjectiveRow>()
  const unlinked: Ics202ObjectiveRow[] = []

  for (const objective of contentSynced) {
    const sourceId = normalizeIcs201SourceObjectiveId(objective.ics201SourceObjectiveId)
    if (sourceId == null || !sourceById.has(sourceId)) {
      if (sourceId == null) {
        unlinked.push(objective)
      } else {
        unlinked.push(objective)
      }
      continue
    }
    linkedBySourceId.set(sourceId, objective)
  }

  const orderedLinked: Ics202ObjectiveRow[] = []
  const placedSourceIds = new Set<number>()

  for (const source of ics201Objectives) {
    if (!source.objective.trim()) {
      continue
    }
    const linked = linkedBySourceId.get(source.id)
    if (linked) {
      orderedLinked.push(linked)
      placedSourceIds.add(source.id)
    }
  }

  for (const [sourceId, linked] of linkedBySourceId) {
    if (!placedSourceIds.has(sourceId)) {
      orderedLinked.push(linked)
    }
  }

  return [...orderedLinked, ...unlinked]
}

export function syncIcs202ObjectivesFromIcs201(
  ics201Objectives: Ics201ObjectiveRow[],
  ics202Objectives: Ics202ObjectiveRow[]
): { objectives: Ics202ObjectiveRow[]; changed: boolean } {
  const contentSynced = syncIcs202ObjectivesContentFromIcs201(ics201Objectives, ics202Objectives)
  const next = orderIcs202ObjectivesFromIcs201(ics201Objectives, contentSynced)

  return {
    objectives: next,
    changed: ics202ObjectivesSnapshot(ics202Objectives) !== ics202ObjectivesSnapshot(next),
  }
}

export function syncIcs201ObjectivesOrderFromIcs202(
  ics201Objectives: Ics201ObjectiveRow[],
  ics202Objectives: Ics202ObjectiveRow[]
): { objectives: Ics201ObjectiveRow[]; changed: boolean } {
  const ics201ById = new Map(ics201Objectives.map((row) => [row.id, row]))
  const linkedSourceIdsInOrder: number[] = []
  const seenSourceIds = new Set<number>()

  for (const objective of ics202Objectives) {
    const sourceId = normalizeIcs201SourceObjectiveId(objective.ics201SourceObjectiveId)
    if (sourceId == null || seenSourceIds.has(sourceId) || !ics201ById.has(sourceId)) {
      continue
    }
    linkedSourceIdsInOrder.push(sourceId)
    seenSourceIds.add(sourceId)
  }

  const next: Ics201ObjectiveRow[] = []
  const placedIds = new Set<number>()

  for (const sourceId of linkedSourceIdsInOrder) {
    const row = ics201ById.get(sourceId)
    if (row) {
      next.push(row)
      placedIds.add(sourceId)
    }
  }

  for (const row of ics201Objectives) {
    if (!placedIds.has(row.id)) {
      next.push(row)
    }
  }

  return {
    objectives: next,
    changed: ics201ObjectivesSnapshot(ics201Objectives) !== ics201ObjectivesSnapshot(next),
  }
}
