import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import {
  ICS209_DEFAULT_DAMAGE_CATEGORIES,
  ICS209_LIFE_SAFETY_THREAT_LABELS,
  ICS209_PUBLIC_STATUS_DEFAULTS,
  ICS209_RESPONDER_STATUS_DEFAULTS,
} from '@/features/ics209/constants'
import type {
  Ics209AgencyResourceRow,
  Ics209ApprovalRoutingDraft,
  Ics209DamageRow,
  Ics209FormSectionDrafts,
  Ics209FormState,
  Ics209IncidentInfoDraft,
  Ics209IncidentSummaryDraft,
  Ics209LifeSafetyThreatDraft,
  Ics209LifeSafetyThreatKey,
  Ics209LifeSafetyThreats,
  Ics209LocationInfoDraft,
  Ics209PercentMetric,
  Ics209PlannedActionsProjectionsDraft,
  Ics209PublicResponderStatusDraft,
  Ics209ReportVersion,
  Ics209ResourceCell,
  Ics209ResourceColumn,
  Ics209ResourceCommitmentDraft,
  Ics209SectionId,
  Ics209StatusCountRow,
  Ics209TimeHorizonFields,
  Ics209Version,
  Ics209VersionRow,
  Ics209WeatherProjectionsDraft,
} from '@/features/ics209/types'

const LIFE_SAFETY_THREAT_KEYS = Object.keys(
  ICS209_LIFE_SAFETY_THREAT_LABELS
) as Ics209LifeSafetyThreatKey[]

function emptyTimeHorizon(): Ics209TimeHorizonFields {
  return {
    hours12: '',
    hours24: '',
    hours48: '',
    hours72: '',
    after72Hours: '',
  }
}

function normalizeReportVersion(value: unknown): Ics209ReportVersion {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized === 'initial') return 'initial'
  if (normalized === 'update' || normalized === 'updated') return 'update'
  if (normalized === 'final') return 'final'
  return ''
}

function normalizePercentMetric(value: unknown): Ics209PercentMetric {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized === 'contained') return 'contained'
  if (normalized === 'completed') return 'completed'
  return ''
}

function normalizeTimeHorizon(value: Partial<Ics209TimeHorizonFields> | undefined): Ics209TimeHorizonFields {
  return {
    hours12: String(value?.hours12 ?? ''),
    hours24: String(value?.hours24 ?? ''),
    hours48: String(value?.hours48 ?? ''),
    hours72: String(value?.hours72 ?? ''),
    after72Hours: String(value?.after72Hours ?? ''),
  }
}

function createDefaultStatusRows(
  defaults: Omit<Ics209StatusCountRow, 'thisPeriod' | 'toDate' | 'count'>[]
): Ics209StatusCountRow[] {
  return defaults.map((row) => ({
    ...row,
    thisPeriod: '',
    toDate: '',
    count: '',
  }))
}

function normalizeStatusRows(
  rows: Ics209StatusCountRow[] | undefined,
  defaults: Omit<Ics209StatusCountRow, 'thisPeriod' | 'toDate' | 'count'>[]
): Ics209StatusCountRow[] {
  if (!rows || rows.length === 0) {
    return createDefaultStatusRows(defaults)
  }
  return defaults.map((defaultRow) => {
    const existing = rows.find((row) => row.key === defaultRow.key)
    return {
      key: defaultRow.key,
      label: existing?.label || defaultRow.label,
      thisPeriod: String(existing?.thisPeriod ?? ''),
      toDate: String(existing?.toDate ?? ''),
      count: String(existing?.count ?? ''),
    }
  })
}

function createDefaultLifeSafetyThreats(): Ics209LifeSafetyThreats {
  return LIFE_SAFETY_THREAT_KEYS.reduce((acc, key) => {
    acc[key] = false
    return acc
  }, {} as Ics209LifeSafetyThreats)
}

