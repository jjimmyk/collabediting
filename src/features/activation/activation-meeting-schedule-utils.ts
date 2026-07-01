import {
  createDefaultActivationMeetingScheduleSettings,
  type ActivationMeetingOccurrence,
  type ActivationMeetingScheduleItem,
  type ActivationMeetingScheduleSettings,
  type OperationalPeriodDurationUnit,
} from '@/features/activation/activation-meeting-schedule-types'
import { formatOperationalPeriodDatetimeLocal } from '@/lib/operational-period-timestamps'

export const MAX_OPERATIONAL_PERIOD_HOURS = 168
export const MAX_OPERATIONAL_PERIOD_DAYS = 7

export function clampOperationalPeriodDurationValue(
  value: number,
  unit: OperationalPeriodDurationUnit
): number {
  const max = unit === 'days' ? MAX_OPERATIONAL_PERIOD_DAYS : MAX_OPERATIONAL_PERIOD_HOURS
  if (!Number.isFinite(value)) return 1
  return Math.min(max, Math.max(1, Math.round(value)))
}

export function operationalPeriodDurationMs(
  value: number,
  unit: OperationalPeriodDurationUnit
): number {
  const clamped = clampOperationalPeriodDurationValue(value, unit)
  const hours = unit === 'days' ? clamped * 24 : clamped
  return hours * 60 * 60 * 1000
}

export function operationalPeriodDurationMsFromSettings(
  settings: Pick<ActivationMeetingScheduleSettings, 'plannedDurationValue' | 'plannedDurationUnit'>
): number {
  return operationalPeriodDurationMs(settings.plannedDurationValue, settings.plannedDurationUnit)
}

export function computeOperationalPeriodWindow(
  opStart: Date,
  settings: Pick<ActivationMeetingScheduleSettings, 'plannedDurationValue' | 'plannedDurationUnit'>
): { from: Date; to: Date } {
  const durationMs = operationalPeriodDurationMsFromSettings(settings)
  return {
    from: opStart,
    to: new Date(opStart.getTime() + durationMs),
  }
}

export function parseAnchorStartIso(anchorStartIso?: string): Date {
  if (!anchorStartIso) {
    return new Date()
  }
  const parsed = new Date(anchorStartIso)
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }
  return parsed
}

export type MeetingOffsetTemplate = ActivationMeetingScheduleItem & {
  startOffsetMinutes: number
  endOffsetMinutes: number
}

export function computeMeetingOffsetsFromAnchor(
  meetings: ActivationMeetingScheduleItem[],
  anchorStartIso: string
): MeetingOffsetTemplate[] {
  const anchor = parseAnchorStartIso(anchorStartIso).getTime()

  return meetings.map((meeting) => {
    const startMs = parseAnchorStartIso(meeting.start).getTime()
    const endMs = parseAnchorStartIso(meeting.end).getTime()
    const startOffsetMinutes = Number.isNaN(startMs)
      ? 0
      : Math.round((startMs - anchor) / (60 * 1000))
    const endOffsetMinutes = Number.isNaN(endMs)
      ? startOffsetMinutes + 30
      : Math.round((endMs - anchor) / (60 * 1000))

    return {
      ...meeting,
      agendaItems: [...meeting.agendaItems],
      startOffsetMinutes,
      endOffsetMinutes: Math.max(endOffsetMinutes, startOffsetMinutes),
    }
  })
}

function shiftMeetingByOffset(
  template: MeetingOffsetTemplate,
  opStart: Date
): ActivationMeetingScheduleItem {
  const start = new Date(opStart.getTime() + template.startOffsetMinutes * 60 * 1000)
  const end = new Date(opStart.getTime() + template.endOffsetMinutes * 60 * 1000)

  return {
    id: template.id,
    start: formatOperationalPeriodDatetimeLocal(start),
    end: formatOperationalPeriodDatetimeLocal(end),
    meeting: template.meeting,
    attendees: template.attendees,
    agendaItems: [...template.agendaItems],
    createTeamsMeeting: template.createTeamsMeeting,
  }
}

export function generateMeetingsForOperationalPeriod(
  templateMeetings: ActivationMeetingScheduleItem[],
  opStart: Date,
  anchorStartIso: string
): ActivationMeetingScheduleItem[] {
  if (templateMeetings.length === 0) {
    return []
  }

  const offsets = computeMeetingOffsetsFromAnchor(templateMeetings, anchorStartIso)
  return offsets.map((template) => shiftMeetingByOffset(template, opStart))
}

export function buildInitialMeetingOccurrence(params: {
  periodNumber: number
  opStartIso: string
  settings: ActivationMeetingScheduleSettings
}): ActivationMeetingOccurrence {
  const opStart = parseAnchorStartIso(params.opStartIso)
  const window = computeOperationalPeriodWindow(opStart, params.settings)
  const meetings = generateMeetingsForOperationalPeriod(
    params.settings.meetings,
    opStart,
    params.opStartIso
  )

  return {
    periodNumber: params.periodNumber,
    opStartIso: formatOperationalPeriodDatetimeLocal(window.from),
    opEndIso: formatOperationalPeriodDatetimeLocal(window.to),
    meetings,
  }
}

