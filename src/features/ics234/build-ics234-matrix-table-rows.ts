import type {
  Ics234ObjectiveRow,
  Ics234StrategyRow,
  Ics234TacticsRow,
} from '@/features/ics234/types'

export type Ics234MatrixTableRow = {
  rowKey: string
  objective: Ics234ObjectiveRow
  objectiveIndex: number
  showObjective: boolean
  objectiveRowSpan: number
  strategy: Ics234StrategyRow | null
  strategyIndex: number | null
  showStrategy: boolean
  strategyRowSpan: number | null
  tactic: Ics234TacticsRow | null
  tacticIndex: number | null
}

function strategyRowCount(strategy: Ics234StrategyRow): number {
  return Math.max(1, strategy.tactics.length)
}

function objectiveRowCount(objective: Ics234ObjectiveRow): number {
  if (objective.strategies.length === 0) {
    return 1
  }
  return objective.strategies.reduce((total, strategy) => total + strategyRowCount(strategy), 0)
}

export function buildIcs234MatrixTableRows(
  objectives: Ics234ObjectiveRow[]
): Ics234MatrixTableRow[] {
  const rows: Ics234MatrixTableRow[] = []

  objectives.forEach((objective, objectiveIndex) => {
    const objectiveSpan = objectiveRowCount(objective)
    let objectiveRowIndex = 0

    if (objective.strategies.length === 0) {
      rows.push({
        rowKey: `obj-${objective.id}-empty`,
        objective,
        objectiveIndex,
        showObjective: true,
        objectiveRowSpan: objectiveSpan,
        strategy: null,
        strategyIndex: null,
        showStrategy: false,
        strategyRowSpan: null,
        tactic: null,
        tacticIndex: null,
      })
      return
    }

    objective.strategies.forEach((strategy, strategyIndex) => {
      const span = strategyRowCount(strategy)

      if (strategy.tactics.length === 0) {
        rows.push({
          rowKey: `obj-${objective.id}-str-${strategy.id}-empty`,
          objective,
          objectiveIndex,
          showObjective: objectiveRowIndex === 0,
          objectiveRowSpan: objectiveSpan,
          strategy,
          strategyIndex,
          showStrategy: true,
          strategyRowSpan: span,
          tactic: null,
          tacticIndex: null,
        })
        objectiveRowIndex += 1
        return
      }

      strategy.tactics.forEach((tactic, tacticIndex) => {
        rows.push({
          rowKey: `obj-${objective.id}-str-${strategy.id}-tac-${tactic.id}`,
          objective,
          objectiveIndex,
          showObjective: objectiveRowIndex === 0,
          objectiveRowSpan: objectiveSpan,
          strategy,
          strategyIndex,
          showStrategy: tacticIndex === 0,
          strategyRowSpan: span,
          tactic,
          tacticIndex,
        })
        objectiveRowIndex += 1
      })
    })
  })

  return rows
}
