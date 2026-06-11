import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type {
  Ics234FormSectionDrafts,
  Ics234FormState,
  Ics234MatrixItemDraft,
  Ics234MatrixItemRef,
  Ics234MatrixRow,
  Ics234ObjectiveRow,
  Ics234SectionId,
  Ics234StrategyRow,
  Ics234TacticsRow,
  Ics234Version,
  Ics234VersionRow,
} from '@/features/ics234/types'

export function nextRowId<T extends { id: number }>(rows: T[]): number {
  return rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1
}

function legacyObjectiveName(row: Record<string, unknown>): string {
  const name = String(row.name ?? '').trim()
  if (name) return name
  const label = String(row.label ?? '').trim()
  const outcome = String(row.desiredOutcome ?? '').trim()
  if (outcome) return outcome
  if (label) return label
  return ''
}

function legacyStrategyName(row: Record<string, unknown>): string {
  const name = String(row.name ?? '').trim()
  if (name) return name
  return String(row.strategy ?? '').trim()
}

function legacyTacticName(row: Record<string, unknown>): string {
  const name = String(row.name ?? '').trim()
  if (name) return name
  const parts = [row.what, row.who, row.where, row.when]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
  return parts.join(' · ')
}

export function cloneIcs234TacticsRows(rows: Ics234TacticsRow[]): Ics234TacticsRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs234StrategyRows(rows: Ics234StrategyRow[]): Ics234StrategyRow[] {
  return rows.map((row) => ({
    ...row,
    tactics: cloneIcs234TacticsRows(row.tactics),
  }))
}

export function cloneIcs234ObjectiveRows(rows: Ics234ObjectiveRow[]): Ics234ObjectiveRow[] {
  return rows.map((row) => ({
    ...row,
    strategies: cloneIcs234StrategyRows(row.strategies),
  }))
}

export function cloneIcs234FormState(form: Ics234FormState): Ics234FormState {
  return {
    ...form,
    objectives: cloneIcs234ObjectiveRows(form.objectives),
  }
}

function normalizeTacticsRows(rows: Ics234TacticsRow[] | undefined): Ics234TacticsRow[] {
  return (rows ?? []).map((row, index) => ({
    id: typeof row.id === 'number' ? row.id : index + 1,
    name: legacyTacticName(row as Record<string, unknown>),
  }))
}

function normalizeStrategyRows(rows: Ics234StrategyRow[] | undefined): Ics234StrategyRow[] {
  return (rows ?? []).map((row, index) => ({
    id: typeof row.id === 'number' ? row.id : index + 1,
    name: legacyStrategyName(row as Record<string, unknown>),
    tactics: normalizeTacticsRows(row.tactics),
  }))
}

export function normalizeIcs234ObjectiveRows(
  rows: Ics234ObjectiveRow[] | undefined
): Ics234ObjectiveRow[] {
  return (rows ?? []).map((row, index) => ({
    id: typeof row.id === 'number' ? row.id : index + 1,
    name: legacyObjectiveName(row as Record<string, unknown>),
    strategies: normalizeStrategyRows(row.strategies),
  }))
}

function legacyMatrixRowsToObjectives(rows: Ics234MatrixRow[]): Ics234ObjectiveRow[] {
  const objectives: Ics234ObjectiveRow[] = []

  for (const row of rows) {
    const name =
      String(row.objectiveDesiredOutcome ?? '').trim() ||
      String(row.objectiveLabel ?? '').trim()
    let objective = objectives.find((entry) => entry.name === name)

    if (!objective) {
      objective = {
        id: nextRowId(objectives),
        name,
        strategies: [],
      }
      objectives.push(objective)
    }

    const tacticName = [row.tacticsWhat, row.tacticsWho, row.tacticsWhere, row.tacticsWhen]
      .map((part) => String(part ?? '').trim())
      .filter(Boolean)
      .join(' · ')

    objective.strategies.push({
      id: nextRowId(objective.strategies),
      name: String(row.strategy ?? '').trim(),
      tactics: tacticName
        ? [
            {
              id: 1,
              name: tacticName,
            },
          ]
        : [],
    })
  }

  return objectives
}

type LegacyFormPayload = Ics234FormState & { matrixRows?: Ics234MatrixRow[] }

export function normalizeIcs234FormState(form: LegacyFormPayload): Ics234FormState {
  let objectives = form.objectives

  if (!objectives?.length && form.matrixRows?.length) {
    objectives = legacyMatrixRowsToObjectives(form.matrixRows)
  }

  return {
    id: form.id,
    incidentName: String(form.incidentName ?? ''),
    incidentLocation: String(form.incidentLocation ?? ''),
    operationalPeriodFrom: String(form.operationalPeriodFrom ?? ''),
    operationalPeriodTo: String(form.operationalPeriodTo ?? ''),
    objectives: normalizeIcs234ObjectiveRows(objectives),
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPositionTitle: String(form.preparedByPositionTitle ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedDateTime: String(form.preparedDateTime ?? ''),
  }
}

export function mapIcs234VersionRow(row: Ics234VersionRow): Ics234Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs234FormState(normalizeIcs234FormState(row.snapshot as LegacyFormPayload)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs234Form(id: string, partial?: Partial<Ics234FormState>): Ics234FormState {
  return normalizeIcs234FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    incidentLocation: partial?.incidentLocation ?? '',
    operationalPeriodFrom: partial?.operationalPeriodFrom ?? '',
    operationalPeriodTo: partial?.operationalPeriodTo ?? '',
    objectives: partial?.objectives ?? [],
    preparedByName: partial?.preparedByName ?? '',
    preparedByPositionTitle: partial?.preparedByPositionTitle ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedDateTime: partial?.preparedDateTime ?? '',
  })
}

