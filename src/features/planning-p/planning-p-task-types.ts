import type { PlanningPStep } from '@/features/planning-p/planning-p-steps'

export type PlanningPStepId = PlanningPStep['id']

export type PlanningPTaskTemplate = {
  id: string
  phaseId: PlanningPStepId
  position: string
  label: string
}

export type PlanningPTaskProgress = {
  completed: number
  total: number
  percent: number
}
