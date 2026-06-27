import type { Ics234ObjectiveRow } from '@/features/ics234/types'
import { extractIcs234MatrixItemDraft } from '@/features/ics234/utils'
import type { Ics234TacticRef } from '@/features/ics215/types'

export type Ics234TacticOption = {
  ref: Ics234TacticRef
  label: string
  breadcrumb: string
}

export function ics234TacticRefKey(ref: Ics234TacticRef): string {
  return `${ref.objectiveId}:${ref.strategyId}:${ref.tacticId}`
}

export function parseIcs234TacticRefKey(key: string): Ics234TacticRef | null {
  const parts = key.split(':')
  if (parts.length !== 3) return null
  const objectiveId = Number(parts[0])
  const strategyId = Number(parts[1])
  const tacticId = Number(parts[2])
  if (![objectiveId, strategyId, tacticId].every(Number.isFinite)) return null
  return { objectiveId, strategyId, tacticId }
}

export function flattenIcs234Tactics(objectives: Ics234ObjectiveRow[]): Ics234TacticOption[] {
  const options: Ics234TacticOption[] = []
  for (const objective of objectives) {
    const objectiveLabel = objective.name.trim() || 'Objective'
    for (const strategy of objective.strategies) {
      const strategyLabel = strategy.name.trim() || 'Strategy'
      for (const tactic of strategy.tactics) {
        options.push({
          ref: {
            objectiveId: objective.id,
            strategyId: strategy.id,
            tacticId: tactic.id,
          },
          label: tactic.name.trim() || 'Tactic',
          breadcrumb: `${objectiveLabel} · ${strategyLabel}`,
        })
      }
    }
  }
  return options
}

export function resolveIcs234TacticLabel(
  objectives: Ics234ObjectiveRow[],
  ref: Ics234TacticRef | null | undefined
): { label: string; stale: boolean } {
  if (!ref) return { label: '', stale: false }
  const draft = extractIcs234MatrixItemDraft(objectives, {
    kind: 'tactic',
    objectiveId: ref.objectiveId,
    strategyId: ref.strategyId,
    tacticId: ref.tacticId,
  })
  if (!draft) {
    return { label: '(removed tactic)', stale: true }
  }
  const label = draft.name.trim()
  return { label: label.length > 0 ? label : '(unnamed tactic)', stale: false }
}

export function normalizeIcs234TacticRef(raw: unknown): Ics234TacticRef | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Record<string, unknown>
  const objectiveId = candidate.objectiveId
  const strategyId = candidate.strategyId
  const tacticId = candidate.tacticId
  if (
    typeof objectiveId === 'number' &&
    typeof strategyId === 'number' &&
    typeof tacticId === 'number'
  ) {
    return { objectiveId, strategyId, tacticId }
  }
  return null
}
