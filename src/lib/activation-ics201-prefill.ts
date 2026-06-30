import { createInitialIcs201Form } from '@/features/ics201/constants'
import type { Ics201FormState, Ics201ObjectiveRow } from '@/features/ics201/types'
import { cloneIcs201FormState } from '@/features/ics201/utils'
import type { CreateActivationKind } from '@/lib/create-activation-navigation'

export type ActivationIcs201InitialReportInput = {
  shortDescription: string
  facilityLocations: string[]
  facilityLocationOther: string
  whatHappened: string
  icNotified: 'yes' | 'no' | ''
  icNotifiedName: string
  rpName: string
  materialReleased: string
  enterWater: 'yes' | 'no' | ''
  releaseDischargeRate: string
  sourceControlled: 'yes' | 'no' | ''
  scenarios: string[]
}

export type ActivationIcs201DraftState = {
  form: Ics201FormState
  signIntent: { name: string; role: string } | null
  touched: boolean
}

export function createDefaultActivationIcs201Draft(): ActivationIcs201DraftState {
  return {
    form: createInitialIcs201Form(),
    signIntent: null,
    touched: false,
  }
}

export function formatInitialIncidentReportSummaryForIcs201(
  report: ActivationIcs201InitialReportInput
): string {
  const parts: string[] = []

  if (report.shortDescription.trim()) {
    parts.push(report.shortDescription.trim())
  }

  const locationLabel = [
    ...report.facilityLocations.filter((location) => location !== 'Other'),
    report.facilityLocations.includes('Other') && report.facilityLocationOther.trim()
      ? report.facilityLocationOther.trim()
      : null,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(', ')

  if (locationLabel) {
    parts.push(`Location: ${locationLabel}`)
  } else if (report.facilityLocationOther.trim()) {
    parts.push(`Location: ${report.facilityLocationOther.trim()}`)
  }

  if (report.whatHappened.trim()) {
    parts.push(report.whatHappened.trim())
  }

  if (report.icNotified === 'yes' && report.icNotifiedName.trim()) {
    parts.push(`IC notified: ${report.icNotifiedName.trim()}`)
  }

  if (report.rpName.trim()) {
    parts.push(`RP: ${report.rpName.trim()}`)
  }

  if (report.materialReleased.trim()) {
    parts.push(`Material released: ${report.materialReleased.trim()}`)
  }

  if (report.enterWater) {
    parts.push(`Enter water: ${report.enterWater.toUpperCase()}`)
  }

  if (report.releaseDischargeRate.trim()) {
    parts.push(`Release / discharge rate: ${report.releaseDischargeRate.trim()}`)
  }

  if (report.sourceControlled) {
    parts.push(`Source controlled: ${report.sourceControlled.toUpperCase()}`)
  }

  if (report.scenarios.length > 0) {
    parts.push(`ERP scenarios: ${report.scenarios.join('; ')}`)
  }

  return parts.join(' ')
}

function parseStartTimeIso(startTimeIso?: string): { date: string; time: string } {
  if (!startTimeIso) {
    const now = new Date()
    return {
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
    }
  }

  const parsed = new Date(startTimeIso)
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date()
    return {
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
    }
  }

  return {
    date: parsed.toISOString().slice(0, 10),
    time: parsed.toTimeString().slice(0, 5),
  }
}

function buildObjectivesFromExercise(
  exerciseObjectives: Array<{ name: string }> | undefined
): Ics201ObjectiveRow[] {
  const named = (exerciseObjectives ?? []).filter((row) => row.name.trim().length > 0)
  if (named.length === 0) {
    return [{ id: 1, kind: 'O', objective: '' }]
  }

  return named.map((row, index) => ({
    id: index + 1,
    kind: 'O' as const,
    objective: row.name.trim(),
  }))
}

export function buildActivationIcs201Prefill(input: {
  kind: CreateActivationKind
  name: string
  region: string
  lead: string
  geometrySummary?: string
  locationLabel?: string
  startTimeIso?: string
  initialReport: ActivationIcs201InitialReportInput
  exerciseObjectives?: Array<{ name: string }>
}): Ics201FormState {
  const { date, time } = parseStartTimeIso(input.startTimeIso)
  const incidentLocation =
    input.geometrySummary?.trim() ||
    input.locationLabel?.trim() ||
    createInitialIcs201Form().incidentLocation
  const situationSummary = formatInitialIncidentReportSummaryForIcs201(input.initialReport)
  const objectives =
    input.kind === 'exercise'
      ? buildObjectivesFromExercise(input.exerciseObjectives)
      : [{ id: 1, kind: 'O' as const, objective: '' }]

  return cloneIcs201FormState({
    ...createInitialIcs201Form(),
    incidentName: input.name.trim() || createInitialIcs201Form().incidentName,
    incidentLocation,
    dateInitiated: date,
    timeInitiated: time,
    jurisdiction: input.region.trim() || createInitialIcs201Form().jurisdiction,
    preparedBy: input.lead.trim() || createInitialIcs201Form().preparedBy,
    preparedByName: input.lead.trim() || createInitialIcs201Form().preparedByName,
    currentSituationSummary: situationSummary,
    objectives,
  })
}

export function resolveActivationIcs201DraftForWorkspace(
  draft: ActivationIcs201DraftState,
  prefillInput: Parameters<typeof buildActivationIcs201Prefill>[0]
): ActivationIcs201DraftState {
  if (draft.touched || draft.signIntent) {
    return draft
  }
  return {
    ...draft,
    form: buildActivationIcs201Prefill(prefillInput),
  }
}