function normalizeLifeSafetyThreats(
  threats: Partial<Ics209LifeSafetyThreats> | undefined
): Ics209LifeSafetyThreats {
  const defaults = createDefaultLifeSafetyThreats()
  for (const key of LIFE_SAFETY_THREAT_KEYS) {
    defaults[key] = Boolean(threats?.[key])
  }
  return defaults
}

function createDefaultDamageRows(): Ics209DamageRow[] {
  return ICS209_DEFAULT_DAMAGE_CATEGORIES.map((category, index) => ({
    id: index + 1,
    category,
    structuralSummary: '',
    threatened72hr: '',
    damaged: '',
    destroyed: '',
  }))
}

function normalizeDamageRow(row: Ics209DamageRow, index: number): Ics209DamageRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    category: String(row.category ?? ''),
    structuralSummary: String(row.structuralSummary ?? ''),
    threatened72hr: String(row.threatened72hr ?? ''),
    damaged: String(row.damaged ?? ''),
    destroyed: String(row.destroyed ?? ''),
  }
}

function normalizeResourceCell(cell: Partial<Ics209ResourceCell> | undefined): Ics209ResourceCell {
  return {
    resources: String(cell?.resources ?? ''),
    personnel: String(cell?.personnel ?? ''),
  }
}

function normalizeResourceColumns(columns: Ics209ResourceColumn[] | undefined): Ics209ResourceColumn[] {
  if (!columns || columns.length === 0) {
    return [{ id: 'resource-1', label: 'Resources' }]
  }
  return columns.map((column, index) => ({
    id: String(column.id || `resource-${index + 1}`),
    label: String(column.label ?? ''),
  }))
}

function normalizeAgencyResourceRow(
  row: Ics209AgencyResourceRow,
  index: number,
  columnIds: string[]
): Ics209AgencyResourceRow {
  const resourceCounts: Record<string, Ics209ResourceCell> = {}
  for (const columnId of columnIds) {
    resourceCounts[columnId] = normalizeResourceCell(row.resourceCounts?.[columnId])
  }
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    agency: String(row.agency ?? ''),
    resourceCounts,
    additionalPersonnel: String(row.additionalPersonnel ?? ''),
    totalPersonnel: String(row.totalPersonnel ?? ''),
  }
}

export function cloneIcs209StatusRows(rows: Ics209StatusCountRow[]): Ics209StatusCountRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs209DamageRows(rows: Ics209DamageRow[]): Ics209DamageRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs209ResourceColumns(columns: Ics209ResourceColumn[]): Ics209ResourceColumn[] {
  return columns.map((column) => ({ ...column }))
}

export function cloneIcs209AgencyResourceRows(
  rows: Ics209AgencyResourceRow[]
): Ics209AgencyResourceRow[] {
  return rows.map((row) => ({
    ...row,
    resourceCounts: Object.fromEntries(
      Object.entries(row.resourceCounts).map(([key, cell]) => [key, { ...cell }])
    ),
  }))
}

export function cloneIcs209FormState(form: Ics209FormState): Ics209FormState {
  return {
    ...form,
    projectedActivity: { ...form.projectedActivity },
    threatSummary: { ...form.threatSummary },
    criticalResourceNeeds: { ...form.criticalResourceNeeds },
    lifeSafetyThreats: { ...form.lifeSafetyThreats },
    damageRows: cloneIcs209DamageRows(form.damageRows),
    publicStatusRows: cloneIcs209StatusRows(form.publicStatusRows),
    responderStatusRows: cloneIcs209StatusRows(form.responderStatusRows),
    resourceColumns: cloneIcs209ResourceColumns(form.resourceColumns),
    agencyResourceRows: cloneIcs209AgencyResourceRows(form.agencyResourceRows),
  }
}

