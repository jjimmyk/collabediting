import { describe, expect, it } from 'vitest'
import { normalizeWorkspaceMetadata } from '../../api/exercise-msel-metadata.ts'
import {
  buildActivationMeetingMetadata,
  buildWorkingPeriodMeetingOccurrence,
  clampOperationalPeriodDurationValue,
  computeMeetingOffsetsFromAnchor,
  generateMeetingsForOperationalPeriod,
  operationalPeriodDurationMs,
  resolveActivationMeetingScheduleSettings,
  resolveMeetingOccurrences,
} from '@/features/activation/activation-meeting-schedule-utils'
import { createDefaultActivationMeetingScheduleSettings } from '@/features/activation/activation-meeting-schedule-types'

describe('activation-meeting-schedule-utils', () => {
  it('converts duration values to milliseconds with caps', () => {
    expect(operationalPeriodDurationMs(12, 'hours')).toBe(12 * 60 * 60 * 1000)
    expect(operationalPeriodDurationMs(1, 'days')).toBe(24 * 60 * 60 * 1000)
    expect(clampOperationalPeriodDurationValue(999, 'hours')).toBe(168)
    expect(clampOperationalPeriodDurationValue(999, 'days')).toBe(7)
  })

  it('computes meeting offsets from the activation anchor start', () => {
    const settings = createDefaultActivationMeetingScheduleSettings()
    const offsets = computeMeetingOffsetsFromAnchor(settings.meetings, '2026-04-01T06:00')

    expect(offsets[0]?.startOffsetMinutes).toBe(180)
    expect(offsets[0]?.endOffsetMinutes).toBe(210)
  })

  it('generates shifted meetings for a later operational period when repeat is enabled', () => {
    const settings = createDefaultActivationMeetingScheduleSettings()
    const op2Start = new Date('2026-04-01T18:00')
    const meetings = generateMeetingsForOperationalPeriod(
      settings.meetings,
      op2Start,
      '2026-04-01T06:00'
    )

    expect(meetings[0]?.start).toBe('2026-04-01T21:00')
    expect(meetings[0]?.end).toBe('2026-04-01T21:30')
  })

  it('builds initial and recurring meeting metadata', () => {
    const settings = createDefaultActivationMeetingScheduleSettings()
    const metadata = buildActivationMeetingMetadata({
      settings,
      incidentStartTime: '2026-04-01T06:00',
    })

    expect(metadata.activationMeetingSchedule.plannedDurationValue).toBe(12)
    expect(metadata.meetingOccurrences).toHaveLength(1)
    expect(metadata.meetingOccurrences[0]?.periodNumber).toBe(1)
    expect(metadata.meetingOccurrences[0]?.opStartIso).toBe('2026-04-01T06:00')
    expect(metadata.meetingOccurrences[0]?.opEndIso).toBe('2026-04-01T18:00')

    const recurring = buildWorkingPeriodMeetingOccurrence({
      periodNumber: 2,
      opStart: new Date('2026-04-01T18:00'),
      settings,
      anchorStartIso: '2026-04-01T06:00',
    })

    expect(recurring.periodNumber).toBe(2)
    expect(recurring.meetings[0]?.start).toBe('2026-04-01T21:00')
  })

  it('does not emit recurring occurrences when repeat is disabled', () => {
    const settings = {
      ...createDefaultActivationMeetingScheduleSettings(),
      repeatMeetingsEachOperationalPeriod: false,
    }

    expect(settings.repeatMeetingsEachOperationalPeriod).toBe(false)
    expect(resolveActivationMeetingScheduleSettings(settings).repeatMeetingsEachOperationalPeriod).toBe(
      false
    )
  })

  it('normalizes activation meeting schedule metadata', () => {
    const normalized = normalizeWorkspaceMetadata({
      activationMeetingSchedule: {
        plannedDurationValue: 24,
        plannedDurationUnit: 'hours',
        repeatMeetingsEachOperationalPeriod: false,
        meetings: [
          {
            id: 1,
            start: '2026-04-01T09:00',
            end: '2026-04-01T09:30',
            meeting: 'Briefing',
            attendees: 'IC',
            agendaItems: ['Safety'],
            createTeamsMeeting: true,
          },
        ],
      },
      meetingOccurrences: [
        {
          periodNumber: 1,
          opStartIso: '2026-04-01T06:00',
          opEndIso: '2026-04-02T06:00',
          meetings: [],
        },
      ],
    })

    expect(normalized.activationMeetingSchedule).toEqual({
      plannedDurationValue: 24,
      plannedDurationUnit: 'hours',
      repeatMeetingsEachOperationalPeriod: false,
      meetings: [
        {
          id: 1,
          start: '2026-04-01T09:00',
          end: '2026-04-01T09:30',
          meeting: 'Briefing',
          attendees: 'IC',
          agendaItems: ['Safety'],
          createTeamsMeeting: true,
        },
      ],
    })
    expect(resolveMeetingOccurrences(normalized.meetingOccurrences)).toHaveLength(1)
  })
})