export function buildWorkingPeriodMeetingOccurrence(params: {
  periodNumber: number
  opStart: Date
  settings: ActivationMeetingScheduleSettings
  anchorStartIso: string
}): ActivationMeetingOccurrence {
  const window = computeOperationalPeriodWindow(params.opStart, params.settings)
  const meetings = generateMeetingsForOperationalPeriod(
    params.settings.meetings,
    params.opStart,
    params.anchorStartIso
  )

  return {
    periodNumber: params.periodNumber,
    opStartIso: formatOperationalPeriodDatetimeLocal(window.from),
    opEndIso: formatOperationalPeriodDatetimeLocal(window.to),
    meetings,
  }
}

export function formatOperationalPeriodWindowLabel(from: Date, to: Date): string {
  const formatter = new Intl.DateTimeFormat([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${formatter.format(from)} – ${formatter.format(to)}`
}

export function resolveActivationMeetingScheduleSettings(
  raw: unknown
): ActivationMeetingScheduleSettings {
  const defaults = createDefaultActivationMeetingScheduleSettings()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults
  }

  const record = raw as Record<string, unknown>
  const unit: OperationalPeriodDurationUnit =
    record.plannedDurationUnit === 'days' ? 'days' : 'hours'
  const value =
    typeof record.plannedDurationValue === 'number'
      ? clampOperationalPeriodDurationValue(record.plannedDurationValue, unit)
      : defaults.plannedDurationValue

  const meetings = Array.isArray(record.meetings)
    ? record.meetings
        .map((entry, index) => {
          if (!entry || typeof entry !== 'object') return null
          const meeting = entry as Record<string, unknown>
          if (typeof meeting.id !== 'number') return null
          return {
            id: meeting.id,
            start: typeof meeting.start === 'string' ? meeting.start : '',
            end: typeof meeting.end === 'string' ? meeting.end : '',
            meeting: typeof meeting.meeting === 'string' ? meeting.meeting : '',
            attendees: typeof meeting.attendees === 'string' ? meeting.attendees : '',
            agendaItems: Array.isArray(meeting.agendaItems)
              ? meeting.agendaItems.filter((item): item is string => typeof item === 'string')
              : [],
            createTeamsMeeting: meeting.createTeamsMeeting === true,
          } satisfies ActivationMeetingScheduleItem
        })
        .filter((entry): entry is ActivationMeetingScheduleItem => entry !== null)
    : defaults.meetings

  return {
    plannedDurationValue: value,
    plannedDurationUnit: unit,
    repeatMeetingsEachOperationalPeriod:
      typeof record.repeatMeetingsEachOperationalPeriod === 'boolean'
        ? record.repeatMeetingsEachOperationalPeriod
        : defaults.repeatMeetingsEachOperationalPeriod,
    meetings: meetings.length > 0 ? meetings : defaults.meetings,
  }
}

export function resolveMeetingOccurrences(raw: unknown): ActivationMeetingOccurrence[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const occurrence = entry as Record<string, unknown>
      if (typeof occurrence.periodNumber !== 'number') return null
      if (typeof occurrence.opStartIso !== 'string' || typeof occurrence.opEndIso !== 'string') {
        return null
      }

      const meetings = Array.isArray(occurrence.meetings)
        ? occurrence.meetings
            .map((meetingEntry) => {
              if (!meetingEntry || typeof meetingEntry !== 'object') return null
              const meeting = meetingEntry as Record<string, unknown>
              if (typeof meeting.id !== 'number') return null
              return {
                id: meeting.id,
                start: typeof meeting.start === 'string' ? meeting.start : '',
                end: typeof meeting.end === 'string' ? meeting.end : '',
                meeting: typeof meeting.meeting === 'string' ? meeting.meeting : '',
                attendees: typeof meeting.attendees === 'string' ? meeting.attendees : '',
                agendaItems: Array.isArray(meeting.agendaItems)
                  ? meeting.agendaItems.filter((item): item is string => typeof item === 'string')
                  : [],
                createTeamsMeeting: meeting.createTeamsMeeting === true,
              } satisfies ActivationMeetingScheduleItem
            })
            .filter((item): item is ActivationMeetingScheduleItem => item !== null)
        : []

      return {
        periodNumber: occurrence.periodNumber,
        opStartIso: occurrence.opStartIso,
        opEndIso: occurrence.opEndIso,
        meetings,
      } satisfies ActivationMeetingOccurrence
    })
    .filter((entry): entry is ActivationMeetingOccurrence => entry !== null)
}

export function extractAnchorStartIsoFromOccurrences(
  occurrences: ActivationMeetingOccurrence[]
): string | null {
  const first = occurrences.find((entry) => entry.periodNumber === 1)
  return first?.opStartIso ?? occurrences[0]?.opStartIso ?? null
}

export function buildActivationMeetingMetadata(params: {
  settings: ActivationMeetingScheduleSettings
  incidentStartTime: string
}): {
  activationMeetingSchedule: ActivationMeetingScheduleSettings
  meetingOccurrences: ActivationMeetingOccurrence[]
} {
  const anchorStartIso =
    params.incidentStartTime.trim().length > 0
      ? params.incidentStartTime
      : formatOperationalPeriodDatetimeLocal(new Date())

  return {
    activationMeetingSchedule: params.settings,
    meetingOccurrences: [
      buildInitialMeetingOccurrence({
        periodNumber: 1,
        opStartIso: anchorStartIso,
        settings: params.settings,
      }),
    ],
  }
}
