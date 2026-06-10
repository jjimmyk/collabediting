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