export function normalizeIcs209FormState(form: Ics209FormState): Ics209FormState {
  const resourceColumns = normalizeResourceColumns(form.resourceColumns)
  const columnIds = resourceColumns.map((column) => column.id)
  const damageRows =
    (form.damageRows ?? []).length > 0
      ? form.damageRows.map(normalizeDamageRow)
      : createDefaultDamageRows()
  const agencyResourceRows =
    (form.agencyResourceRows ?? []).length > 0
      ? form.agencyResourceRows.map((row, index) =>
          normalizeAgencyResourceRow(row, index, columnIds)
        )
      : []

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    incidentNumber: String(form.incidentNumber ?? ''),
    reportVersion: normalizeReportVersion(form.reportVersion),
    reportNumber: String(form.reportNumber ?? ''),
    incidentCommanders: String(form.incidentCommanders ?? ''),
    incidentManagementOrganization: String(form.incidentManagementOrganization ?? ''),
    incidentStartDate: String(form.incidentStartDate ?? ''),
    incidentStartTime: String(form.incidentStartTime ?? ''),
    incidentStartTimeZone: String(form.incidentStartTimeZone ?? ''),
    currentIncidentSize: String(form.currentIncidentSize ?? ''),
    percentMetric: normalizePercentMetric(form.percentMetric),
    percentValue: String(form.percentValue ?? ''),
    incidentDefinition: String(form.incidentDefinition ?? ''),
    incidentComplexityLevel: String(form.incidentComplexityLevel ?? ''),
    timePeriodFrom: String(form.timePeriodFrom ?? ''),
    timePeriodTo: String(form.timePeriodTo ?? ''),
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPosition: String(form.preparedByPosition ?? ''),
    preparedByDateTime: String(form.preparedByDateTime ?? ''),
    submittedDateTime: String(form.submittedDateTime ?? ''),
    submittedTimeZone: String(form.submittedTimeZone ?? ''),
    approvedByName: String(form.approvedByName ?? ''),
    approvedByPosition: String(form.approvedByPosition ?? ''),
    approvedBySignature: String(form.approvedBySignature ?? ''),
    primarySentTo: String(form.primarySentTo ?? ''),
    locationState: String(form.locationState ?? ''),
    locationCounty: String(form.locationCounty ?? ''),
    locationCity: String(form.locationCity ?? ''),
    locationUnitOrOther: String(form.locationUnitOrOther ?? ''),
    incidentJurisdiction: String(form.incidentJurisdiction ?? ''),
    locationOwnership: String(form.locationOwnership ?? ''),
    longitude: String(form.longitude ?? ''),
    latitude: String(form.latitude ?? ''),
    usNationalGrid: String(form.usNationalGrid ?? ''),
    legalDescription: String(form.legalDescription ?? ''),
    shortLocationDescription: String(form.shortLocationDescription ?? ''),
    utmCoordinates: String(form.utmCoordinates ?? ''),
    geospatialDataNotes: String(form.geospatialDataNotes ?? ''),
    significantEvents: String(form.significantEvents ?? ''),
    primaryMaterialsHazards: String(form.primaryMaterialsHazards ?? ''),
    damageAssessmentSummary: String(form.damageAssessmentSummary ?? ''),
    damageRows,
    publicStatusRows: normalizeStatusRows(form.publicStatusRows, ICS209_PUBLIC_STATUS_DEFAULTS),
    publicTotalAffectedThisPeriod: String(form.publicTotalAffectedThisPeriod ?? ''),
    publicTotalAffectedToDate: String(form.publicTotalAffectedToDate ?? ''),
    responderStatusRows: normalizeStatusRows(form.responderStatusRows, ICS209_RESPONDER_STATUS_DEFAULTS),
    responderTotalAffectedThisPeriod: String(form.responderTotalAffectedThisPeriod ?? ''),
    responderTotalAffectedToDate: String(form.responderTotalAffectedToDate ?? ''),
    lifeSafetyThreatRemarks: String(form.lifeSafetyThreatRemarks ?? ''),
    lifeSafetyThreatActive: Boolean(form.lifeSafetyThreatActive),
    lifeSafetyThreatNotes: String(form.lifeSafetyThreatNotes ?? ''),
    lifeSafetyThreats: normalizeLifeSafetyThreats(form.lifeSafetyThreats),
    weatherConcerns: String(form.weatherConcerns ?? ''),
    projectedActivity: normalizeTimeHorizon(form.projectedActivity),
    strategicObjectives: String(form.strategicObjectives ?? ''),
    threatSummary: normalizeTimeHorizon(form.threatSummary),
    criticalResourceNeeds: normalizeTimeHorizon(form.criticalResourceNeeds),
    strategicDiscussion: String(form.strategicDiscussion ?? ''),
    plannedActionsNextPeriod: String(form.plannedActionsNextPeriod ?? ''),
    projectedFinalSize: String(form.projectedFinalSize ?? ''),
    anticipatedCompletionDate: String(form.anticipatedCompletionDate ?? ''),
    projectedDemobilizationStartDate: String(form.projectedDemobilizationStartDate ?? ''),
    estimatedCostsToDate: String(form.estimatedCostsToDate ?? ''),
    projectedFinalCostEstimate: String(form.projectedFinalCostEstimate ?? ''),
    remarks: String(form.remarks ?? ''),
    resourceColumns,
    agencyResourceRows,
    totalResources: String(form.totalResources ?? ''),
    cooperatingOrganizations: String(form.cooperatingOrganizations ?? ''),
  }
}

