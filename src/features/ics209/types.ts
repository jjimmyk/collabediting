import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics209ReportVersion = '' | 'initial' | 'update' | 'final'
export type Ics209PercentMetric = '' | 'contained' | 'completed'

export type Ics209TimeHorizonFields = {
  hours12: string
  hours24: string
  hours48: string
  hours72: string
  after72Hours: string
}

export type Ics209StatusCountRow = {
  key: string
  label: string
  thisPeriod: string
  toDate: string
  count: string
}

export type Ics209LifeSafetyThreatKey =
  | 'noLikelyThreat'
  | 'potentialFutureThreat'
  | 'massNotificationsInProgress'
  | 'massNotificationsCompleted'
  | 'noEvacuationsImminent'
  | 'planningForEvacuation'
  | 'planningForShelterInPlace'
  | 'evacuationsInProgress'
  | 'shelterInPlaceInProgress'
  | 'repopulationInProgress'
  | 'massImmunizationInProgress'
  | 'massImmunizationComplete'
  | 'quarantineInProgress'
  | 'areaRestrictionInEffect'

export type Ics209LifeSafetyThreats = Record<Ics209LifeSafetyThreatKey, boolean>

export type Ics209DamageRow = {
  id: number
  category: string
  structuralSummary: string
  threatened72hr: string
  damaged: string
  destroyed: string
}

export type Ics209ResourceColumn = {
  id: string
  label: string
}

export type Ics209ResourceCell = {
  resources: string
  personnel: string
}

export type Ics209AgencyResourceRow = {
  id: number
  agency: string
  resourceCounts: Record<string, Ics209ResourceCell>
  additionalPersonnel: string
  totalPersonnel: string
}

export type Ics209FormState = {
  id: string
  incidentName: string
  incidentNumber: string
  reportVersion: Ics209ReportVersion
  reportNumber: string
  incidentCommanders: string
  incidentManagementOrganization: string
  incidentStartDate: string
  incidentStartTime: string
  incidentStartTimeZone: string
  currentIncidentSize: string
  percentMetric: Ics209PercentMetric
  percentValue: string
  incidentDefinition: string
  incidentComplexityLevel: string
  timePeriodFrom: string
  timePeriodTo: string
  preparedByName: string
  preparedByPosition: string
  preparedByDateTime: string
  submittedDateTime: string
  submittedTimeZone: string
  approvedByName: string
  approvedByPosition: string
  approvedBySignature: string
  primarySentTo: string
  locationState: string
  locationCounty: string
  locationCity: string
  locationUnitOrOther: string
  incidentJurisdiction: string
  locationOwnership: string
  longitude: string
  latitude: string
  usNationalGrid: string
  legalDescription: string
  shortLocationDescription: string
  utmCoordinates: string
  geospatialDataNotes: string
  significantEvents: string
  primaryMaterialsHazards: string
  damageAssessmentSummary: string
  damageRows: Ics209DamageRow[]
  publicStatusRows: Ics209StatusCountRow[]
  publicTotalAffectedThisPeriod: string
  publicTotalAffectedToDate: string
  responderStatusRows: Ics209StatusCountRow[]
  responderTotalAffectedThisPeriod: string
  responderTotalAffectedToDate: string
  lifeSafetyThreatRemarks: string
  lifeSafetyThreatActive: boolean
  lifeSafetyThreatNotes: string
  lifeSafetyThreats: Ics209LifeSafetyThreats
  weatherConcerns: string
  projectedActivity: Ics209TimeHorizonFields
  strategicObjectives: string
  threatSummary: Ics209TimeHorizonFields
  criticalResourceNeeds: Ics209TimeHorizonFields
  strategicDiscussion: string
  plannedActionsNextPeriod: string
  projectedFinalSize: string
  anticipatedCompletionDate: string
  projectedDemobilizationStartDate: string
  estimatedCostsToDate: string
  projectedFinalCostEstimate: string
  remarks: string
  resourceColumns: Ics209ResourceColumn[]
  agencyResourceRows: Ics209AgencyResourceRow[]
  totalResources: string
  cooperatingOrganizations: string
}

export type Ics209Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics209FormState
  signatures: Ics201VersionSignature[]
}

export type Ics209DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics209FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics209VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics209FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics209DocumentBundle = {
  document: Ics209DocumentRow
  versions: Ics209Version[]
}

