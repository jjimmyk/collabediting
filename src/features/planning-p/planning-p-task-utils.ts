import { PLANNING_P_STEPS } from '@/features/planning-p/planning-p-steps'
import {
  PLANNING_P_DEFAULT_POSITION,
  PLANNING_P_TASK_TEMPLATES,
} from '@/features/planning-p/planning-p-task-templates'
import type {
  PlanningPStepId,
  PlanningPTaskProgress,
  PlanningPTaskTemplate,
} from '@/features/planning-p/planning-p-task-types'

export function createPlanningPTaskId(
  phaseId: PlanningPStepId,
  position: string,
  slug: string
): string {
  const positionKey = position === PLANNING_P_DEFAULT_POSITION ? 'default' : position
  return `${phaseId}:${positionKey}:${slug}`
}

export function getTasksForPhaseAndPositions(
  phaseId: PlanningPStepId,
  positions: string[]
): PlanningPTaskTemplate[] {
  const normalizedPositions =
    positions.length > 0
      ? [...new Set(positions.map((position) => position.trim()).filter(Boolean))]
      : [PLANNING_P_DEFAULT_POSITION]

  const byId = new Map<string, PlanningPTaskTemplate>()
  for (const position of normalizedPositions) {
    for (const task of PLANNING_P_TASK_TEMPLATES) {
      if (task.phaseId !== phaseId) continue
      if (task.position !== position && task.position !== PLANNING_P_DEFAULT_POSITION) continue
      byId.set(task.id, task)
    }
  }

  if (byId.size === 0) {
    for (const task of PLANNING_P_TASK_TEMPLATES) {
      if (task.phaseId === phaseId && task.position === PLANNING_P_DEFAULT_POSITION) {
        byId.set(task.id, task)
      }
    }
  }

  return [...byId.values()].sort((left, right) => left.label.localeCompare(right.label))
}

export function getTaskProgress(
  tasks: PlanningPTaskTemplate[],
  completions: Record<string, boolean>
): PlanningPTaskProgress {
  const total = tasks.length
  const completed = tasks.filter((task) => completions[task.id]).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { completed, total, percent }
}

export function buildTaskProgressByStepId(
  positions: string[],
  completions: Record<string, boolean>
): Record<PlanningPStepId, PlanningPTaskProgress> {
  return PLANNING_P_STEPS.reduce(
    (accumulator, step) => {
      const tasks = getTasksForPhaseAndPositions(step.id, positions)
      accumulator[step.id] = getTaskProgress(tasks, completions)
      return accumulator
    },
    {} as Record<PlanningPStepId, PlanningPTaskProgress>
  )
}
