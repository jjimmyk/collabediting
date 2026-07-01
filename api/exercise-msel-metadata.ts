type NormalizedMselInject = {
  id: number
  objectiveId: number | null
  scheduledTime: string
  category: string
  inject: string
  expectedAction: string
  mapFeatures?: unknown[]
  mapLocation?: [number, number] | null
}

export type NormalizedExerciseMselState = {
  objectives: Array<{ id: number; name: string }>
  injects: NormalizedMselInject[]
}

function isValidMapLocation(value: unknown): value is [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    return false
  }
  const [longitude, latitude] = value
  return (
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    typeof latitude === 'number' &&
    Number.isFinite(latitude)
  )
}

export function normalizeExerciseMselMetadata(raw: unknown): NormalizedExerciseMselState | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>

  const objectives = Array.isArray(record.objectives)
    ? record.objectives
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null
          }
          const objective = entry as Record<string, unknown>
          if (typeof objective.id !== 'number') {
            return null
          }
          return {
            id: objective.id,
            name: typeof objective.name === 'string' ? objective.name : '',
          }
        })
        .filter((entry): entry is { id: number; name: string } => entry !== null)
    : []

  const injects = Array.isArray(record.injects)
    ? record.injects
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null
          }
          const inject = entry as Record<string, unknown>
          if (typeof inject.id !== 'number') {
            return null
          }
          const normalized: NormalizedMselInject = {
            id: inject.id,
            objectiveId:
              typeof inject.objectiveId === 'number'
                ? inject.objectiveId
                : inject.objectiveId == null
                  ? null
                  : null,
            scheduledTime: typeof inject.scheduledTime === 'string' ? inject.scheduledTime : '',
            category: typeof inject.category === 'string' ? inject.category : 'Operations',
            inject: typeof inject.inject === 'string' ? inject.inject : '',
            expectedAction:
              typeof inject.expectedAction === 'string' ? inject.expectedAction : '',
          }
          if (isValidMapLocation(inject.mapLocation)) {
            normalized.mapLocation = inject.mapLocation
          } else if (inject.mapLocation === null) {
            normalized.mapLocation = null
          }
          if (Array.isArray(inject.mapFeatures)) {
            normalized.mapFeatures = inject.mapFeatures
          }
          return normalized
        })
        .filter((entry): entry is NormalizedMselInject => entry !== null)
    : []

  if (objectives.length === 0 && injects.length === 0) {
    return null
  }

  return { objectives, injects }
}

export function normalizeWorkspaceMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const next = { ...metadata }
  if ('exerciseMsel' in next) {
    const normalized = normalizeExerciseMselMetadata(next.exerciseMsel)
    if (normalized) {
      next.exerciseMsel = normalized
    } else {
      delete next.exerciseMsel
    }
  }

  if ('activationMeetingSchedule' in next) {
    next.activationMeetingSchedule = normalizeActivationMeetingScheduleMetadata(
      next.activationMeetingSchedule
    )
  }

  if ('meetingOccurrences' in next) {
    next.meetingOccurrences = normalizeMeetingOccurrencesMetadata(next.meetingOccurrences)
  }

  return next
}

function normalizeActivationMeetingScheduleMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      plannedDurationValue: 12,
      plannedDurationUnit: 'hours',
      repeatMeetingsEachOperationalPeriod: true,
      meetings: [],
    }
  }

  const record = raw as Record<string, unknown>
  const unit = record.plannedDurationUnit === 'days' ? 'days' : 'hours'
  const max = unit === 'days' ? 7 : 168
  const valueRaw =
    typeof record.plannedDurationValue === 'number' ? record.plannedDurationValue : 12
  const plannedDurationValue = Math.min(max, Math.max(1, Math.round(valueRaw)))

  const meetings = Array.isArray(record.meetings)
    ? record.meetings
        .map((entry) => {
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
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : []

  return {
    plannedDurationValue,
    plannedDurationUnit: unit,
    repeatMeetingsEachOperationalPeriod:
      typeof record.repeatMeetingsEachOperationalPeriod === 'boolean'
        ? record.repeatMeetingsEachOperationalPeriod
        : true,
    meetings,
  }
}

function normalizeMeetingOccurrencesMetadata(raw: unknown): Array<Record<string, unknown>> {
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
              }
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
        : []

      return {
        periodNumber: occurrence.periodNumber,
        opStartIso: occurrence.opStartIso,
        opEndIso: occurrence.opEndIso,
        meetings,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}
