import type { Ics202ObjectiveRow } from '@/features/ics202/types'
import type { Ics234Ics202SourceKind, Ics234ObjectiveRow } from '@/features/ics234/types'
import { nextRowId } from '@/features/ics234/utils'

export function isIcs202ObjectiveEligibleForIcs234(
  kind: Ics202ObjectiveRow['kind']
): kind is Ics234Ics202SourceKind {
  return kind === 'O' || kind === 'O&M'
}

export function formatIcs202SourceLabel(kind: Ics234Ics202SourceKind): string {
  return kind === 'O' ? 'Operational' : 'Operational & Managerial'
}

function unlinkIcs234Objective(objective: Ics234ObjectiveRow): Ics234ObjectiveRow {
  return {
    ...objective,
    ics202SourceObjectiveId: null,
    ics202SourceKind: null,
  }
}

function linkIcs234Objective(
  objective: Ics234ObjectiveRow,
  source: Ics202ObjectiveRow
): Ics234ObjectiveRow {
  return {
    ...objective,
    name: source.objective.trim(),
    ics202SourceObjectiveId: source.id,
    ics202SourceKind: source.kind as Ics234Ics202SourceKind,
  }
}

function objectivesSnapshot(objectives: Ics234ObjectiveRow[]): string {
  return JSON.stringify(
    objectives.map((objective) => ({
      id: objective.id,
      name: objective.name,
      ics202SourceObjectiveId: objective.ics202SourceObjectiveId ?? null,
      ics202SourceKind: objective.ics202SourceKind ?? null,
      strategies: objective.strategies.map((strategy) => ({
        id: strategy.id,
        name: strategy.name,
        tactics: strategy.tactics.map((tactic) => ({
          id: tactic.id,
          name: tactic.name,
        })),
      })),
    }))
  )
}

export function syncIcs234ObjectivesFromIcs202(
  ics202Objectives: Ics202ObjectiveRow[],
  ics234Objectives: Ics234ObjectiveRow[]
): { objectives: Ics234ObjectiveRow[]; changed: boolean } {
  const eligibleById = new Map<number, Ics202ObjectiveRow>()
  for (const row of ics202Objectives) {
    if (isIcs202ObjectiveEligibleForIcs234(row.kind) && row.objective.trim()) {
      eligibleById.set(row.id, row)
    }
  }

  const next: Ics234ObjectiveRow[] = []
  const linkedSourceIds = new Set<number>()

  for (const objective of ics234Objectives) {
    const sourceId = objective.ics202SourceObjectiveId
    if (sourceId == null) {
      next.push(objective)
      continue
    }

    const source = eligibleById.get(sourceId)
    if (!source) {
      next.push(unlinkIcs234Objective(objective))
      continue
    }

    linkedSourceIds.add(sourceId)
    next.push(linkIcs234Objective(objective, source))
  }

  for (const [sourceId, source] of eligibleById) {
    if (linkedSourceIds.has(sourceId)) {
      continue
    }
    next.push({
      id: nextRowId(next),
      name: source.objective.trim(),
      strategies: [],
      ics202SourceObjectiveId: source.id,
      ics202SourceKind: source.kind as Ics234Ics202SourceKind,
    })
  }

  return {
    objectives: next,
    changed: objectivesSnapshot(ics234Objectives) !== objectivesSnapshot(next),
  }
}