export function createLocalIcs234DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics234AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#7c3aed'
}

export function formStateForDocument(documentId: string, form: Ics234FormState): Ics234FormState {
  return cloneIcs234FormState({ ...normalizeIcs234FormState(form), id: documentId })
}

export function extractIcs234SectionDraft(
  form: Ics234FormState,
  section: Ics234SectionId
): Ics234FormSectionDrafts[Ics234SectionId] {
  switch (section) {
    case 'incident-info':
      return {
        incidentName: form.incidentName,
        incidentLocation: form.incidentLocation,
        operationalPeriodFrom: form.operationalPeriodFrom,
        operationalPeriodTo: form.operationalPeriodTo,
      }
    case 'work-analysis-matrix':
      return cloneIcs234ObjectiveRows(form.objectives)
    case 'prepared-by':
      return {
        preparedByName: form.preparedByName,
        preparedByPositionTitle: form.preparedByPositionTitle,
        preparedBySignature: form.preparedBySignature,
        preparedDateTime: form.preparedDateTime,
      }
    default:
      return undefined
  }
}

export function applyIcs234SectionDraft(
  form: Ics234FormState,
  section: Ics234SectionId,
  draft: Ics234FormSectionDrafts[Ics234SectionId]
): Ics234FormState {
  switch (section) {
    case 'incident-info':
    case 'prepared-by':
      return { ...form, ...(draft as object) }
    case 'work-analysis-matrix':
      return {
        ...form,
        objectives: cloneIcs234ObjectiveRows(draft as Ics234ObjectiveRow[]),
      }
    default:
      return form
  }
}

export function getIcs234FormForExport(
  form: Ics234FormState,
  sectionDrafts: Ics234FormSectionDrafts
): Ics234FormState {
  let exportForm = cloneIcs234FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics234SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs234SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export function ics234MatrixItemKey(ref: Ics234MatrixItemRef): string {
  switch (ref.kind) {
    case 'objective':
      return `obj-${ref.objectiveId}`
    case 'strategy':
      return `str-${ref.objectiveId}-${ref.strategyId}`
    case 'tactic':
      return `tac-${ref.objectiveId}-${ref.strategyId}-${ref.tacticId}`
  }
}

export function ics234MatrixItemRefsMatch(
  left: Ics234MatrixItemRef,
  right: Ics234MatrixItemRef
): boolean {
  return ics234MatrixItemKey(left) === ics234MatrixItemKey(right)
}

export function extractIcs234MatrixItemDraft(
  objectives: Ics234ObjectiveRow[],
  ref: Ics234MatrixItemRef
): Ics234MatrixItemDraft | null {
  const objective = objectives.find((entry) => entry.id === ref.objectiveId)
  if (!objective) return null

  switch (ref.kind) {
    case 'objective':
      return { kind: 'objective', name: objective.name }
    case 'strategy': {
      const strategy = objective.strategies.find((entry) => entry.id === ref.strategyId)
      if (!strategy) return null
      return { kind: 'strategy', name: strategy.name }
    }
    case 'tactic': {
      const strategy = objective.strategies.find((entry) => entry.id === ref.strategyId)
      const tactic = strategy?.tactics.find((entry) => entry.id === ref.tacticId)
      if (!strategy || !tactic) return null
      return { kind: 'tactic', name: tactic.name }
    }
  }
}

export function applyIcs234MatrixItemDraft(
  objectives: Ics234ObjectiveRow[],
  ref: Ics234MatrixItemRef,
  draft: Ics234MatrixItemDraft
): Ics234ObjectiveRow[] {
  if (draft.kind !== ref.kind) return objectives

  return objectives.map((objective) => {
    if (objective.id !== ref.objectiveId) return objective

    if (ref.kind === 'objective') {
      return { ...objective, name: draft.name }
    }

    if (ref.kind === 'strategy') {
      return {
        ...objective,
        strategies: objective.strategies.map((strategy) =>
          strategy.id === ref.strategyId ? { ...strategy, name: draft.name } : strategy
        ),
      }
    }

    return {
      ...objective,
      strategies: objective.strategies.map((strategy) =>
        strategy.id === ref.strategyId
          ? {
              ...strategy,
              tactics: strategy.tactics.map((tactic) =>
                tactic.id === ref.tacticId ? { ...tactic, name: draft.name } : tactic
              ),
            }
          : strategy
      ),
    }
  })
}
