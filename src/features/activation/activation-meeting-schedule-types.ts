export type OperationalPeriodDurationUnit = 'hours' | 'days'

export type ActivationMeetingScheduleItem = {
  id: number
  start: string
  end: string
  meeting: string
  attendees: string
  agendaItems: string[]
  createTeamsMeeting: boolean
}

export type ActivationMeetingScheduleSettings = {
  plannedDurationValue: number
  plannedDurationUnit: OperationalPeriodDurationUnit
  repeatMeetingsEachOperationalPeriod: boolean
  meetings: ActivationMeetingScheduleItem[]
}

export type ActivationMeetingOccurrence = {
  periodNumber: number
  opStartIso: string
  opEndIso: string
  meetings: ActivationMeetingScheduleItem[]
}

export const DEFAULT_MEETING_SCHEDULE_ITEMS: ActivationMeetingScheduleItem[] = [
  {
    id: 1,
    start: '2026-04-01T09:00',
    end: '2026-04-01T09:30',
    meeting: 'Operational Briefing',
    attendees: 'IC, Ops, Logistics',
    agendaItems: ['Safety briefing', 'Incident objectives', 'Resource assignments'],
    createTeamsMeeting: true,
  },
  {
    id: 2,
    start: '2026-04-01T12:00',
    end: '2026-04-01T12:45',
    meeting: 'Planning Sync',
    attendees: 'Planning Section',
    agendaItems: ['Status update', 'Projected needs', 'Planning assumptions'],
    createTeamsMeeting: false,
  },
  {
    id: 3,
    start: '2026-04-01T16:00',
    end: '2026-04-01T16:30',
    meeting: 'Command Update',
    attendees: 'Unified Command',
    agendaItems: ['Key decisions', 'Priority alignment', 'Communication plan'],
    createTeamsMeeting: true,
  },
]

export function createDefaultActivationMeetingScheduleSettings(): ActivationMeetingScheduleSettings {
  return {
    plannedDurationValue: 12,
    plannedDurationUnit: 'hours',
    repeatMeetingsEachOperationalPeriod: true,
    meetings: DEFAULT_MEETING_SCHEDULE_ITEMS.map((item) => ({ ...item, agendaItems: [...item.agendaItems] })),
  }
}