export function mapIcs209VersionRow(row: Ics209VersionRow): Ics209Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs209FormState(normalizeIcs209FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs209Form(id: string, partial?: Partial<Ics209FormState>): Ics209FormState {
  return normalizeIcs209FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    incidentNumber: partial?.incidentNumber ?? '',
    reportVersion: partial?.reportVersion ?? 'initial',
    reportNumber: partial?.reportNumber ?? '',
    incidentCommanders: partial?.incidentCommanders ?? '',
    incidentManagementOrganization: partial?.incidentManagementOrganization ?? '',
    incidentStartDate: partial?.incidentStartDate ?? '',
    incidentStartTime: partial?.incidentStartTime ?? '',
    incidentStartTimeZone: partial?.incidentStartTimeZone ?? '',
    currentIncidentSize: partial?.currentIncidentSize ?? '',
    percentMetric: partial?.percentMetric ?? '',
    percentValue: partial?.percentValue ?? '',
    incidentDefinition: partial?.incidentDefinition ?? '',
    incidentComplexityLevel: partial?.incidentComplexityLevel ?? '',
    timePeriodFrom: partial?.timePeriodFrom ?? '',
    timePeriodTo: partial?.timePeriodTo ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedByPosition: partial?.preparedByPosition ?? '',
    preparedByDateTime: partial?.preparedByDateTime ?? '',
    submittedDateTime: partial?.submittedDateTime ?? '',
    submittedTimeZone: partial?.submittedTimeZone ?? '',
    approvedByName: partial?.approvedByName ?? '',
    approvedByPosition: partial?.approvedByPosition ?? '',
    approvedBySignature: partial?.approvedBySignature ?? '',
    primarySentTo: partial?.primarySentTo ?? '',
    locationState: partial?.locationState ?? '',
    locationCounty: partial?.locationCounty ?? '',
    locationCity: partial?.locationCity ?? '',
    locationUnitOrOther: partial?.locationUnitOrOther ?? '',
    incidentJurisdiction: partial?.incidentJurisdiction ?? '',
    locationOwnership: partial?.locationOwnership ?? '',
    longitude: partial?.longitude ?? '',
    latitude: partial?.latitude ?? '',
    usNationalGrid: partial?.usNationalGrid ?? '',
    legalDescription: partial?.legalDescription ?? '',
    shortLocationDescription: partial?.shortLocationDescription ?? '',
    utmCoordinates: partial?.utmCoordinates ?? '',
    geospatialDataNotes: partial?.geospatialDataNotes ?? '',
    significantEvents: partial?.significantEvents ?? '',
    primaryMaterialsHazards: partial?.primaryMaterialsHazards ?? '',
    damageAssessmentSummary: partial?.damageAssessmentSummary ?? '',
    damageRows: partial?.damageRows ?? createDefaultDamageRows(),
    publicStatusRows: partial?.publicStatusRows ?? createDefaultStatusRows(ICS209_PUBLIC_STATUS_DEFAULTS),
    publicTotalAffectedThisPeriod: partial?.publicTotalAffectedThisPeriod ?? '',
    publicTotalAffectedToDate: partial?.publicTotalAffectedToDate ?? '',
    responderStatusRows:
      partial?.responderStatusRows ?? createDefaultStatusRows(ICS209_RESPONDER_STATUS_DEFAULTS),
    responderTotalAffectedThisPeriod: partial?.responderTotalAffectedThisPeriod ?? '',
    responderTotalAffectedToDate: partial?.responderTotalAffectedToDate ?? '',
    lifeSafetyThreatRemarks: partial?.lifeSafetyThreatRemarks ?? '',
    lifeSafetyThreatActive: partial?.lifeSafetyThreatActive ?? false,
    lifeSafetyThreatNotes: partial?.lifeSafetyThreatNotes ?? '',
    lifeSafetyThreats: partial?.lifeSafetyThreats ?? createDefaultLifeSafetyThreats(),
    weatherConcerns: partial?.weatherConcerns ?? '',
    projectedActivity: partial?.projectedActivity ?? emptyTimeHorizon(),
    strategicObjectives: partial?.strategicObjectives ?? '',
    threatSummary: partial?.threatSummary ?? emptyTimeHorizon(),
    criticalResourceNeeds: partial?.criticalResourceNeeds ?? emptyTimeHorizon(),
    strategicDiscussion: partial?.strategicDiscussion ?? '',
    plannedActionsNextPeriod: partial?.plannedActionsNextPeriod ?? '',
    projectedFinalSize: partial?.projectedFinalSize ?? '',
    anticipatedCompletionDate: partial?.anticipatedCompletionDate ?? '',
    projectedDemobilizationStartDate: partial?.projectedDemobilizationStartDate ?? '',
    estimatedCostsToDate: partial?.estimatedCostsToDate ?? '',
    projectedFinalCostEstimate: partial?.projectedFinalCostEstimate ?? '',
    remarks: partial?.remarks ?? '',
    resourceColumns: partial?.resourceColumns ?? [{ id: 'resource-1', label: 'Resources' }],
    agencyResourceRows: partial?.agencyResourceRows ?? [],
    totalResources: partial?.totalResources ?? '',
    cooperatingOrganizations: partial?.cooperatingOrganizations ?? '',
  })
}