export type Ics209SectionId =
  | 'incident-info'
  | 'approval-routing'
  | 'location-info'
  | 'incident-summary'
  | 'public-responder-status'
  | 'life-safety-threat'
  | 'weather-projections'
  | 'strategic-objectives'
  | 'threat-summary'
  | 'critical-resources'
  | 'strategic-discussion'
  | 'planned-actions-projections'
  | 'remarks'
  | 'resource-commitment'

export type Ics209IncidentInfoDraft = Pick<
  Ics209FormState,
  | 'incidentName'
  | 'incidentNumber'
  | 'reportVersion'
  | 'reportNumber'
  | 'incidentCommanders'
  | 'incidentManagementOrganization'
  | 'incidentStartDate'
  | 'incidentStartTime'
  | 'incidentStartTimeZone'
  | 'currentIncidentSize'
  | 'percentMetric'
  | 'percentValue'
  | 'incidentDefinition'
  | 'incidentComplexityLevel'
  | 'timePeriodFrom'
  | 'timePeriodTo'
>

export type Ics209ApprovalRoutingDraft = Pick<
  Ics209FormState,
  | 'preparedByName'
  | 'preparedByPosition'
  | 'preparedByDateTime'
  | 'submittedDateTime'
  | 'submittedTimeZone'
  | 'approvedByName'
  | 'approvedByPosition'
  | 'approvedBySignature'
  | 'primarySentTo'
>

export type Ics209LocationInfoDraft = Pick<
  Ics209FormState,
  | 'locationState'
  | 'locationCounty'
  | 'locationCity'
  | 'locationUnitOrOther'
  | 'incidentJurisdiction'
  | 'locationOwnership'
  | 'longitude'
  | 'latitude'
  | 'usNationalGrid'
  | 'legalDescription'
  | 'shortLocationDescription'
  | 'utmCoordinates'
  | 'geospatialDataNotes'
>

export type Ics209IncidentSummaryDraft = Pick<
  Ics209FormState,
  'significantEvents' | 'primaryMaterialsHazards' | 'damageAssessmentSummary' | 'damageRows'
>

export type Ics209PublicResponderStatusDraft = Pick<
  Ics209FormState,
  | 'publicStatusRows'
  | 'publicTotalAffectedThisPeriod'
  | 'publicTotalAffectedToDate'
  | 'responderStatusRows'
  | 'responderTotalAffectedThisPeriod'
  | 'responderTotalAffectedToDate'
>

export type Ics209LifeSafetyThreatDraft = Pick<
  Ics209FormState,
  | 'lifeSafetyThreatRemarks'
  | 'lifeSafetyThreatActive'
  | 'lifeSafetyThreatNotes'
  | 'lifeSafetyThreats'
>

export type Ics209WeatherProjectionsDraft = Pick<
  Ics209FormState,
  'weatherConcerns' | 'projectedActivity'
>

export type Ics209PlannedActionsProjectionsDraft = Pick<
  Ics209FormState,
  | 'plannedActionsNextPeriod'
  | 'projectedFinalSize'
  | 'anticipatedCompletionDate'
  | 'projectedDemobilizationStartDate'
  | 'estimatedCostsToDate'
  | 'projectedFinalCostEstimate'
>

export type Ics209ResourceCommitmentDraft = Pick<
  Ics209FormState,
  | 'resourceColumns'
  | 'agencyResourceRows'
  | 'totalResources'
  | 'cooperatingOrganizations'
>

export type Ics209FormSectionDrafts = {
  'incident-info'?: Ics209IncidentInfoDraft
  'approval-routing'?: Ics209ApprovalRoutingDraft
  'location-info'?: Ics209LocationInfoDraft
  'incident-summary'?: Ics209IncidentSummaryDraft
  'public-responder-status'?: Ics209PublicResponderStatusDraft
  'life-safety-threat'?: Ics209LifeSafetyThreatDraft
  'weather-projections'?: Ics209WeatherProjectionsDraft
  'strategic-objectives'?: string
  'threat-summary'?: Pick<Ics209FormState, 'threatSummary'>
  'critical-resources'?: Pick<Ics209FormState, 'criticalResourceNeeds'>
  'strategic-discussion'?: string
  'planned-actions-projections'?: Ics209PlannedActionsProjectionsDraft
  remarks?: string
  'resource-commitment'?: Ics209ResourceCommitmentDraft
}
