import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics208hmYesNo = '' | 'yes' | 'no'

export type Ics208hmOrganizationAssignments = {
  incidentCommander: string
  hmGroupSupervisor: string
  techSpecialistHmReference: string
  safetyOfficer: string
  entryLeader: string
  siteAccessControlLeader: string
  asstSafetyOfficerHm: string
  decontaminationLeader: string
  safeRefugeAreaMgr: string
  environmentalHealth: string
  orgFunction15: string
  orgFunction16: string
}

export type Ics208hmEntryTeamRow = {
  id: number
  entryName: string
  entryPpeLevel: string
  deconName: string
  deconPpeLevel: string
}

export type Ics208hmMaterialRow = {
  id: number
  material: string
  containerType: string
  qty: string
  physState: string
  ph: string
  idlh: string
  fp: string
  it: string
  vp: string
  vd: string
  sg: string
  lel: string
  uel: string
  comment: string
}

export type Ics208hmSiteMapIncludes = {
  weather: boolean
  commandPost: boolean
  zones: boolean
  assemblyAreas: boolean
  escapeRoutes: boolean
  other: boolean
}

export type Ics208hmFormState = {
  id: string
  incidentName: string
  datePrepared: string
  operationalPeriodDateFrom: string
  operationalPeriodDateTo: string
  operationalPeriodTimeFrom: string
  operationalPeriodTimeTo: string
  incidentLocation: string
  organization: Ics208hmOrganizationAssignments
  entryTeam: Ics208hmEntryTeamRow[]
  materials: Ics208hmMaterialRow[]
  lelInstruments: string
  o2Instruments: string
  toxicityPpmInstruments: string
  radiologicalInstruments: string
  hazardMonitoringComment: string
  standardDeconProceduresYesNo: Ics208hmYesNo
  decontaminationProceduresComment: string
  commandFrequency: string
  tacticalFrequency: string
  entryFrequency: string
  medicalMonitoringYesNo: Ics208hmYesNo
  medicalTreatmentTransportInPlaceYesNo: Ics208hmYesNo
  medicalAssistanceComment: string
  siteMap: string
  siteMapIncludes: Ics208hmSiteMapIncludes
  entryObjectives: string
  sopModificationsYesNo: Ics208hmYesNo
  sopModificationsComment: string
  emergencyProcedures: string
  asstSafetyOfficerHmSignature: string
  safetyBriefingCompletedTime: string
  hmGroupSupervisorSignature: string
  incidentCommanderSignature: string
}

export type Ics208hmVersion = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics208hmFormState
  signatures: Ics201VersionSignature[]
}

export type Ics208hmDocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics208hmFormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics208hmVersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics208hmFormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics208hmDocumentBundle = {
  document: Ics208hmDocumentRow
  versions: Ics208hmVersion[]
}

export type Ics208hmSectionId =
  | 'incident-info'
  | 'site-information'
  | 'organization'
  | 'hazard-risk-analysis'
  | 'hazard-monitoring'
  | 'decontamination-procedures'
  | 'site-communications'
  | 'medical-assistance'
  | 'site-map'
  | 'entry-objectives'
  | 'sop-safe-work-practices'
  | 'emergency-procedures'
  | 'safety-briefing'

export type Ics208hmIncidentInfoDraft = Pick<
  Ics208hmFormState,
  | 'incidentName'
  | 'datePrepared'
  | 'operationalPeriodDateFrom'
  | 'operationalPeriodDateTo'
  | 'operationalPeriodTimeFrom'
  | 'operationalPeriodTimeTo'
>

export type Ics208hmSiteInformationDraft = Pick<Ics208hmFormState, 'incidentLocation'>

export type Ics208hmOrganizationDraft = Pick<
  Ics208hmFormState,
  'organization' | 'entryTeam'
>

export type Ics208hmHazardMonitoringDraft = Pick<
  Ics208hmFormState,
  | 'lelInstruments'
  | 'o2Instruments'
  | 'toxicityPpmInstruments'
  | 'radiologicalInstruments'
  | 'hazardMonitoringComment'
>

export type Ics208hmDecontaminationProceduresDraft = Pick<
  Ics208hmFormState,
  'standardDeconProceduresYesNo' | 'decontaminationProceduresComment'
>

export type Ics208hmSiteCommunicationsDraft = Pick<
  Ics208hmFormState,
  'commandFrequency' | 'tacticalFrequency' | 'entryFrequency'
>

export type Ics208hmMedicalAssistanceDraft = Pick<
  Ics208hmFormState,
  'medicalMonitoringYesNo' | 'medicalTreatmentTransportInPlaceYesNo' | 'medicalAssistanceComment'
>

export type Ics208hmSiteMapDraft = Pick<Ics208hmFormState, 'siteMap' | 'siteMapIncludes'>

export type Ics208hmSopSafeWorkPracticesDraft = Pick<
  Ics208hmFormState,
  'sopModificationsYesNo' | 'sopModificationsComment'
>

export type Ics208hmSafetyBriefingDraft = Pick<
  Ics208hmFormState,
  | 'asstSafetyOfficerHmSignature'
  | 'safetyBriefingCompletedTime'
  | 'hmGroupSupervisorSignature'
  | 'incidentCommanderSignature'
>

export type Ics208hmFormSectionDrafts = {
  'incident-info'?: Ics208hmIncidentInfoDraft
  'site-information'?: Ics208hmSiteInformationDraft
  organization?: Ics208hmOrganizationDraft
  'hazard-risk-analysis'?: Ics208hmMaterialRow[]
  'hazard-monitoring'?: Ics208hmHazardMonitoringDraft
  'decontamination-procedures'?: Ics208hmDecontaminationProceduresDraft
  'site-communications'?: Ics208hmSiteCommunicationsDraft
  'medical-assistance'?: Ics208hmMedicalAssistanceDraft
  'site-map'?: Ics208hmSiteMapDraft
  'entry-objectives'?: Pick<Ics208hmFormState, 'entryObjectives'>
  'sop-safe-work-practices'?: Ics208hmSopSafeWorkPracticesDraft
  'emergency-procedures'?: Pick<Ics208hmFormState, 'emergencyProcedures'>
  'safety-briefing'?: Ics208hmSafetyBriefingDraft
}
