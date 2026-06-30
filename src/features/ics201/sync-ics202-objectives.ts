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

function objectivesSnapshot(objectives: Ics202ObjectiveRow[]): string {
  return JSON.stringify(
    objectives.map((objective) => ({
      id: objective.id,
      kind: objective.kind,
      objective: objective.objective,
      ics201SourceObjectiveId: objective.ics201SourceObjectiveId ?? null,
    }))
  )
}

export function syncIcs202ObjectivesFromIcs201(
  ics201Objectives: Ics201ObjectiveRow[],
  ics202Objectives: Ics202ObjectiveRow[]
): { objectives: Ics202ObjectiveRow[]; changed: boolean } {
  const sourceById = new Map<number, Ics201ObjectiveRow>()
  for (const row of ics201Objectives) {
    if (row.objective.trim()) {
      sourceById.set(row.id, {
        ...row,
        kind: normalizeIcs201ObjectiveKind(row.kind),
      })
    }
  }

  const next: Ics202ObjectiveRow[] = []
  const linkedSourceIds = new Set<number>()

  for (const objective of ics202Objectives) {
    const sourceId = normalizeIcs201SourceObjectiveId(objective.ics201SourceObjectiveId)
    if (sourceId == null) {
      next.push(objective)
      continue
    }

    const source = sourceById.get(sourceId)
    if (!source) {
      next.push(unlinkIcs202Objective(objective))
      continue
    }

    linkedSourceIds.add(sourceId)
    next.push(linkIcs202Objective(objective, source))
  }

  for (const [sourceId, source] of sourceById) {
    if (linkedSourceIds.has(sourceId)) {
      continue
    }
    next.push({
      id: nextIcs202ObjectiveId(next),
      kind: normalizeIcs202ObjectiveKind(source.kind),
      objective: source.objective.trim(),
      ics201SourceObjectiveId: source.id,
    })
  }

  return {
    objectives: next,
    changed: objectivesSnapshot(ics202Objectives) !== objectivesSnapshot(next),
  }
}
