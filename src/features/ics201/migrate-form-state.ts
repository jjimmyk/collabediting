import {
  createEmptyHazmatAssessmentBox15,
  createEmptySafetyAnalysisBox13,
} from './form-options'
import { normalizeIcs201ResourceSummaryRow } from './resource-summary-utils'
import type {
  Ics201ActionRow,
  Ics201FormState,
  Ics201ResourceSummaryRow,
  Ics201SafetyRow,
} from './types'

type LegacyActionRow = {
  id?: number
  task?: string
  owner?: string
  startTime?: string
  endTime?: string
  status?: string
  time?: string
  action?: string
}

type LegacyResourceRow = {
  id?: number
  category?: string
  identifier?: string
  quantity?: string
  status?: string
  assignment?: string
  resource?: string
  resourceIdentifier?: string
  dateTimeOrdered?: string
  eta?: string
  onScene?: boolean
  notes?: string
  assetKey?: string | null
  resourceId?: number | null
  resourceSnapshot?: Ics201ResourceSummaryRow['resourceSnapshot']
}

type LegacyOrgChart = {
  incidentCommander?: string
  commandNames?: string[]
  safetyOfficer?: string
  liaisonOfficer?: string
  publicInformationOfficer?: string
  operationsSectionChief?: string
  planningSectionChief?: string
  logisticsSectionChief?: string
  financeSectionChief?: string
  intelInvestSectionChief?: string
}

type LegacyForm = Partial<Ics201FormState> & {
  schemaVersion?: number
  safetyAnalysis?: Ics201SafetyRow[]
  orgChart?: LegacyOrgChart
  actions?: LegacyActionRow[]
  resources?: LegacyResourceRow[]
}

function migrateLegacyActions(raw: LegacyActionRow[] | undefined): Ics201ActionRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row, index) => {
    const id = typeof row.id === 'number' ? row.id : index + 1
    if (typeof row.action === 'string' || typeof row.time === 'string') {
      return {
        id,
        time: String(row.time ?? ''),
        action: String(row.action ?? ''),
      }
    }
    const meta = [
      row.owner ? `Owner: ${row.owner}` : '',
      row.endTime ? `End: ${row.endTime}` : '',
      row.status ? `Status: ${row.status}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
    const actionText = [String(row.task ?? ''), meta].filter(Boolean).join(' — ')
    return {
      id,
      time: String(row.startTime ?? ''),
      action: actionText,
    }
  })
}

function migrateLegacyResources(raw: LegacyResourceRow[] | undefined): Ics201ResourceSummaryRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row, index) => {
    const id = typeof row.id === 'number' ? row.id : index + 1
    if (row.resource != null || row.resourceIdentifier != null || row.assetKey != null) {
      return normalizeIcs201ResourceSummaryRow({
        id,
        assetKey: row.assetKey ?? null,
        resourceId: row.resourceId ?? null,
        resourceSnapshot: row.resourceSnapshot ?? null,
        resource: String(row.resource ?? ''),
        resourceIdentifier: String(row.resourceIdentifier ?? ''),
        dateTimeOrdered: String(row.dateTimeOrdered ?? ''),
        eta: String(row.eta ?? ''),
        onScene: Boolean(row.onScene),
        notes: String(row.notes ?? ''),
      })
    }
    const notes = [
      row.quantity ? `Qty: ${row.quantity}` : '',
      row.status ? `Status: ${row.status}` : '',
      row.assignment ? `Assignment: ${row.assignment}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
    return normalizeIcs201ResourceSummaryRow({
      id,
      resource: String(row.category ?? ''),
      resourceIdentifier: String(row.identifier ?? ''),
      dateTimeOrdered: '',
      eta: '',
      onScene: false,
      notes,
    })
  })
}

function migrateLegacySafetyRows(
  rows: Ics201SafetyRow[] | undefined,
  safetyOfficer: string
) {
  const box13 = createEmptySafetyAnalysisBox13(safetyOfficer)
  if (!Array.isArray(rows) || rows.length === 0) {
    return box13
  }
  box13.safetyNotes = rows
    .map((row, index) => {
      const parts = [
        row.hazard ? `Hazard: ${row.hazard}` : '',
        row.mitigation ? `Mitigation: ${row.mitigation}` : '',
        row.ppe ? `PPE: ${row.ppe}` : '',
        row.medicalPlan ? `Medical: ${row.medicalPlan}` : '',
      ].filter(Boolean)
      return parts.length > 0 ? `${index + 1}. ${parts.join(' | ')}` : ''
    })
    .filter(Boolean)
    .join('\n')
  return box13
}