export function createLocalIcs209DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics209AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics209FormState): Ics209FormState {
  return cloneIcs209FormState({ ...normalizeIcs209FormState(form), id: documentId })
}

export function formatIcs209ReportVersion(version: Ics209ReportVersion): string {
  if (version === 'initial') return 'Initial'
  if (version === 'update') return 'Update'
  if (version === 'final') return 'Final'
  return '—'
}

export function formatIcs209PercentMetric(metric: Ics209PercentMetric, value: string): string {
  if (!value.trim()) return '—'
  const label = metric === 'contained' ? 'Contained' : metric === 'completed' ? 'Completed' : ''
  return label ? `${value.trim()}% ${label}` : `${value.trim()}%`
}

export function formatIcs209TimeHorizon(fields: Ics209TimeHorizonFields): string {
  const parts = [
    fields.hours12.trim() ? `12 hours: ${fields.hours12.trim()}` : '',
    fields.hours24.trim() ? `24 hours: ${fields.hours24.trim()}` : '',
    fields.hours48.trim() ? `48 hours: ${fields.hours48.trim()}` : '',
    fields.hours72.trim() ? `72 hours: ${fields.hours72.trim()}` : '',
    fields.after72Hours.trim() ? `After 72 hours: ${fields.after72Hours.trim()}` : '',
  ].filter(Boolean)
  return parts.join('\n')
}

