export type PlanningPStep = {
  id: string
  label: string
  timeWindow: string
}

export const PLANNING_P_STEPS: PlanningPStep[] = [
  {
    id: 'objectives-meeting',
    label: 'IC / UC Objectives Meeting',
    timeWindow: '11:30 – 12:00',
  },
  {
    id: 'cg-staff-meeting',
    label: 'Command & General Staff (Strategy) Meeting',
    timeWindow: '12:15 – 12:45',
  },
  {
    id: 'prep-tactics',
    label: 'Preparing for Tactics Meeting',
    timeWindow: '12:45 – 13:00',
  },
  {
    id: 'tactics-meeting',
    label: 'Tactics Meeting',
    timeWindow: '13:00 – 14:00',
  },
  {
    id: 'prep-planning',
    label: 'Preparing for the Planning Meeting',
    timeWindow: '14:00 – 14:30',
  },
  {
    id: 'planning-meeting',
    label: 'Planning Meeting',
    timeWindow: '14:30 – 15:15',
  },
  {
    id: 'iap-prep',
    label: 'IAP Prep & Approval',
    timeWindow: '15:15 – 16:00',
  },
  {
    id: 'operations-briefing',
    label: 'Operations Briefing',
    timeWindow: '16:00 – 16:30',
  },
]

export type PlanningPStepId = PlanningPStep['id']

export function getPlanningPStepLabel(stepId: string): string {
  return PLANNING_P_STEPS.find((step) => step.id === stepId)?.label ?? 'Planning-P'
}

export function getPlanningPStepById(stepId: string): PlanningPStep | undefined {
  return PLANNING_P_STEPS.find((step) => step.id === stepId)
}

/** Share of Planning-P phases completed before the active phase (0–100). */
export function getPlanningPWorkflowProgress(activeStepId: string): number {
  const activeIndex = PLANNING_P_STEPS.findIndex((step) => step.id === activeStepId)
  if (activeIndex <= 0) return 0
  return Math.round((activeIndex / PLANNING_P_STEPS.length) * 100)
}

export function parsePlanningPStepSchedule(timeWindow: string): {
  start: string
  end: string
} {
  const [start = timeWindow, end = ''] = timeWindow.split('–').map((part) => part.trim())
  return { start, end: end || start }
}