function migrateLegacyOrgChart(orgChart: LegacyOrgChart | undefined) {
  const commandNames = Array.isArray(orgChart?.commandNames)
    ? orgChart!.commandNames.map((name) => String(name ?? ''))
    : []
  while (commandNames.length < 5) {
    commandNames.push('')
  }
  if (orgChart?.incidentCommander && !commandNames[0]) {
    commandNames[0] = String(orgChart.incidentCommander)
  }
  return {
    commandNames: commandNames.slice(0, 5),
    safetyOfficer: String(orgChart?.safetyOfficer ?? ''),
    liaisonOfficer: String(orgChart?.liaisonOfficer ?? ''),
    publicInformationOfficer: String(orgChart?.publicInformationOfficer ?? ''),
    operationsSectionChief: String(orgChart?.operationsSectionChief ?? ''),
    planningSectionChief: String(orgChart?.planningSectionChief ?? ''),
    logisticsSectionChief: String(orgChart?.logisticsSectionChief ?? ''),
    financeSectionChief: String(orgChart?.financeSectionChief ?? ''),
    intelInvestSectionChief: String(orgChart?.intelInvestSectionChief ?? ''),
  }
}

export function migrateIcs201FormState(raw: LegacyForm): Ics201FormState {
  if (raw.schemaVersion === 2 && raw.safetyAnalysisBox13 && raw.hazmatAssessmentBox15) {
    return {
      ...(raw as Ics201FormState),
      resources: Array.isArray(raw.resources)
        ? raw.resources.map((row, index) =>
            normalizeIcs201ResourceSummaryRow({
              ...(row as LegacyResourceRow),
              id: typeof (row as LegacyResourceRow).id === 'number' ? (row as LegacyResourceRow).id : index + 1,
            })
          )
        : [],
    }
  }

  const orgChart = migrateLegacyOrgChart(raw.orgChart)
  const safetyAnalysisBox13 =
    raw.safetyAnalysisBox13 ??
    migrateLegacySafetyRows(raw.safetyAnalysis, orgChart.safetyOfficer)

  if (raw.weatherForecast && !safetyAnalysisBox13.weather.forecast) {
    safetyAnalysisBox13.weather.forecast = String(raw.weatherForecast)
  }

  return {
    schemaVersion: 2,
    incidentName: String(raw.incidentName ?? ''),
    incidentNumber: String(raw.incidentNumber ?? ''),
    incidentLocation: String(raw.incidentLocation ?? ''),
    dateInitiated: String(raw.dateInitiated ?? ''),
    timeInitiated: String(raw.timeInitiated ?? ''),
    preparedDateTime: String(raw.preparedDateTime ?? ''),
    operationalPeriodStart: String(raw.operationalPeriodStart ?? ''),
    operationalPeriodEnd: String(raw.operationalPeriodEnd ?? ''),
    jurisdiction: String(raw.jurisdiction ?? ''),
    preparedBy: String(raw.preparedBy ?? ''),
    preparedByName: String(raw.preparedByName ?? ''),
    preparedByPositionTitle: String(raw.preparedByPositionTitle ?? ''),
    preparedBySignature: String(raw.preparedBySignature ?? ''),
    mapSketchPolygon: Array.isArray(raw.mapSketchPolygon)
      ? raw.mapSketchPolygon.map((vertex) => ({
          longitude: Number(vertex.longitude),
          latitude: Number(vertex.latitude),
        }))
      : [],
    currentSituationSummary: String(raw.currentSituationSummary ?? ''),
    weatherForecast: String(raw.weatherForecast ?? ''),
    projectedIncidentCourse: String(raw.projectedIncidentCourse ?? ''),
    objectives: Array.isArray(raw.objectives) ? raw.objectives : [],
    actions: migrateLegacyActions(raw.actions),
    orgChart,
    resources: migrateLegacyResources(raw.resources),
    safetyAnalysisBox13,
    hazmatAssessmentBox15: raw.hazmatAssessmentBox15 ?? createEmptyHazmatAssessmentBox15(),
  } as Ics201FormState
}