function extractIncidentInfoDraft(form: Ics209FormState): Ics209IncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    incidentNumber: form.incidentNumber,
    reportVersion: form.reportVersion,
    reportNumber: form.reportNumber,
    incidentCommanders: form.incidentCommanders,
    incidentManagementOrganization: form.incidentManagementOrganization,
    incidentStartDate: form.incidentStartDate,
    incidentStartTime: form.incidentStartTime,
    incidentStartTimeZone: form.incidentStartTimeZone,
    currentIncidentSize: form.currentIncidentSize,
    percentMetric: form.percentMetric,
    percentValue: form.percentValue,
    incidentDefinition: form.incidentDefinition,
    incidentComplexityLevel: form.incidentComplexityLevel,
    timePeriodFrom: form.timePeriodFrom,
    timePeriodTo: form.timePeriodTo,
  }
}

function extractApprovalRoutingDraft(form: Ics209FormState): Ics209ApprovalRoutingDraft {
  return {
    preparedByName: form.preparedByName,
    preparedByPosition: form.preparedByPosition,
    preparedByDateTime: form.preparedByDateTime,
    submittedDateTime: form.submittedDateTime,
    submittedTimeZone: form.submittedTimeZone,
    approvedByName: form.approvedByName,
    approvedByPosition: form.approvedByPosition,
    approvedBySignature: form.approvedBySignature,
    primarySentTo: form.primarySentTo,
  }
}

function extractLocationInfoDraft(form: Ics209FormState): Ics209LocationInfoDraft {
  return {
    locationState: form.locationState,
    locationCounty: form.locationCounty,
    locationCity: form.locationCity,
    locationUnitOrOther: form.locationUnitOrOther,
    incidentJurisdiction: form.incidentJurisdiction,
    locationOwnership: form.locationOwnership,
    longitude: form.longitude,
    latitude: form.latitude,
    usNationalGrid: form.usNationalGrid,
    legalDescription: form.legalDescription,
    shortLocationDescription: form.shortLocationDescription,
    utmCoordinates: form.utmCoordinates,
    geospatialDataNotes: form.geospatialDataNotes,
  }
}

function extractIncidentSummaryDraft(form: Ics209FormState): Ics209IncidentSummaryDraft {
  return {
    significantEvents: form.significantEvents,
    primaryMaterialsHazards: form.primaryMaterialsHazards,
    damageAssessmentSummary: form.damageAssessmentSummary,
    damageRows: cloneIcs209DamageRows(form.damageRows),
  }
}

function extractPublicResponderStatusDraft(form: Ics209FormState): Ics209PublicResponderStatusDraft {
  return {
    publicStatusRows: cloneIcs209StatusRows(form.publicStatusRows),
    publicTotalAffectedThisPeriod: form.publicTotalAffectedThisPeriod,
    publicTotalAffectedToDate: form.publicTotalAffectedToDate,
    responderStatusRows: cloneIcs209StatusRows(form.responderStatusRows),
    responderTotalAffectedThisPeriod: form.responderTotalAffectedThisPeriod,
    responderTotalAffectedToDate: form.responderTotalAffectedToDate,
  }
}

function extractLifeSafetyThreatDraft(form: Ics209FormState): Ics209LifeSafetyThreatDraft {
  return {
    lifeSafetyThreatRemarks: form.lifeSafetyThreatRemarks,
    lifeSafetyThreatActive: form.lifeSafetyThreatActive,
    lifeSafetyThreatNotes: form.lifeSafetyThreatNotes,
    lifeSafetyThreats: { ...form.lifeSafetyThreats },
  }
}

function extractWeatherProjectionsDraft(form: Ics209FormState): Ics209WeatherProjectionsDraft {
  return {
    weatherConcerns: form.weatherConcerns,
    projectedActivity: { ...form.projectedActivity },
  }
}

function extractPlannedActionsProjectionsDraft(
  form: Ics209FormState
): Ics209PlannedActionsProjectionsDraft {
  return {
    plannedActionsNextPeriod: form.plannedActionsNextPeriod,
    projectedFinalSize: form.projectedFinalSize,
    anticipatedCompletionDate: form.anticipatedCompletionDate,
    projectedDemobilizationStartDate: form.projectedDemobilizationStartDate,
    estimatedCostsToDate: form.estimatedCostsToDate,
    projectedFinalCostEstimate: form.projectedFinalCostEstimate,
  }
}

function extractResourceCommitmentDraft(form: Ics209FormState): Ics209ResourceCommitmentDraft {
  return {
    resourceColumns: cloneIcs209ResourceColumns(form.resourceColumns),
    agencyResourceRows: cloneIcs209AgencyResourceRows(form.agencyResourceRows),
    totalResources: form.totalResources,
    cooperatingOrganizations: form.cooperatingOrganizations,
  }
}

export function extractIcs209SectionDraft(
  form: Ics209FormState,
  section: Ics209SectionId
): Ics209FormSectionDrafts[Ics209SectionId] {
  switch (section) {
    case 'incident-info':
      return extractIncidentInfoDraft(form)
    case 'approval-routing':
      return extractApprovalRoutingDraft(form)
    case 'location-info':
      return extractLocationInfoDraft(form)
    case 'incident-summary':
      return extractIncidentSummaryDraft(form)
    case 'public-responder-status':
      return extractPublicResponderStatusDraft(form)
    case 'life-safety-threat':
      return extractLifeSafetyThreatDraft(form)
    case 'weather-projections':
      return extractWeatherProjectionsDraft(form)
    case 'strategic-objectives':
      return form.strategicObjectives
    case 'threat-summary':
      return { threatSummary: { ...form.threatSummary } }
    case 'critical-resources':
      return { criticalResourceNeeds: { ...form.criticalResourceNeeds } }
    case 'strategic-discussion':
      return form.strategicDiscussion
    case 'planned-actions-projections':
      return extractPlannedActionsProjectionsDraft(form)
    case 'remarks':
      return form.remarks
    case 'resource-commitment':
      return extractResourceCommitmentDraft(form)
    default:
      return undefined
  }
}

export function applyIcs209SectionDraft(
  form: Ics209FormState,
  section: Ics209SectionId,
  draft: Ics209FormSectionDrafts[Ics209SectionId]
): Ics209FormState {
  switch (section) {
    case 'incident-info':
      return { ...form, ...(draft as Ics209IncidentInfoDraft) }
    case 'approval-routing':
      return { ...form, ...(draft as Ics209ApprovalRoutingDraft) }
    case 'location-info':
      return { ...form, ...(draft as Ics209LocationInfoDraft) }
    case 'incident-summary':
      return { ...form, ...(draft as Ics209IncidentSummaryDraft) }
    case 'public-responder-status':
      return { ...form, ...(draft as Ics209PublicResponderStatusDraft) }
    case 'life-safety-threat':
      return { ...form, ...(draft as Ics209LifeSafetyThreatDraft) }
    case 'weather-projections':
      return { ...form, ...(draft as Ics209WeatherProjectionsDraft) }
    case 'strategic-objectives':
      return { ...form, strategicObjectives: draft as string }
    case 'threat-summary':
      return {
        ...form,
        threatSummary: { ...(draft as { threatSummary: Ics209TimeHorizonFields }).threatSummary },
      }
    case 'critical-resources':
      return {
        ...form,
        criticalResourceNeeds: {
          ...(draft as { criticalResourceNeeds: Ics209TimeHorizonFields }).criticalResourceNeeds,
        },
      }
    case 'strategic-discussion':
      return { ...form, strategicDiscussion: draft as string }
    case 'planned-actions-projections':
      return { ...form, ...(draft as Ics209PlannedActionsProjectionsDraft) }
    case 'remarks':
      return { ...form, remarks: draft as string }
    case 'resource-commitment':
      return { ...form, ...(draft as Ics209ResourceCommitmentDraft) }
    default:
      return form
  }
}

export function getIcs209FormForExport(
  form: Ics209FormState,
  sectionDrafts: Ics209FormSectionDrafts
): Ics209FormState {
  let exportForm = cloneIcs209FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics209SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs209SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}
